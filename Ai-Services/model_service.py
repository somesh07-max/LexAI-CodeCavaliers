"""Thin adapter around the AI implementations already in this repository."""

import asyncio
import json
import os
import sys
from pathlib import Path

import httpx

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
RAG_ROOT = Path(__file__).parent / "ai_tutor_project (1)" / "ai_tutor_project"


def rag_ready() -> bool:
    return bool(os.getenv("GEMINI_API_KEY")) and (RAG_ROOT / "vector_db" / "index.faiss").exists()


def prepare_rag():
    if str(RAG_ROOT) not in sys.path:
        sys.path.insert(0, str(RAG_ROOT))


async def ollama(prompt: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            )
            response.raise_for_status()
        return response.json()["response"].strip()
    except (httpx.HTTPError, KeyError) as error:
        raise RuntimeError(f"Start Ollama with the '{OLLAMA_MODEL}' model, or configure the included RAG service.") from error


async def generate_response(conversation_id: str, message: str) -> str:
    if not rag_ready():
        return await ollama(message)
    prepare_rag()
    from ai_tutor import answer_question
    result = await asyncio.to_thread(answer_question, message, conversation_id=conversation_id)
    return result.get("answer", "") if isinstance(result, dict) else str(result)


async def translate_text(text: str, target_language: str) -> str:
    if not rag_ready():
        return await ollama(f"Translate this into {target_language}. Return only the translation.\n\n{text}")
    prepare_rag()
    from ai_tutor import translate
    return str(await asyncio.to_thread(translate, text, target_language=target_language))


async def generate_quiz(subject: str, topic: str, language: str, count: int) -> list[dict]:
    prompt = (
        f"Create {count} multiple-choice questions about {topic} in {subject}, in {language}. "
        "Return only a JSON array. Each item needs questionText, four options, "
        "correctAnswer matching one option, and explanation."
    )
    raw = await ollama(prompt)
    cleaned = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        questions = json.loads(cleaned)
    except json.JSONDecodeError as error:
        raise RuntimeError("The AI returned an invalid quiz. Please try again.") from error
    if not isinstance(questions, list) or len(questions) != count:
        raise RuntimeError("The AI returned an incomplete quiz. Please try again.")
    return questions


def get_provider_status() -> dict:
    return {"provider": "rag" if rag_ready() else "ollama", "ragReady": rag_ready()}

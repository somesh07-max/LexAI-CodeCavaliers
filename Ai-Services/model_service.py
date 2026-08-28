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
"""
model_service.py
-----------------
Bridges the FastAPI endpoints in main.py to your actual AI tutor engine:

    ai_tutor/vector_store.py -> load_vectorstore() (FAISS index on disk)
    ai_tutor/retriever.py    -> retrieve() / build_context_string() / format_sources()
    ai_tutor/rag.py          -> generate_answer() (RAG + chat history)
    ai_tutor/translator.py   -> translate() (Sarvam)

This REPLACES the old Ollama/httpx implementation. There is no second
process to run anymore — no "python test_terminal.py" step. FastAPI is
now the thing that runs your model.

Because your retriever.py returns structured sources (document/page/
subject/unit) as well as the context string, /generate now returns
`sources` alongside `response` (see the updated GenerateResponse in
schemas.py). Node's message.controller.js currently only reads
data.response, so this is backward compatible - but the source list
is there if/when you want to store or display it.
"""

import asyncio

from ai_tutor import config
from ai_tutor.vector_store import load_vectorstore
from ai_tutor.retriever import retrieve, build_context_string, format_sources
from ai_tutor.rag import generate_answer, build_chat_history_messages
from ai_tutor import translator

_vectorstore = None  # cached after first load, same pattern as llm.py's _llm


def _get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = load_vectorstore()
        if _vectorstore is None:
            raise RuntimeError(
                f"No vector store found at {config.VECTOR_DB_PATH}. "
                "Run ingest.py first to build the knowledge base."
            )
    return _vectorstore


def _retrieve(question: str):
    """Blocking: FAISS similarity search + doc formatting. Returns (context, sources)."""
    vectorstore = _get_vectorstore()
    docs = retrieve(vectorstore, question)
    context = build_context_string(docs)
    sources = format_sources(docs)
    return context, sources


# --------------------------------------------------------------
# In-memory per-conversation history.
# --------------------------------------------------------------
# Your Node side (message.controller.js) already persists every
# message to Mongo, keyed by conversation_id, but it never sends
# prior turns to FastAPI - it only sends {conversation_id, message}.
# So FastAPI needs *some* record of "chat_history" to build the
# HumanMessage/AIMessage pairs rag.py expects.
#
# This dict works for local testing but resets whenever you restart
# uvicorn, and won't be correct if you ever run more than one FastAPI
# worker/process (each gets its own memory). For anything beyond a
# single-process dev server, either:
#   (a) have Node send the recent turns in the request body, or
#   (b) have FastAPI read them from Mongo/your DB directly.
# --------------------------------------------------------------
_conversation_history: dict[str, list[dict]] = {}


async def generate_response(conversation_id: str, message: str) -> tuple[str, list[dict]]:
    """
    Takes the student's message, returns (answer, sources).
    Called by POST /generate (see main.py).
    """
    # Both retrieval (embeddings + FAISS search) and generate_answer()
    # (Gemini call via LangChain) are synchronous/blocking. Running
    # them directly inside an `async def` would freeze the whole
    # FastAPI event loop for every other in-flight request, so both
    # go through asyncio.to_thread().
    context, sources = await asyncio.to_thread(_retrieve, message)

    turns = _conversation_history.get(conversation_id, [])
    chat_history_messages = build_chat_history_messages(turns)

    answer = await asyncio.to_thread(
        generate_answer, message, context, chat_history_messages
    )

    turns.append({"question": message, "answer": answer})
    _conversation_history[conversation_id] = turns

    return answer, sources


async def translate_text(text: str, target_language: str) -> str:
    """
    Takes text + a target language, returns the translated text.
    Called by POST /translate (see main.py).
    """
    return await asyncio.to_thread(translator.translate, text, target_language)

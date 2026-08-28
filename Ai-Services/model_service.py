
"""
This file is where your friend plugs in the real AI model.
 
Right now both functions call a local Ollama model as a placeholder,
so the Node backend can already connect and get real responses back.
When the real model is ready, just replace what's INSIDE these two
functions. Keep the function names and inputs/outputs the same, and
main.py never needs to change.
"""
from ai_tutor import answer_question, translate


async def generate_response(conversation_id: str, message: str) -> str:
    """
    Calls the AI Tutor model.

    FastAPI receives:
        conversation_id
        message

    Your AI Tutor handles:
        RAG retrieval
        Gemini answer generation
        conversation history

    Returns only the generated answer string because
    the existing FastAPI API expects `response: str`.
    """

    result = answer_question(
        message,
        conversation_id=conversation_id
    )

    return result["answer"]


async def translate_text(
    text: str,
    target_language: str
) -> str:
    """
    Calls the AI Tutor translation service.

    Translation is handled by your existing translator.py
    implementation (Sarvam).
    """

    return translate(
        text,
        target_language=target_language
    )

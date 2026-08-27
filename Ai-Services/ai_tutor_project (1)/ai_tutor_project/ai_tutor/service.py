"""
ai_tutor/service.py
----------------------
AI TUTOR SERVICE layer - the ONE place that ties retrieval + RAG +
translation together into the two functions everything else calls:

    answer_question(question, conversation_id=None) -> dict
    translate(text, target_language, source_language="en") -> str

Both the terminal tester (test_terminal.py) and the FastAPI backend
(via backend_integration/model_service.py) call these exact functions -
there is no separate "terminal implementation" vs "API implementation".

    Terminal / FastAPI
            |
      answer_question() / translate()   <- this file
            |
    retriever.py + rag.py + translator.py
            |
      vector_store.py (FAISS) + llm.py (Gemini)

The vector store is loaded once, lazily, on first use, and reused for
every subsequent call (see _get_vectorstore()).
"""

from ai_tutor import retriever as retriever_module
from ai_tutor.rag import build_chat_history_messages, generate_answer
from ai_tutor.translator import translate as translate_text
from ai_tutor.vector_store import load_vectorstore

_vectorstore = None  # lazy-loaded singleton

# In-memory conversation history: conversation_id -> [{"question":.., "answer":..}, ...]
# NOTE: this resets when the process restarts. Good enough for an MVP;
# swap for a persistent store (DB/Redis) later without changing the
# answer_question() interface.
_conversation_memory: dict[str, list[dict]] = {}


def _get_vectorstore():
    """Loads the FAISS vector store once and reuses it for every question."""
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = load_vectorstore()
        if _vectorstore is None:
            raise RuntimeError(
                "No vector store found. Run `python ingest.py` first to index "
                "the PDFs in data/pdfs/."
            )
    return _vectorstore


def answer_question(question: str, conversation_id: str | None = None) -> dict:
    """
    The main RAG entry point.

    Returns:
        {
            "answer": str,
            "language": "en",
            "sources": [{"document": "...", "page": N, ...}, ...]
        }

    Raises RuntimeError (with a clear, non-sensitive message) on
    configuration or API failures - callers (FastAPI routes, the
    terminal script) are expected to catch this and respond gracefully.
    """
    if not question or not question.strip():
        raise ValueError("Question must not be empty.")

    vectorstore = _get_vectorstore()
    retrieved = retriever_module.retrieve(vectorstore, question)

    if not retrieved:
        return {
            "answer": "I couldn't find this information in the knowledge base.",
            "language": "en",
            "sources": [],
        }

    context = retriever_module.build_context_string(retrieved)
    sources = retriever_module.format_sources(retrieved)

    history = _conversation_memory.get(conversation_id, []) if conversation_id else []
    chat_history_messages = build_chat_history_messages(history)

    answer = generate_answer(question, context, chat_history_messages)

    if conversation_id:
        history.append({"question": question, "answer": answer})
        _conversation_memory[conversation_id] = history[-(10):]  # small safety cap

    return {"answer": answer, "language": "en", "sources": sources}


def translate(text: str, target_language: str, source_language: str = "en") -> str:
    """
    Translates already-generated text into the requested language,
    preserving technical terms. Does NOT re-run retrieval/generation -
    it only translates the text it's given.
    """
    if not text or not text.strip():
        raise ValueError("Text to translate must not be empty.")
    if not target_language:
        raise ValueError("target_language must be provided.")

    return translate_text(text, target_language=target_language, source_language=source_language)

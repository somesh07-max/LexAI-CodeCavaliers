"""
ai_tutor
--------
A backend-agnostic RAG module: PDFs -> FAISS -> retriever -> Gemini.

The only two functions other code (FastAPI, a terminal script, tests)
should ever need are re-exported here:

    from ai_tutor import answer_question, translate

Everything else (embeddings, vector store, retriever, prompts, llm)
is an internal implementation detail of this package.
"""

from ai_tutor.service import answer_question, translate

__all__ = ["answer_question", "translate"]

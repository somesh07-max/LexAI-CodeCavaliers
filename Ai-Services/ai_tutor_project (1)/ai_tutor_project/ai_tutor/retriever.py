"""
ai_tutor/retriever.py
------------------------
RETRIEVAL layer. Wraps the FAISS vector store as a LangChain retriever
and turns retrieved Documents into (a) a context string for the LLM
prompt and (b) structured source metadata for the API response.
"""

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from ai_tutor import config


def get_retriever(vectorstore: FAISS, k: int = None):
    k = k or config.TOP_K
    return vectorstore.as_retriever(search_kwargs={"k": k})


def retrieve(vectorstore: FAISS, question: str, k: int = None) -> list[Document]:
    """Runs similarity search and returns the top-K relevant Documents (with metadata)."""
    retriever = get_retriever(vectorstore, k)
    return retriever.invoke(question)


def build_context_string(documents: list[Document]) -> str:
    """Joins retrieved chunks into one context block, each labelled with its source/page."""
    parts = []
    for doc in documents:
        label = f"[{doc.metadata.get('source', 'document')}, Page {doc.metadata.get('page', '?')}]"
        parts.append(f"{label}\n{doc.page_content}")
    return "\n\n".join(parts)


def format_sources(documents: list[Document]) -> list[dict]:
    """
    De-duplicated, structured source list for the API response, e.g.:
    [{"document": "notes.pdf", "page": 12, "subject": "...", "unit": "..."}]
    Only includes metadata that actually exists - never fabricates page numbers.
    """
    seen = set()
    sources = []
    for doc in documents:
        source = doc.metadata.get("source", "document")
        page = doc.metadata.get("page")
        key = (source, page)
        if key in seen:
            continue
        seen.add(key)
        entry = {"document": source, "page": page}
        if doc.metadata.get("subject"):
            entry["subject"] = doc.metadata["subject"]
        if doc.metadata.get("unit"):
            entry["unit"] = doc.metadata["unit"]
        sources.append(entry)
    return sources

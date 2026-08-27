"""
ai_tutor/vector_store.py
--------------------------
VECTOR DATABASE layer. Wraps LangChain's FAISS vector store as a
single combined index for the whole PDF knowledge base (as opposed
to one index per PDF) - because here the PDFs are a fixed, shared
knowledge base, not something re-uploaded per session.

    chunked Documents -> embeddings -> FAISS -> vector_db/ (on disk)

Chosen because FAISS is local, free, has no server to run, and is a
drop-in-replaceable LangChain VectorStore - swapping it later for
Chroma/Pinecone/Weaviate/etc. only means editing this file.
"""

import os

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from ai_tutor import config
from ai_tutor.embeddings import get_embeddings


def load_vectorstore() -> FAISS | None:
    """Returns the existing vector store, or None if it hasn't been built yet."""
    index_file = os.path.join(config.VECTOR_DB_PATH, "index.faiss")
    if not os.path.exists(index_file):
        return None
    embeddings = get_embeddings()
    # allow_dangerous_deserialization is safe here: we only ever load an
    # index this same application wrote to its own local vector_db/ folder.
    return FAISS.load_local(config.VECTOR_DB_PATH, embeddings, allow_dangerous_deserialization=True)


def save_vectorstore(vectorstore: FAISS):
    os.makedirs(config.VECTOR_DB_PATH, exist_ok=True)
    vectorstore.save_local(config.VECTOR_DB_PATH)


def build_vectorstore(chunks: list[Document]) -> FAISS:
    """Embeds chunks and builds a brand-new FAISS index from them."""
    embeddings = get_embeddings()
    return FAISS.from_documents(chunks, embeddings)


def add_to_vectorstore(vectorstore: FAISS, chunks: list[Document]) -> FAISS:
    """Embeds and merges new chunks into an existing FAISS index (incremental re-index)."""
    vectorstore.add_documents(chunks)
    return vectorstore


def upsert_chunks(chunks: list[Document]) -> FAISS:
    """
    Creates the vector store if it doesn't exist yet, otherwise merges
    new chunks into the existing one. Either way, saves the result and
    returns it. This is what ingest.py calls.
    """
    vectorstore = load_vectorstore()
    if vectorstore is None:
        vectorstore = build_vectorstore(chunks)
    else:
        vectorstore = add_to_vectorstore(vectorstore, chunks)
    save_vectorstore(vectorstore)
    return vectorstore

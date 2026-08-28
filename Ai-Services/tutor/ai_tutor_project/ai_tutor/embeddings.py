"""
ai_tutor/embeddings.py
------------------------
Loads the Sentence-Transformer embedding model once (via
langchain_huggingface) and reuses it for both ingestion and
question-time retrieval. Nothing else in the project should
construct its own embeddings model.
"""

from langchain_huggingface import HuggingFaceEmbeddings

from ai_tutor import config

_embeddings = None  # lazy-loaded singleton


def get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name=config.EMBEDDING_MODEL)
    return _embeddings

"""
ai_tutor/ingestion.py
-----------------------
DOCUMENT INGESTION layer - turns the PDFs sitting in data/pdfs/ into
chunked LangChain Documents, ready to be embedded and stored.

    data/pdfs/*.pdf -> per-page text (PyMuPDF) -> LangChain Documents
    -> RecursiveCharacterTextSplitter -> chunked Documents

Also tracks a small on-disk manifest (vector_db/manifest.json) mapping
each PDF filename to a content hash, so `python ingest.py` only
re-embeds PDFs that are new or have changed - it never rebuilds the
whole vector store just because it was run again.
"""

import hashlib
import json
import os

import pymupdf as fitz
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from ai_tutor import config


def list_pdf_files(pdf_dir: str = None) -> list[str]:
    """Returns full paths of every .pdf file directly inside pdf_dir."""
    pdf_dir = pdf_dir or config.PDF_DIR
    if not os.path.isdir(pdf_dir):
        raise FileNotFoundError(
            f"PDF folder '{pdf_dir}' does not exist. Create it and add your PDFs."
        )
    files = [
        os.path.join(pdf_dir, f) for f in sorted(os.listdir(pdf_dir)) if f.lower().endswith(".pdf")
    ]
    if not files:
        raise FileNotFoundError(f"No PDF files found in '{pdf_dir}'.")
    return files


def _file_hash(path: str) -> str:
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()[:12]


def load_pdf_documents(path: str) -> list[Document]:
    """
    Extracts one Document per page (with real page numbers, never
    fabricated), tagging each with the filename and any optional
    subject/unit metadata configured for that file in config.PDF_METADATA.
    """
    filename = os.path.basename(path)
    extra_meta = config.PDF_METADATA.get(filename, {})

    doc = fitz.open(path)
    documents = []
    for i, page in enumerate(doc):
        text = page.get_text("text").strip()
        if text:
            metadata = {"source": filename, "page": i + 1, **extra_meta}
            documents.append(Document(page_content=text, metadata=metadata))
    doc.close()
    return documents


def split_documents(documents: list[Document]) -> list[Document]:
    """Splits page-level Documents into chunks, preserving metadata."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.CHUNK_SIZE,
        chunk_overlap=config.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_documents(documents)


# ---------------------------------------------------------------
# Manifest: which PDFs (by content hash) are already indexed
# ---------------------------------------------------------------
def _load_manifest() -> dict:
    if not os.path.exists(config.MANIFEST_PATH):
        return {}
    try:
        with open(config.MANIFEST_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def _save_manifest(manifest: dict):
    os.makedirs(config.VECTOR_DB_PATH, exist_ok=True)
    with open(config.MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)


def find_new_or_changed_pdfs(pdf_dir: str = None) -> tuple[list[str], dict]:
    """
    Compares data/pdfs/ against the saved manifest.
    Returns (paths_to_index, updated_manifest) - paths_to_index is empty
    if every PDF is already indexed and unchanged.
    """
    manifest = _load_manifest()
    to_index = []
    for path in list_pdf_files(pdf_dir):
        filename = os.path.basename(path)
        current_hash = _file_hash(path)
        if manifest.get(filename) != current_hash:
            to_index.append(path)
        manifest[filename] = current_hash
    return to_index, manifest


def mark_indexed(manifest: dict):
    _save_manifest(manifest)


def process_pdfs(paths: list[str]) -> list[Document]:
    """Full ingestion pipeline for a specific list of PDF paths -> chunked Documents."""
    all_chunks = []
    for path in paths:
        page_documents = load_pdf_documents(path)
        if not page_documents:
            print(f"  Warning: no extractable text in '{os.path.basename(path)}', skipping.")
            continue
        chunks = split_documents(page_documents)
        all_chunks.extend(chunks)
        print(f"  {os.path.basename(path)}: {len(page_documents)} pages -> {len(chunks)} chunks")
    return all_chunks

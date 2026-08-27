"""
ingest.py
----------
Run this to (re)index the PDFs in data/pdfs/ into the local FAISS
vector store:

    python ingest.py

Only NEW or CHANGED PDFs are embedded (tracked via vector_db/manifest.json
- a content hash per file) - running this again after adding one more
PDF does not re-embed everything from scratch.

This is a separate step from question-answering on purpose: the app
should never recreate embeddings just because a question came in.
"""

from ai_tutor import config
from ai_tutor.ingestion import find_new_or_changed_pdfs, mark_indexed, process_pdfs
from ai_tutor.vector_store import upsert_chunks


def main():
    print(f"Scanning '{config.PDF_DIR}' for PDFs ...")
    to_index, manifest = find_new_or_changed_pdfs()

    if not to_index:
        print("Nothing to do - every PDF is already indexed and unchanged.")
        return

    print(f"Found {len(to_index)} new/changed PDF(s):")
    chunks = process_pdfs(to_index)

    if not chunks:
        print("No text could be extracted from the new/changed PDFs. Nothing indexed.")
        return

    print(f"Embedding and indexing {len(chunks)} chunks with '{config.EMBEDDING_MODEL}' ...")
    upsert_chunks(chunks)
    mark_indexed(manifest)

    print(f"Done. Vector store saved to '{config.VECTOR_DB_PATH}'.")
    print("You can now run: python test_terminal.py")


if __name__ == "__main__":
    main()

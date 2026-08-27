"""
ai_tutor/config.py
-------------------
Every tunable setting lives here - no hardcoded paths, model names,
or magic numbers anywhere else in the module.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------
# Gemini (via LangChain's langchain_google_genai)
# ---------------------------------------------------------------
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
LLM_TEMPERATURE = 0.2

# ---------------------------------------------------------------
# Embeddings - multilingual, so retrieval and future Indian-language
# queries both work well against the (currently English) PDFs.
# ---------------------------------------------------------------
EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)

# ---------------------------------------------------------------
# Paths
# ---------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_DIR = os.getenv("PDF_DIR", os.path.join(BASE_DIR, "data", "pdfs"))
VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", os.path.join(BASE_DIR, "vector_db"))
MANIFEST_PATH = os.path.join(VECTOR_DB_PATH, "manifest.json")

# ---------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "800"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))

# ---------------------------------------------------------------
# Retrieval
# ---------------------------------------------------------------
TOP_K = int(os.getenv("TOP_K", "4"))

# ---------------------------------------------------------------
# Conversational memory (in-memory, keyed by conversation_id)
# ---------------------------------------------------------------
MAX_HISTORY_TURNS = 3

# ---------------------------------------------------------------
# Optional per-PDF metadata (subject / unit / topic), keyed by filename.
# Purely optional - ingestion works fine without an entry here.
# Add entries as you add PDFs, e.g.:
#   "physics_notes.pdf": {"subject": "Physics", "unit": "Semiconductors"},
# ---------------------------------------------------------------
PDF_METADATA = {
    "Semiconductors_Theory.pdf": {"subject": "Electrical Engineering", "unit": "Semiconductor Theory"},
}

# ---------------------------------------------------------------
# Translation provider selection
# "gemini"    - always translate via Gemini (default - zero extra setup,
#               no wasted timeout trying a provider that isn't configured)
# "bhashini"  - try Bhashini first, fall back to Gemini if it fails
# ---------------------------------------------------------------
TRANSLATION_PROVIDER = os.getenv("TRANSLATION_PROVIDER", "gemini").lower()


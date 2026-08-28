# AI Tutor - Backend RAG Module (no Streamlit)

A production-structured, LangChain-based RAG module: a fixed set of
PDFs is the trusted knowledge base, questions are answered only from
that knowledge base via Gemini, and answers can be translated into
Indian languages while preserving technical terms. Built to be called
from a terminal script today and a FastAPI backend tomorrow, through
the exact same two functions.

```
data/pdfs/*.pdf  →  ingest.py  →  vector_db/ (FAISS, local)
                                        │
Terminal / FastAPI  →  answer_question() / translate()   (ai_tutor/service.py)
                                        │
                          retriever.py + rag.py + translator.py
                                        │
                            vector_store.py (FAISS) + llm.py (Gemini)
```

---

## 1. Project structure

```
ai_tutor_project/
├── ai_tutor/                     # the RAG module - framework-agnostic
│   ├── __init__.py                # exports answer_question(), translate()
│   ├── config.py                   # every setting: models, paths, languages, chunking
│   ├── glossary.py                  # small technical-term list protected during translation
│   ├── llm.py                        # the ONLY place ChatGoogleGenerativeAI is constructed
│   ├── embeddings.py                  # the ONLY place the embedding model is constructed
│   ├── ingestion.py                    # PDF -> Documents -> chunks, + change-detection manifest
│   ├── vector_store.py                  # FAISS build / save / load / merge
│   ├── retriever.py                      # similarity search + context/source formatting
│   ├── rag.py                             # ChatPromptTemplate + Gemini call (conversational)
│   ├── prompts.py                          # the RAG system prompt
│   ├── translator.py                        # translate() - Bhashini + Gemini fallback
│   └── service.py                            # AI TUTOR SERVICE layer - the public interface
│
├── data/pdfs/                     # preloaded knowledge base (add PDFs here)
├── vector_db/                      # FAISS index + manifest.json (built by ingest.py)
│
├── ingest.py                        # `python ingest.py` - builds/updates the vector store
├── test_terminal.py                  # `python test_terminal.py` - talk to the tutor directly
│
├── backend_integration/               # exactly what to change in your friend's FastAPI repo
│   ├── model_service.py                # drop-in replacement (same function signatures)
│   └── README_INTEGRATION.md            # detailed diff/explanation
│
├── .env / .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

**No Streamlit anywhere.** `ai_tutor/` has zero dependency on any UI
framework - it's plain Python functions and classes, callable from a
script, a test, or an HTTP route.

---

## 2. Installation

```bash
python -m venv venv
```
Windows: `venv\Scripts\activate` · macOS/Linux: `source venv/bin/activate`

```bash
pip install -r requirements.txt
```

> First run downloads the multilingual Sentence-Transformer embedding
> model (~450 MB, larger than an English-only model because it covers
> Indian languages too) - do this with internet access before ingesting.

---

## 3. Environment variables

```bash
cp .env.example .env      # macOS/Linux
copy .env.example .env    # Windows
```

Set at minimum:
```
GEMINI_API_KEY=your_real_key_here
```
Get a key from https://aistudio.google.com/apikey. Gemini's free tier,
quotas, and pricing can change - check https://ai.google.dev/pricing
before a demo. `GEMINI_MODEL` and every other setting in `.env.example`
is optional and has a sensible default in `ai_tutor/config.py`.

For Bhashini (optional - see section 8), also set `BHASHINI_USER_ID`
and `BHASHINI_API_KEY`.

---

## 4. Adding PDFs to the knowledge base

Drop any number of PDF files into `data/pdfs/`. That's it - no upload
UI, no per-session state. These PDFs are the tutor's permanent,
trusted knowledge base.

Optionally, give a PDF a `subject`/`unit` label (shown in source
citations) by adding an entry to `PDF_METADATA` in `ai_tutor/config.py`:

```python
PDF_METADATA = {
    "Semiconductors_Theory.pdf": {"subject": "Electrical Engineering", "unit": "Semiconductor Theory"},
    "your_new_file.pdf": {"subject": "...", "unit": "..."},
}
```
This is entirely optional - ingestion works fine for a PDF with no
entry here, it just won't have a `subject`/`unit` in its source citations.

---

## 5. Running ingestion

```bash
python ingest.py
```

This is a **separate step from question-answering on purpose** (per
your requirement): it reads every PDF in `data/pdfs/`, extracts
page-tagged text, splits it into chunks, embeds them, and stores them
in the local FAISS index at `vector_db/`.

**It's incremental.** `vector_db/manifest.json` tracks a content hash
per PDF filename. Running `python ingest.py` again after adding one
more PDF only embeds the *new* file - it does not recreate embeddings
for PDFs that haven't changed. If you replace a PDF with a different
version (same filename, different content), its changed hash is
detected and it gets re-indexed too.

Run this once after adding/changing PDFs, then start the app (terminal
tester or FastAPI) - question-answering never re-embeds anything itself.

---

## 6. Testing from the terminal

```bash
python test_terminal.py
```

```
Enter your question: What is a semiconductor?

Answer:
A semiconductor is a material whose forbidden energy band (the gap
between the valence band and conduction band) is smaller than an
insulator's...

Sources:
📄 Semiconductors_Theory.pdf — Page 7 (Electrical Engineering)

Language: English

Enter language code to also see it translated (e.g. hi), or press Enter to skip: hi

Translated (hi):
सेमीकंडक्टर एक ऐसी सामग्री है जिसका forbidden energy band...
```

**This is not a separate implementation.** `test_terminal.py` imports
and calls `ai_tutor.answer_question()` and `ai_tutor.translate()` -
the exact same functions the FastAPI integration calls. If it works
here, it works through FastAPI too.

The terminal keeps one running `conversation_id` ("terminal-session")
for the session, so follow-up questions use recent chat history the
same way a real conversation would.

---

## 7. How FastAPI calls the AI module

Your friend's existing backend (analyzed from the code you pasted) is:

```
POST /generate   {conversation_id, message}   -> {response: str}
POST /translate  {text, target_language}      -> {response: str}
```

both backed by two `async def` functions in `model_service.py`, which
currently call a local Ollama model as a placeholder - the file's own
docstring says to just replace what's *inside* those two functions and
keep `main.py` untouched. That's exactly what `backend_integration/model_service.py`
does:

- `generate_response(conversation_id, message)` now calls
  `ai_tutor.answer_question(message, conversation_id=conversation_id)` -
  a grounded, PDF-sourced English answer, with source citations
  appended as readable text (since the existing response schema is a
  single string field).
- `translate_text(text, target_language)` now calls
  `ai_tutor.translate(text, target_language=target_language)` directly -
  no re-generation, just translation of the text it's given.

**`main.py` and `schemas.py` need zero changes.** See
`backend_integration/README_INTEGRATION.md` for the full analysis and
exact steps to merge this into your friend's repo, plus an optional
(not required) schema enhancement if you later want structured
`sources` in the JSON response instead of appended text.

---

## 8. How multilingual output works

`/generate` always answers in **English** - grounded entirely in the
retrieved PDF chunks. `/translate` is a **separate, independent** call:
it takes any text and a target language code (`hi`, `te`, `mr`, `ta`,
`bn`, ...) and returns it translated, without touching retrieval or
generation at all. This matches your friend's existing route split
exactly.

Under the hood, `ai_tutor/translator.py`:
1. **Protects technical terms** - `ai_tutor/glossary.py` lists terms
   (voltage, semiconductor, covalent bond, valence electron, ...)
   that get swapped for placeholder tokens (`__TERM3__`) before
   translation, so they can't be mistranslated.
2. **Tries Bhashini first** (https://bhashini.gitbook.io/bhashini-apis) -
   a real 3-step API call, used when `BHASHINI_USER_ID`/`BHASHINI_API_KEY`
   are set in `.env`.
3. **Falls back to Gemini** for translation if Bhashini is unconfigured
   or the call fails - still a real API call (via `llm.py`), not a
   fake response, so `/translate` never breaks just because Bhashini
   credentials aren't set up yet. This fallback is the exact slot to
   swap in a locally-hosted `ai4bharat/indictrans2` model later - only
   `translator.py` would need to change.
4. **Restores the protected terms** verbatim after translation.

---

## 9. Architecture details (for your presentation)

### DOCUMENT INGESTION (`ai_tutor/ingestion.py`)
PyMuPDF extracts text **page by page** from every PDF in `data/pdfs/`,
producing one `langchain_core.documents.Document` per page with
metadata `{"source": filename, "page": N, ...optional subject/unit}` -
real page numbers, never fabricated. `RecursiveCharacterTextSplitter`
(chunk size 800, overlap 100, both configurable) then splits those into
smaller chunks, carrying metadata along automatically.

### VECTOR DATABASE (`ai_tutor/vector_store.py`)
Chunks are embedded with a multilingual Sentence-Transformer model
(`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`, local
and free) through `langchain_huggingface.HuggingFaceEmbeddings`, and
stored in a single combined `langchain_community.vectorstores.FAISS`
index at `vector_db/` (all PDFs share one index, since they're one
shared knowledge base, not per-session uploads). `upsert_chunks()`
creates the index on first run and **merges** new chunks into it on
later runs (`vectorstore.add_documents(...)`) - so growing the
knowledge base never means rebuilding it from scratch.

> **Note on FAISS via LangChain:** `langchain-community` (which hosts
> this FAISS integration) was archived/sunset by the LangChain team in
> June 2026 in favor of standalone integration packages. It still
> installs and works today, but if you're maintaining this past a
> hackathon, keep an eye on `https://github.com/langchain-ai/langchain-community/issues/674`
> for the migration path - swapping the vector store implementation
> only touches `vector_store.py`.

### RETRIEVAL (`ai_tutor/retriever.py`)
`vectorstore.as_retriever(search_kwargs={"k": 4})` returns the top-4
most similar chunks for a question. `build_context_string()` joins
them (labelled by source + page) for the LLM prompt; `format_sources()`
turns them into the structured `{"document": ..., "page": ..., ...}`
list returned to the caller - only ever from metadata that actually
exists, never fabricated.

### RAG / GEMINI (`ai_tutor/rag.py`, `ai_tutor/prompts.py`, `ai_tutor/llm.py`)
`RAG_PROMPT` (a `ChatPromptTemplate`) has a system message instructing
Gemini to answer **only** from the given context, say plainly when the
knowledge base doesn't cover something, explain simply, and preserve
terminology - plus a `MessagesPlaceholder("chat_history")` for the last
`MAX_HISTORY_TURNS` (3) exchanges of the current conversation, and the
new question. The filled prompt is piped (`RAG_PROMPT | llm`) into
`ChatGoogleGenerativeAI` from `llm.py`, the only file that builds the
Gemini client.

### AI TUTOR SERVICE (`ai_tutor/service.py`)
The single integration point: `answer_question(question, conversation_id)`
and `translate(text, target_language)`. It loads the FAISS index once
(lazy singleton, reused for every call - never reloaded per question),
keeps a small **in-memory** per-`conversation_id` history for
follow-up questions (resets on process restart - swap for a persistent
store later without changing the function signature), and is the
*only* place retrieval, RAG, and translation are wired together. Both
`test_terminal.py` and `backend_integration/model_service.py` call
these same two functions - there is exactly one AI implementation.

---

## 10. Performance notes

- The embedding model and Gemini client are lazy singletons
  (`embeddings.py`, `llm.py`) - built once on first use, reused for
  every subsequent call, never recreated per question.
- The FAISS vector store is loaded once (`service.py`'s
  `_get_vectorstore()`) and reused - not reloaded from disk per question.
- Ingestion is a separate, explicit step (`python ingest.py`) run only
  when PDFs change - question-answering never re-embeds anything.
- The first `python ingest.py` run and the first question after
  starting a fresh process will be slower (model/index initialization);
  subsequent questions are fast.

---

## 11. Error handling built in

- Missing `.env` / `GEMINI_API_KEY` → clear `RuntimeError` from `llm.py`,
  caught and turned into a friendly string in `model_service.py`.
- No vector store yet (`ingest.py` not run) → clear `RuntimeError` from
  `service.py` telling you to run it.
- PDF folder missing/empty → clear `FileNotFoundError` from `ingestion.py`.
- A PDF with no extractable text → skipped with a warning during
  ingestion, not a crash.
- Empty question or empty text-to-translate → `ValueError` with a
  clear message.
- No relevant chunks retrieved → `"I couldn't find this information in
  the knowledge base."` instead of a hallucinated answer.
- Gemini/Bhashini API errors → caught, wrapped in a `RuntimeError` with
  a readable (non-sensitive) message - no API keys are ever included
  in an error message or exposed to the caller.
- Bhashini failure or missing credentials → silently falls back to the
  Gemini-based translator instead of breaking `/translate`.

---

## 12. What to explain in a demo / to judges

> "The AI Tutor is a standalone RAG module built with LangChain,
> completely decoupled from any web framework. A set of trusted PDFs
> is ingested once - PyMuPDF extracts page-tagged text, LangChain
> splits it into chunks, a multilingual Sentence-Transformer model
> embeds them, and a local FAISS index stores them, so no PDF content
> ever needs to leave the machine. Adding a new PDF just means
> dropping it into a folder and re-running the ingestion script, which
> only embeds what's new. The module exposes exactly two functions -
> `answer_question` and `translate` - and both the terminal tester and
> the FastAPI backend call the identical functions, so there's one
> real AI implementation, not a demo version and a 'real' version.
> Questions are answered strictly from retrieved PDF context via
> Gemini, with the tutor explicitly told to say when something isn't
> in the knowledge base rather than guess. Translation is a separate,
> independent step - matching how the existing backend already splits
> `/generate` and `/translate` - so switching languages never
> re-triggers retrieval or generation, and a small glossary keeps
> technical terms like 'covalent bond' or 'API' intact across
> languages."

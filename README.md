# LexAI-CodeCavaliers
This is a git  hub Repo for SIH Prototype
# LexAi

LexAi is a multilingual AI tutoring workspace with a React frontend, an Express/MongoDB API, and a FastAPI AI adapter.

## Run the complete application

Install JavaScript and Python dependencies once:

```powershell
npm install
npm --prefix Frontend install
npm --prefix Backend install
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r Ai-Services/requirements.txt
```

Then start all three services from the repository root:

```powershell
npm run dev
```

Open `http://localhost:5173`. The API listens on port `3000`, the AI service on port `8000`, and MongoDB defaults to `mongodb://127.0.0.1:27017/lexai`.

The AI adapter uses the included RAG project when its Gemini key and generated FAISS index are available; otherwise it uses the existing Ollama integration.

"""
ai_tutor/llm.py
----------------
Thin wrapper around LangChain's Gemini chat model. This is the ONLY
file in the whole project that constructs the Gemini client -
rag.py and translator.py both import get_llm() from here.
"""

from langchain_google_genai import ChatGoogleGenerativeAI

from ai_tutor import config

_llm = None  # lazy-loaded singleton - built once, reused for every call


def get_llm() -> ChatGoogleGenerativeAI:
    global _llm
    if _llm is None:
        if not config.GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Add it to your .env file "
                "(see .env.example) and restart."
            )
        _llm = ChatGoogleGenerativeAI(
            model=config.GEMINI_MODEL,
            api_key=config.GEMINI_API_KEY,
            temperature=config.LLM_TEMPERATURE,
        )
    return _llm

def extract_text(response) -> str:
    content = response.content

    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts = []

        for item in content:
            if isinstance(item, dict):
                parts.append(item.get("text", ""))
            else:
                parts.append(str(item))

        return "".join(parts).strip()

    return str(content).strip()

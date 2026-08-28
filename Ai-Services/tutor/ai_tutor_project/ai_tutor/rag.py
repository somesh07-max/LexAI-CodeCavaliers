"""
ai_tutor/rag.py
------------------
RAG / GEMINI layer. Takes a question + retrieved context + recent
chat history, fills the ChatPromptTemplate from prompts.py, and calls
Gemini through the shared llm.py client.
"""

from langchain_core.messages import AIMessage, HumanMessage

from ai_tutor import config
from ai_tutor.llm import get_llm,extract_text
from ai_tutor.prompts import RAG_PROMPT

def build_chat_history_messages(turns: list[dict]) -> list:
    """
    Converts stored [{"question": ..., "answer": ...}, ...] turns into
    LangChain HumanMessage/AIMessage pairs for MessagesPlaceholder("chat_history").
    Only the most recent MAX_HISTORY_TURNS are used - we deliberately do
    NOT send unlimited history to Gemini.
    """
    recent = turns[-config.MAX_HISTORY_TURNS:]
    messages = []
    for turn in recent:
        messages.append(HumanMessage(content=turn["question"]))
        messages.append(AIMessage(content=turn["answer"]))
    return messages

def generate_answer(question: str, context: str, chat_history_messages: list) -> str:
    """
    Generates a grounded answer using Gemini.
    """
    try:
        llm = get_llm()
        chain = RAG_PROMPT | llm

        response = chain.invoke(
            {
                "context": context,
                "chat_history": chat_history_messages,
                "question": question,
            }
        )

        return extract_text(response)
    except Exception as exc:
        raise RuntimeError(
            f"Gemini API error while generating the answer: {exc}"
        ) from exc


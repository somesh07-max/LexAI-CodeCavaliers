from pydantic import BaseModel


class GenerateRequest(BaseModel):
    conversation_id: str
    message: str


class GenerateResponse(BaseModel):
    response: str
    sources: list[dict] = []  # new: from ai_tutor/retriever.py's format_sources()


class TranslateRequest(BaseModel):
    text: str
    target_language: str


class TranslateResponse(BaseModel):
    response: str

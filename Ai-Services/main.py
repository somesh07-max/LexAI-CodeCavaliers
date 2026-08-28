from fastapi import FastAPI, HTTPException

from schemas import GenerateRequest, GenerateResponse, TranslateRequest, TranslateResponse
from model_service import generate_response, translate_text

app = FastAPI()


@app.post("/generate", response_model=GenerateResponse)
async def generate(payload: GenerateRequest):
    """
    Called from message.controller.js -> createMessage()
    body sent by Node: { conversation_id, message }
    Node reads: data.response
    """
    try:
        text, sources = await generate_response(payload.conversation_id, payload.message)
    except RuntimeError as exc:
        # e.g. missing GEMINI_API_KEY, no vector store built yet, or a
        # Gemini API error raised inside ai_tutor/rag.py
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return GenerateResponse(response=text, sources=sources)


@app.post("/translate", response_model=TranslateResponse)
async def translate(payload: TranslateRequest):
    """
    Called from message.controller.js -> translateMessage()
    body sent by Node: { text, target_language }
    Node reads: data.response
    """
    try:
        translated = await translate_text(payload.text, payload.target_language)
    except RuntimeError as exc:
        # e.g. missing SARVAM_API_KEY, or a Sarvam API error
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return TranslateResponse(response=translated)


@app.get("/health")
async def health():
    return {"success": True, "status": "ok"}

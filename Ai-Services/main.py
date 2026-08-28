from fastapi import FastAPI

from schemas import (
    GenerateRequest,
    GenerateResponse,
    TranslateRequest,
    TranslateResponse,
)

from model_service import generate_response, translate_text


app = FastAPI()


@app.post("/generate", response_model=GenerateResponse)
async def generate(payload: GenerateRequest):
    """
    Called from message.controller.js -> createMessage()

    Request body:
    {
        "conversation_id": "...",
        "message": "..."
    }

    Response:
    {
        "response": "..."
    }
    """

    text = await generate_response(
        payload.conversation_id,
        payload.message,
    )

    return GenerateResponse(response=text)


@app.post("/translate", response_model=TranslateResponse)
async def translate(payload: TranslateRequest):
    """
    Called from message.controller.js -> translateMessage()

    Request body:
    {
        "text": "...",
        "target_language": "hi"
    }

    Response:
    {
        "response": "..."
    }
    """

    translated = await translate_text(
        payload.text,
        payload.target_language,
    )

    return TranslateResponse(response=translated)


@app.get("/health")
async def health():
    return {
        "success": True,
        "status": "ok",
    }

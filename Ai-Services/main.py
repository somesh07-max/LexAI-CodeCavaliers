from fastapi import FastAPI, HTTPException

from model_service import generate_quiz, generate_response, get_provider_status, translate_text
from schemas import GenerateRequest, GenerateResponse, QuizRequest, QuizResponse, TranslateRequest, TranslateResponse

app = FastAPI(title="LexAi AI Service", version="1.0.0")


def service_error(error: Exception) -> HTTPException:
    return HTTPException(status_code=503, detail=str(error))


@app.post("/generate", response_model=GenerateResponse)
async def generate(payload: GenerateRequest):
    try:
        return GenerateResponse(response=await generate_response(payload.conversation_id, payload.message))
    except Exception as error:
        raise service_error(error) from error


@app.post("/translate", response_model=TranslateResponse)
async def translate(payload: TranslateRequest):
    try:
        return TranslateResponse(response=await translate_text(payload.text, payload.target_language))
    except Exception as error:
        raise service_error(error) from error


@app.post("/quiz", response_model=QuizResponse)
async def quiz(payload: QuizRequest):
    try:
        questions = await generate_quiz(payload.subject, payload.topic, payload.language, payload.numberOfQuestions)
        return QuizResponse(questions=questions)
    except Exception as error:
        raise service_error(error) from error


@app.get("/health")
async def health():
    return {"success": True, "status": "ok", **get_provider_status()}

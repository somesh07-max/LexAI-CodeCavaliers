from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    conversation_id: str = Field(min_length=1)
    message: str = Field(min_length=1, max_length=10_000)


class GenerateResponse(BaseModel):
    response: str


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20_000)
    target_language: str = Field(min_length=2, max_length=50)


class TranslateResponse(BaseModel):
    response: str


class QuizRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=120)
    topic: str = Field(min_length=1, max_length=200)
    language: str = Field(min_length=2, max_length=50)
    numberOfQuestions: int = Field(ge=1, le=20)


class QuizQuestion(BaseModel):
    questionText: str
    options: list[str]
    correctAnswer: str
    explanation: str


class QuizResponse(BaseModel):
    questions: list[QuizQuestion]

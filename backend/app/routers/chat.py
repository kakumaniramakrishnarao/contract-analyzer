from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app import store
from app.config import MAX_QUESTION_CHARS
from app.llm import LLMError, answer_question

router = APIRouter()


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=10_000)


class ChatRequest(BaseModel):
    doc_id: str
    question: str = Field(max_length=MAX_QUESTION_CHARS)
    history: list[ChatTurn] = Field(default=[], max_length=50)


@router.post("/")
def chat(req: ChatRequest):
    record = store.load(req.doc_id)
    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found. Upload it again."
        )

    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question is empty.")

    try:
        return answer_question(
            record["text"],
            req.question.strip(),
            [t.model_dump() for t in req.history],
        )
    except LLMError as e:
        raise HTTPException(status_code=502, detail=str(e))

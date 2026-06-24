from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def chat():
    return {"message": "chat route ready"}
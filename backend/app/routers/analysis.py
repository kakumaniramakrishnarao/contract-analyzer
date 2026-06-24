from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def analyse():
    return {"message": "analysis route ready"}
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import upload, analysis, chat

# --- App instance ---
app = FastAPI(
    title="Contract Analyzer API",
    version="1.0.0"
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global exception handler ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "path": str(request.url)
        }
    )

# --- Routers ---
app.include_router(upload.router,   prefix="/upload",   tags=["Upload"])
app.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
app.include_router(chat.router,     prefix="/chat",     tags=["Chat"])

# --- Health check ---
@app.get("/health")
async def health_check():
    return {
        "success": True,
        "status": "server is running"
    }
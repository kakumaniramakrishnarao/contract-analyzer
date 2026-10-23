import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import FRONTEND_ORIGIN
from app.routers import upload, analysis, chat

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger(__name__)

# --- App instance ---
app = FastAPI(
    title="Contract Analyzer API",
    version="1.0.0"
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Error handlers ---
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Turn pydantic's error list into one readable line
    first = exc.errors()[0] if exc.errors() else {}
    field = ".".join(str(p) for p in first.get("loc", []) if p != "body")
    return JSONResponse(
        status_code=422,
        content={"detail": f"Invalid request: {field} {first.get('msg', '')}".strip()}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Details go to the server log, not to the browser
    log.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong on the server."}
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

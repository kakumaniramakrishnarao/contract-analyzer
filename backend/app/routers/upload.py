import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool

from app import config, store
from app.extractor import extract_text

log = logging.getLogger(__name__)

router = APIRouter()


@router.post("/")
async def upload_file(file: UploadFile = File(...)):

    # --- Guard 1: File type check ---
    ext = Path(file.filename or "").suffix.lower()
    if ext not in config.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Only PDF and DOCX are allowed."
        )

    # --- Guard 2: Size limit (read one byte past the limit so huge files stop early) ---
    max_bytes = config.MAX_FILE_SIZE_MB * 1024 * 1024
    contents = await file.read(max_bytes + 1)
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum allowed size is {config.MAX_FILE_SIZE_MB}MB."
        )

    # --- Guard 3: Empty file check ---
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # --- Guard 4: Contents must match the extension, not just the name ---
    if not contents.startswith(config.FILE_SIGNATURES[ext]):
        raise HTTPException(
            status_code=400,
            detail=f"This doesn't look like a real {ext[1:].upper()} file."
        )

    # --- Extract text (CPU-bound, keep it off the event loop) ---
    try:
        text = await run_in_threadpool(extract_text, contents, ext)
    except Exception:
        log.exception("Extraction failed for %s", file.filename)
        raise HTTPException(
            status_code=400,
            detail="Couldn't read this file. It may be corrupted or password-protected."
        )

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="No readable text found. Scanned PDFs aren't supported."
        )

    doc_id = str(uuid.uuid4())
    truncated = len(text) > config.MAX_CONTEXT_CHARS

    store.save(doc_id, {
        "filename":  file.filename,
        "text":      text,
        "truncated": truncated,
        "analysis":  None,
    })

    return {
        "success":    True,
        "doc_id":     doc_id,
        "filename":   file.filename,
        "size_kb":    round(len(contents) / 1024, 2),
        "char_count": len(text),
        "truncated":  truncated,
    }

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from app.config import MAX_FILE_SIZE_MB, UPLOAD_DIR, ALLOWED_EXTENSIONS
from app.extractor import extract_and_store

router = APIRouter()

# In-memory store: doc_id → file info
uploaded_docs = {}


@router.post("/")
async def upload_file(file: UploadFile = File(...)):

    # --- Guard 1: File type check ---
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Only PDF and DOCX are allowed."
        )

    # --- Guard 2: Read file into memory ---
    contents = await file.read()

    # --- Guard 3: Empty file check ---
    if len(contents) == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    # --- Guard 4: Size limit check ---
    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE_MB}MB."
        )

    # --- Assign unique doc_id ---
    doc_id = str(uuid.uuid4())

    # --- Save file to disk ---
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    save_path = os.path.join(UPLOAD_DIR, f"{doc_id}{ext}")

    with open(save_path, "wb") as f:
        f.write(contents)

    # --- Store mapping in memory ---
    uploaded_docs[doc_id] = {
        "filename": file.filename,
        "path":     save_path,
        "ext":      ext
    }

    return JSONResponse(
        status_code=200,
        content={
            "success":  True,
            "doc_id":   doc_id,
            "filename": file.filename,
            "size_kb":  round(len(contents) / 1024, 2),
            "message":  "File uploaded successfully."
        }
    )


@router.post("/{doc_id}/extract")
async def extract_text(doc_id: str):

    # --- Check doc_id exists ---
    if doc_id not in uploaded_docs:
        raise HTTPException(
            status_code=404,
            detail=f"No document found for doc_id: {doc_id}"
        )

    doc_info = uploaded_docs[doc_id]

    # --- Run extraction ---
    try:
        cleaned_text = extract_and_store(
            doc_id=doc_id,
            file_path=doc_info["path"],
            ext=doc_info["ext"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Extraction failed: {str(e)}"
        )

    return JSONResponse(
        status_code=200,
        content={
            "success":    True,
            "doc_id":     doc_id,
            "char_count": len(cleaned_text),
            "preview":    cleaned_text[:300],
            "message":    "Text extracted successfully."
        }
    )
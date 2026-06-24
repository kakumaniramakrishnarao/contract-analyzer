import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY   = os.getenv("OPENAI_API_KEY")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", 20))
UPLOAD_DIR       = "uploads"

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
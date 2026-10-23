import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parent.parent

OPENAI_API_KEY   = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL     = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", 20))
FRONTEND_ORIGIN  = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

# One JSON file per document (extracted text + analysis)
DATA_DIR = Path(os.getenv("DATA_DIR", BACKEND_DIR / "data"))

# Rough cap on how much contract text goes into a single prompt
MAX_CONTEXT_CHARS = 120_000
MAX_QUESTION_CHARS = 2_000

ALLOWED_EXTENSIONS = {".pdf", ".docx"}

# First bytes of a real file of each type (DOCX is a zip archive)
FILE_SIGNATURES = {
    ".pdf":  b"%PDF",
    ".docx": b"PK\x03\x04",
}

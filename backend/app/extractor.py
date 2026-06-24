import re
import pdfplumber
from docx import Document


# ── In-memory store: doc_id → cleaned text ──────────────────────────────────
extracted_texts: dict[str, str] = {}


# ── Shared cleaning function ─────────────────────────────────────────────────
def _clean_text(raw: str) -> str:
    """
    Strips noise that would pollute the LLM context:
    - Excessive blank lines (more than 2 in a row)
    - Trailing whitespace on each line
    - Page number artefacts like "Page 1 of 10" or standalone digits
    - Common header/footer noise (e.g. "CONFIDENTIAL")
    """
    # Remove "Page X of Y" patterns
    text = re.sub(r"page\s+\d+\s+of\s+\d+", "", raw, flags=re.IGNORECASE)

    # Remove standalone numbers on their own line (page numbers)
    text = re.sub(r"^\s*\d+\s*$", "", text, flags=re.MULTILINE)

    # Strip trailing whitespace from each line
    text = "\n".join(line.rstrip() for line in text.splitlines())

    # Collapse 3+ consecutive blank lines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


# ── PDF extraction ────────────────────────────────────────────────────────────
def _extract_pdf(file_path: str) -> str:
    """
    Uses pdfplumber to extract text page by page.
    Inserts a page marker between pages so the LLM
    knows where one page ends and the next begins.
    """
    pages = []

    with pdfplumber.open(file_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            page_text = page.extract_text()
            if page_text:
                pages.append(f"[Page {i}]\n{page_text}")

    return "\n\n".join(pages)


# ── DOCX extraction ───────────────────────────────────────────────────────────
def _extract_docx(file_path: str) -> str:
    """
    Uses python-docx to extract paragraphs.
    Headings are prefixed with ### so structure is preserved.
    Empty paragraphs are skipped.
    """
    doc = Document(file_path)
    lines = []

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue

        # Preserve heading hierarchy
        if para.style.name.startswith("Heading"):
            lines.append(f"### {text}")
        else:
            lines.append(text)

    return "\n\n".join(lines)


# ── Public entry point ────────────────────────────────────────────────────────
def extract_and_store(doc_id: str, file_path: str, ext: str) -> str:
    """
    Called by the extract endpoint.
    Picks the right extractor, cleans the output,
    stores it in memory, and returns the cleaned text.
    """
    if ext == ".pdf":
        raw = _extract_pdf(file_path)
    elif ext == ".docx":
        raw = _extract_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    cleaned = _clean_text(raw)
    extracted_texts[doc_id] = cleaned
    return cleaned


# ── Integration point for Stage 5 (LangChain pipeline) ───────────────────────
def get_extracted_text(doc_id: str) -> str | None:
    """
    Called by the LangChain analysis pipeline.
    Returns cleaned text for a given doc_id, or None if not found.
    This is the single swap point when Stage 4 → Stage 5 handoff happens.
    """
    return extracted_texts.get(doc_id)
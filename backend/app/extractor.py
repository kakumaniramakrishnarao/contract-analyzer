import io
import re

import pdfplumber
from docx import Document


# ── Shared cleaning function ─────────────────────────────────────────────────
def _clean_text(raw: str) -> str:
    """
    Strips noise that would pollute the LLM context:
    - Excessive blank lines (more than 2 in a row)
    - Trailing whitespace on each line
    - Page number artefacts like "Page 1 of 10" or standalone digits
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
def _extract_pdf(data: bytes) -> str:
    """
    Extracts text page by page and inserts a [Page N] marker before each page,
    so answers can point back to where a clause is.
    """
    pages = []

    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            page_text = page.extract_text()
            if page_text and page_text.strip():
                pages.append(f"[Page {i}]\n{page_text}")

    return "\n\n".join(pages)


# ── DOCX extraction ───────────────────────────────────────────────────────────
def _extract_docx(data: bytes) -> str:
    """
    Extracts paragraphs and table cells. Headings are prefixed with ###
    so structure is preserved. Empty paragraphs are skipped.
    """
    doc = Document(io.BytesIO(data))
    lines = []

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue

        if para.style.name.startswith("Heading"):
            lines.append(f"### {text}")
        else:
            lines.append(text)

    # Fee schedules etc. often live in tables
    for table in doc.tables:
        for row in table.rows:
            cells = [c.text.strip() for c in row.cells if c.text.strip()]
            if cells:
                lines.append(" | ".join(cells))

    return "\n\n".join(lines)


# ── Public entry point ────────────────────────────────────────────────────────
def extract_text(data: bytes, ext: str) -> str:
    if ext == ".pdf":
        raw = _extract_pdf(data)
    elif ext == ".docx":
        raw = _extract_docx(data)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    return _clean_text(raw)

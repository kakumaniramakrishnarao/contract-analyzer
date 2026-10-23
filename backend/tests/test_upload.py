import json

from app import config
from tests.conftest import docx_bytes, pdf_bytes, upload


def test_pdf_upload_extracts_text_with_page_markers(client):
    res = upload(client, pdf_bytes())
    assert res.status_code == 200
    body = res.json()
    assert body["char_count"] > 500
    assert body["truncated"] is False

    saved = json.loads((config.DATA_DIR / f"{body['doc_id']}.json").read_text())
    assert "[Page 1]" in saved["text"] and "[Page 3]" in saved["text"]
    assert "Page 1 of 3" not in saved["text"]  # footer noise stripped


def test_docx_upload_keeps_headings_and_tables(client):
    res = upload(client, docx_bytes(), "nda.docx")
    assert res.status_code == 200
    saved = json.loads((config.DATA_DIR / f"{res.json()['doc_id']}.json").read_text())
    assert "### 4. Governing Law" in saved["text"]
    assert "Breach penalty | $50,000" in saved["text"]


def test_rejects_wrong_extension(client):
    res = upload(client, b"hello", "notes.txt")
    assert res.status_code == 400
    assert "Only PDF and DOCX" in res.json()["detail"]


def test_rejects_empty_file(client):
    res = upload(client, b"")
    assert res.status_code == 400
    assert res.json()["detail"] == "Uploaded file is empty."


def test_rejects_renamed_file(client):
    res = upload(client, b"just some text pretending to be a pdf")
    assert res.status_code == 400
    assert "real PDF" in res.json()["detail"]


def test_rejects_corrupt_pdf(client):
    res = upload(client, b"%PDF-1.4 garbage that is not a pdf")
    assert res.status_code == 400
    assert "Couldn't read this file" in res.json()["detail"]


def test_rejects_oversized_file(client, monkeypatch):
    monkeypatch.setattr(config, "MAX_FILE_SIZE_MB", 0)
    res = upload(client, pdf_bytes())
    assert res.status_code == 400
    assert "too large" in res.json()["detail"]


def test_scanned_pdf_fails_at_upload(client):
    res = upload(client, pdf_bytes("scanned.pdf"))
    assert res.status_code == 422
    assert "Scanned PDFs" in res.json()["detail"]


def test_flags_long_contracts_as_truncated(client, monkeypatch):
    monkeypatch.setattr(config, "MAX_CONTEXT_CHARS", 100)
    res = upload(client, pdf_bytes())
    assert res.json()["truncated"] is True

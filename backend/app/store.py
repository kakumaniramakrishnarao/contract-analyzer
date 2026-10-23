import json
import uuid

from app import config


def _path(doc_id: str):
    # doc_id comes from the URL, so only accept real UUIDs (no "../" tricks)
    try:
        uuid.UUID(doc_id)
    except ValueError:
        return None
    return config.DATA_DIR / f"{doc_id}.json"


def save(doc_id: str, record: dict) -> None:
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = _path(doc_id)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(record), encoding="utf-8")
    tmp.replace(path)


def load(doc_id: str) -> dict | None:
    path = _path(doc_id)
    if path is None or not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))

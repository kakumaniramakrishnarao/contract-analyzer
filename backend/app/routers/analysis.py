from fastapi import APIRouter, HTTPException

from app import store
from app.llm import LLMError, analyse_contract

router = APIRouter()


@router.post("/{doc_id}")
def analyse(doc_id: str):
    record = store.load(doc_id)
    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found. Upload it again."
        )

    # Saved with the document, so going back and forth doesn't re-run the model
    if record["analysis"] is None:
        try:
            record["analysis"] = analyse_contract(record["text"])
        except LLMError as e:
            raise HTTPException(status_code=502, detail=str(e))
        store.save(doc_id, record)

    return {**record["analysis"], "truncated": record["truncated"]}

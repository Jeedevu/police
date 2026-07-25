from typing import Optional
from sqlalchemy.orm import Session
from app.models.evidence import Evidence


def execute(
    db: Session,
    case_id: Optional[int] = None,
    evidence_type: Optional[str] = None,
    description: Optional[str] = None,
    limit: int = 20,
) -> list[dict]:
    query = db.query(Evidence)

    if case_id is not None:
        query = query.filter(Evidence.case_id == case_id)
    if evidence_type:
        query = query.filter(Evidence.evidence_type.ilike(f"%{evidence_type}%"))
    if description:
        query = query.filter(Evidence.description.ilike(f"%{description}%"))

    items = query.limit(limit).all()

    return [
        {
            "evidence_id": e.evidence_id,
            "case_id": e.case_id,
            "evidence_type": e.evidence_type,
            "description": e.description,
            "file_url": e.file_url,
        }
        for e in items
    ]

from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.accused import Accused
from app.models.person_identity import PersonIdentity


def execute(
    db: Session,
    name: Optional[str] = None,
    case_id: Optional[int] = None,
    gender: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    limit: int = 20,
) -> list[dict]:
    query = db.query(
        Accused.accused_id,
        Accused.case_id,
        Accused.name,
        Accused.gender,
        Accused.age,
        Accused.address,
        PersonIdentity.person_id,
        PersonIdentity.risk_score,
        PersonIdentity.mobile,
        PersonIdentity.aadhaar,
    ).outerjoin(
        PersonIdentity,
        PersonIdentity.full_name == Accused.name
    )

    if name:
        query = query.filter(Accused.name.ilike(f"%{name}%"))
    if case_id is not None:
        query = query.filter(Accused.case_id == case_id)
    if gender:
        query = query.filter(Accused.gender.ilike(f"%{gender}%"))
    if min_age is not None:
        query = query.filter(Accused.age >= min_age)
    if max_age is not None:
        query = query.filter(Accused.age <= max_age)

    rows = query.limit(limit).all()

    return [
        {
            "accused_id": r.accused_id,
            "case_id": r.case_id,
            "name": r.name,
            "gender": r.gender,
            "age": r.age,
            "address": r.address,
            "person_id": r.person_id,
            "risk_score": r.risk_score,
            "mobile": r.mobile,
        }
        for r in rows
    ]

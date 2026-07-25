from typing import Optional
from sqlalchemy.orm import Session
from app.models.victim import Victim


def execute(
    db: Session,
    name: Optional[str] = None,
    case_id: Optional[int] = None,
    gender: Optional[str] = None,
    limit: int = 20,
) -> list[dict]:
    query = db.query(Victim)

    if name:
        query = query.filter(Victim.name.ilike(f"%{name}%"))
    if case_id is not None:
        query = query.filter(Victim.case_id == case_id)
    if gender:
        query = query.filter(Victim.gender.ilike(f"%{gender}%"))

    victims = query.limit(limit).all()

    return [
        {
            "victim_id": v.victim_id,
            "case_id": v.case_id,
            "name": v.name,
            "gender": v.gender,
            "age": v.age,
            "address": v.address,
        }
        for v in victims
    ]

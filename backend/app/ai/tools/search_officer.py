from typing import Optional
from sqlalchemy.orm import Session
from app.models.investigation_officer import InvestigationOfficer


def execute(
    db: Session,
    name: Optional[str] = None,
    police_station: Optional[str] = None,
    rank: Optional[str] = None,
    limit: int = 20,
) -> list[dict]:
    query = db.query(InvestigationOfficer)

    if name:
        query = query.filter(InvestigationOfficer.name.ilike(f"%{name}%"))
    if police_station:
        query = query.filter(InvestigationOfficer.police_station.ilike(f"%{police_station}%"))
    if rank:
        query = query.filter(InvestigationOfficer.rank.ilike(f"%{rank}%"))

    officers = query.limit(limit).all()

    return [
        {
            "officer_id": o.officer_id,
            "name": o.name,
            "rank": o.rank,
            "badge_number": o.badge_number,
            "police_station": o.police_station,
        }
        for o in officers
    ]

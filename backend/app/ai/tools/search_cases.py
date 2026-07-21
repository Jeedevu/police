from typing import Optional
from sqlalchemy.orm import Session
from app.models.case import Case


def execute(
    db: Session,
    crime_type: Optional[str] = None,
    district: Optional[str] = None,
    status: Optional[str] = None,
    fir_number: Optional[str] = None,
    police_station: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 20,
) -> list[dict]:
    query = db.query(Case)

    if crime_type:
        query = query.filter(Case.crime_type.ilike(f"%{crime_type}%"))
    if district:
        query = query.filter(Case.district.ilike(f"%{district}%"))
    if status:
        query = query.filter(Case.case_status.ilike(f"%{status}%"))
    if fir_number:
        query = query.filter(Case.fir_number.ilike(f"%{fir_number}%"))
    if police_station:
        query = query.filter(Case.police_station.ilike(f"%{police_station}%"))
    if date_from:
        query = query.filter(Case.crime_date >= date_from)
    if date_to:
        query = query.filter(Case.crime_date <= date_to)

    cases = query.order_by(Case.crime_date.desc().nullslast()).limit(limit).all()

    return [
        {
            "case_id": c.case_id,
            "fir_number": c.fir_number,
            "crime_type": c.crime_type,
            "district": c.district,
            "police_station": c.police_station,
            "case_status": c.case_status,
            "crime_date": c.crime_date.isoformat() if c.crime_date else None,
            "brief_facts": c.brief_facts,
        }
        for c in cases
    ]

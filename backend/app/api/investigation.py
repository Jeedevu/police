from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.database.connection import engine
from app.services.similar_cases_service import get_similar_cases

router = APIRouter(prefix="/investigation", tags=["Investigation"])


@router.get("/{case_id}")
def investigation(case_id: int):

    with engine.connect() as conn:

        case = conn.execute(
            text("""
                SELECT *
                FROM casemaster
                WHERE case_id=:id
            """),
            {"id": case_id}
        ).mappings().first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        complainants = conn.execute(
            text("""
                SELECT *
                FROM complainantdetails
                WHERE case_id=:id
            """),
            {"id": case_id}
        ).mappings().all()

        victims = conn.execute(
            text("""
                SELECT *
                FROM victim
                WHERE case_id=:id
            """),
            {"id": case_id}
        ).mappings().all()

        accused = conn.execute(
            text("""
                SELECT a.*, p.person_id, p.risk_score
                FROM accused a
                LEFT JOIN personidentity p ON a.name = p.full_name
                WHERE a.case_id=:id
            """),
            {"id": case_id}
        ).mappings().all()

        evidence = conn.execute(
            text("""
                SELECT *
                FROM evidence
                WHERE case_id=:id
            """),
            {"id": case_id}
        ).mappings().all()

        # Get vehicles owned by accused in this case
        vehicles = conn.execute(
            text("""
                SELECT v.*, p.full_name AS owner_name
                FROM accused a
                JOIN personidentity p ON a.name = p.full_name
                JOIN vehicle v ON p.person_id = v.person_id
                WHERE a.case_id = :id
            """),
            {"id": case_id}
        ).mappings().all()

        # Get officers assigned to the police station in this case
        investigation_officer = None
        if case.get("police_station"):
            officer = conn.execute(
                text("""
                    SELECT *
                    FROM investigationofficer
                    WHERE police_station = :station
                    LIMIT 1
                """),
                {"station": case["police_station"]}
            ).mappings().first()
            if officer:
                investigation_officer = dict(officer)

        # Get criminal history of accused in this case
        criminal_histories = conn.execute(
            text("""
                SELECT h.*, p.full_name AS person_name
                FROM accused a
                JOIN personidentity p ON a.name = p.full_name
                JOIN criminalhistory h ON p.person_id = h.person_id
                WHERE a.case_id = :id
            """),
            {"id": case_id}
        ).mappings().all()

        # Get known associates of accused in this case
        known_associates = conn.execute(
            text("""
                SELECT DISTINCT
                    ka.associate_id,
                    p1.full_name AS person_name,
                    p2.full_name AS associate_name,
                    ka.relationship_type,
                    ka.confidence,
                    p2.person_id AS associate_person_id
                FROM accused a
                JOIN personidentity p1 ON a.name = p1.full_name
                JOIN knownassociate ka ON (p1.person_id = ka.person_id OR p1.person_id = ka.associate_person_id)
                JOIN personidentity p2 ON (
                    (p2.person_id = ka.associate_person_id AND p1.person_id = ka.person_id) OR
                    (p2.person_id = ka.person_id AND p1.person_id = ka.associate_person_id)
                )
                WHERE a.case_id = :id AND p2.person_id != p1.person_id
            """),
            {"id": case_id}
        ).mappings().all()

    return {
        "success": True,
        "case": dict(case),
        "complainants": [dict(c) for c in complainants],
        "victims": [dict(v) for v in victims],
        "accused": [dict(a) for a in accused],
        "vehicles": [dict(v) for v in vehicles],
        "evidence": [dict(e) for e in evidence],
        "investigation_officer": investigation_officer,
        "criminal_histories": [dict(h) for h in criminal_histories],
        "known_associates": [dict(ka) for ka in known_associates],
    }


@router.get("/similar/{case_id}")
def similar_cases(case_id: int):
    """Find cases similar to the given case_id based on crime type, district, suspects, vehicles, phones."""
    return get_similar_cases(case_id)
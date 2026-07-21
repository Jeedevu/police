from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from app.database.connection import engine

router = APIRouter(prefix="/profile", tags=["Criminal Profile"])


@router.get("/{person_id}")
def criminal_profile(person_id: int):
    with engine.connect() as conn:
        # Core person identity
        person = conn.execute(
            text("SELECT * FROM personidentity WHERE person_id = :id"),
            {"id": person_id}
        ).mappings().first()

        if not person:
            raise HTTPException(status_code=404, detail="Person not found")

        # Phones owned by this person
        phones = conn.execute(
            text("SELECT * FROM phone WHERE person_id = :id"),
            {"id": person_id}
        ).mappings().all()

        # Vehicles owned by this person
        vehicles = conn.execute(
            text("SELECT * FROM vehicle WHERE person_id = :id"),
            {"id": person_id}
        ).mappings().all()

        # Criminal history
        criminal_history = conn.execute(
            text("SELECT * FROM criminalhistory WHERE person_id = :id ORDER BY arrest_date DESC"),
            {"id": person_id}
        ).mappings().all()

        # Known associates (both directions)
        associates = conn.execute(
            text("""
                SELECT
                    ka.associate_id,
                    ka.relationship_type,
                    ka.confidence,
                    CASE
                        WHEN ka.person_id = :id THEN ka.associate_person_id
                        ELSE ka.person_id
                    END AS other_person_id,
                    p.full_name AS associate_name,
                    p.risk_score AS associate_risk_score,
                    p.mobile AS associate_mobile
                FROM knownassociate ka
                JOIN personidentity p ON p.person_id = (
                    CASE WHEN ka.person_id = :id THEN ka.associate_person_id ELSE ka.person_id END
                )
                WHERE ka.person_id = :id OR ka.associate_person_id = :id
            """),
            {"id": person_id}
        ).mappings().all()

        # Cases this person appears in as accused
        accused_cases = conn.execute(
            text("""
                SELECT DISTINCT cm.case_id, cm.fir_number, cm.crime_type, cm.crime_date,
                       cm.district, cm.police_station, cm.case_status
                FROM accused a
                JOIN casemaster cm ON a.case_id = cm.case_id
                WHERE a.name = (SELECT full_name FROM personidentity WHERE person_id = :id)
                ORDER BY cm.crime_date DESC
            """),
            {"id": person_id}
        ).mappings().all()

        # Cases via criminal history
        history_cases = conn.execute(
            text("""
                SELECT DISTINCT cm.case_id, cm.fir_number, cm.crime_type, cm.crime_date,
                       cm.district, cm.police_station, cm.case_status
                FROM criminalhistory ch
                JOIN casemaster cm ON ch.case_id = cm.case_id
                WHERE ch.person_id = :id
                ORDER BY cm.crime_date DESC
            """),
            {"id": person_id}
        ).mappings().all()

        # Merge cases deduplicating by case_id
        seen_ids = set()
        all_cases = []
        for c in list(accused_cases) + list(history_cases):
            if c["case_id"] not in seen_ids:
                seen_ids.add(c["case_id"])
                all_cases.append(dict(c))

        # Evidence linked to those cases
        evidence = []
        if seen_ids:
            in_clause = ", ".join(str(cid) for cid in seen_ids)
            evidence = conn.execute(
                text(f"SELECT * FROM evidence WHERE case_id IN ({in_clause}) LIMIT 20")
            ).mappings().all()

        # Financial accounts (if table exists)
        financial_accounts = []
        try:
            fa_results = conn.execute(
                text("SELECT * FROM financial_account WHERE person_id = :id"),
                {"id": person_id}
            ).mappings().all()
            financial_accounts = [dict(r) for r in fa_results]
        except Exception:
            pass

        return {
            "success": True,
            "person": dict(person),
            "phones": [dict(p) for p in phones],
            "vehicles": [dict(v) for v in vehicles],
            "criminal_history": [dict(h) for h in criminal_history],
            "associates": [dict(a) for a in associates],
            "cases": all_cases,
            "evidence": [dict(e) for e in evidence],
            "financial_accounts": financial_accounts,
            "stats": {
                "total_cases": len(all_cases),
                "total_arrests": len(criminal_history),
                "total_associates": len(associates),
                "total_vehicles": len(vehicles),
                "total_phones": len(phones),
            }
        }

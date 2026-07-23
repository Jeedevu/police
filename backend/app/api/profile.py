from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from app.database.connection import engine, SessionLocal
from app.models.person_identity import PersonIdentity

router = APIRouter(prefix="/profile", tags=["Criminal Profile"])


@router.get("", tags=["Criminal Profile"])
@router.get("/", tags=["Criminal Profile"])
def list_suspects(search: str = None):
    """List suspects with optional search filter."""
    with engine.connect() as conn:
        if search:
            like = f"%{search}%"
            query = text("""
                SELECT * FROM personidentity
                WHERE full_name ILIKE :l OR mobile ILIKE :l OR aadhaar ILIKE :l OR address ILIKE :l OR occupation ILIKE :l
                ORDER BY risk_score DESC, person_id DESC
                LIMIT 100
            """)
            rows = conn.execute(query, {"l": like}).mappings().all()
        else:
            query = text("""
                SELECT * FROM personidentity
                ORDER BY risk_score DESC, person_id DESC
                LIMIT 100
            """)
            rows = conn.execute(query).mappings().all()
        return [dict(r) for r in rows]


@router.post("", tags=["Criminal Profile"])
@router.post("/", tags=["Criminal Profile"])
def create_suspect(data: dict):
    """Create a new suspect profile."""
    db = SessionLocal()
    try:
        age_val = None
        if data.get("age") is not None and str(data.get("age")).strip() != "":
            try: age_val = int(data.get("age"))
            except: pass

        risk_val = 0
        if data.get("risk_score") is not None and str(data.get("risk_score")).strip() != "":
            try: risk_val = int(data.get("risk_score"))
            except: pass

        person = PersonIdentity(
            full_name=data.get("full_name", "Unknown Suspect"),
            gender=data.get("gender", "Male"),
            age=age_val,
            mobile=data.get("mobile"),
            email=data.get("email"),
            aadhaar=data.get("aadhaar"),
            pan=data.get("pan"),
            passport=data.get("passport"),
            address=data.get("address"),
            occupation=data.get("occupation"),
            photo_url=data.get("photo_url"),
            risk_score=risk_val
        )
        db.add(person)
        db.commit()
        db.refresh(person)
        return {"success": True, "person_id": person.person_id, "full_name": person.full_name}
    finally:
        db.close()


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


@router.put("/{person_id}")
def update_suspect(person_id: int, data: dict):
    """Update an existing suspect profile."""
    db = SessionLocal()
    try:
        person = db.query(PersonIdentity).filter(PersonIdentity.person_id == person_id).first()
        if not person:
            raise HTTPException(status_code=404, detail="Suspect profile not found")

        for key in ["full_name", "gender", "mobile", "email", "aadhaar", "pan", "passport", "address", "occupation", "photo_url"]:
            if key in data and data[key] is not None:
                setattr(person, key, data[key])
                
        if "age" in data and data["age"] is not None and str(data["age"]).strip() != "":
            try: person.age = int(data["age"])
            except: pass
        if "risk_score" in data and data["risk_score"] is not None and str(data["risk_score"]).strip() != "":
            try: person.risk_score = int(data["risk_score"])
            except: pass

        db.commit()
        db.refresh(person)
        return {"success": True, "person_id": person.person_id, "full_name": person.full_name}
    finally:
        db.close()


@router.delete("/{person_id}")
def delete_suspect(person_id: int):
    """Delete a suspect profile."""
    db = SessionLocal()
    try:
        person = db.query(PersonIdentity).filter(PersonIdentity.person_id == person_id).first()
        if not person:
            raise HTTPException(status_code=404, detail="Suspect profile not found")
        db.delete(person)
        db.commit()
        return {"success": True, "message": f"Suspect {person_id} deleted successfully"}
    finally:
        db.close()

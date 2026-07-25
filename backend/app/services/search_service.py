from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.models.case import Case
from app.models.person_identity import PersonIdentity
from app.models.vehicle import Vehicle
from app.models.phone import Phone
from app.models.evidence import Evidence


def search_all(
    db: Session,
    query: str,
    crime_type: Optional[str] = None,
    district: Optional[str] = None,
    min_risk: Optional[int] = None,
):
    q = f"%{query}%" if query else "%"

    # --- Cases ---
    case_filters = [
        or_(
            Case.fir_number.ilike(q),
            Case.crime_type.ilike(q),
            Case.district.ilike(q),
            Case.police_station.ilike(q),
        )
    ]
    if crime_type:
        case_filters.append(Case.crime_type.ilike(f"%{crime_type}%"))
    if district:
        case_filters.append(Case.district.ilike(f"%{district}%"))

    cases = (
        db.query(Case)
        .filter(*case_filters)
        .limit(20)
        .all()
    )

    # --- People ---
    people_filters = [
        or_(
            PersonIdentity.full_name.ilike(q),
            PersonIdentity.mobile.ilike(q),
            PersonIdentity.email.ilike(q),
            PersonIdentity.aadhaar.ilike(q),
            PersonIdentity.pan.ilike(q),
            PersonIdentity.passport.ilike(q),
            PersonIdentity.address.ilike(q),
        )
    ]
    if min_risk is not None:
        people_filters.append(PersonIdentity.risk_score >= min_risk)

    people = (
        db.query(PersonIdentity)
        .filter(*people_filters)
        .limit(20)
        .all()
    )

    # --- Vehicles ---
    vehicles = (
        db.query(Vehicle)
        .filter(
            or_(
                Vehicle.registration_number.ilike(q),
                Vehicle.manufacturer.ilike(q),
                Vehicle.model.ilike(q),
            )
        )
        .limit(10)
        .all()
    )

    # --- Phones ---
    phones = (
        db.query(Phone)
        .filter(
            or_(
                Phone.mobile.ilike(q),
                Phone.imei.ilike(q),
                Phone.sim_number.ilike(q),
            )
        )
        .limit(10)
        .all()
    )

    # --- Evidence ---
    evidence = (
        db.query(Evidence)
        .filter(
            or_(
                Evidence.evidence_type.ilike(q),
                Evidence.description.ilike(q),
            )
        )
        .limit(10)
        .all()
    )

    return {
        "cases": [
            {
                "case_id": c.case_id,
                "fir_number": c.fir_number,
                "crime_type": c.crime_type,
                "district": c.district,
                "police_station": c.police_station,
                "case_status": c.case_status,
                "crime_date": c.crime_date.isoformat() if c.crime_date else None,
            }
            for c in cases
        ],
        "people": [
            {
                "person_id": p.person_id,
                "full_name": p.full_name,
                "gender": p.gender,
                "age": p.age,
                "mobile": p.mobile,
                "aadhaar": p.aadhaar,
                "pan": p.pan,
                "passport": p.passport,
                "address": p.address,
                "risk_score": p.risk_score,
            }
            for p in people
        ],
        "vehicles": [
            {
                "vehicle_id": v.vehicle_id,
                "person_id": v.person_id,
                "registration_number": v.registration_number,
                "vehicle_type": v.vehicle_type,
                "model": v.model,
                "color": v.color,
                "manufacturer": v.manufacturer,
            }
            for v in vehicles
        ],
        "phones": [
            {
                "phone_id": ph.phone_id,
                "person_id": ph.person_id,
                "mobile": ph.mobile,
                "imei": ph.imei,
                "sim_number": ph.sim_number,
                "provider": ph.provider,
            }
            for ph in phones
        ],
        "evidence": [
            {
                "evidence_id": ev.evidence_id,
                "case_id": ev.case_id,
                "evidence_type": ev.evidence_type,
                "description": ev.description,
                "file_url": ev.file_url,
            }
            for ev in evidence
        ],
    }

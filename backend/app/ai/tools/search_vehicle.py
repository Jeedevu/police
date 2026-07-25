from typing import Optional
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle
from app.models.person_identity import PersonIdentity


def execute(
    db: Session,
    registration_number: Optional[str] = None,
    person_id: Optional[int] = None,
    vehicle_type: Optional[str] = None,
    model: Optional[str] = None,
    limit: int = 20,
) -> list[dict]:
    query = db.query(
        Vehicle.vehicle_id,
        Vehicle.person_id,
        Vehicle.registration_number,
        Vehicle.vehicle_type,
        Vehicle.model,
        Vehicle.color,
        Vehicle.manufacturer,
        PersonIdentity.full_name,
        PersonIdentity.mobile,
    ).outerjoin(
        PersonIdentity,
        Vehicle.person_id == PersonIdentity.person_id
    )

    if registration_number:
        query = query.filter(Vehicle.registration_number.ilike(f"%{registration_number}%"))
    if person_id is not None:
        query = query.filter(Vehicle.person_id == person_id)
    if vehicle_type:
        query = query.filter(Vehicle.vehicle_type.ilike(f"%{vehicle_type}%"))
    if model:
        query = query.filter(Vehicle.model.ilike(f"%{model}%"))

    rows = query.limit(limit).all()

    return [
        {
            "vehicle_id": r.vehicle_id,
            "person_id": r.person_id,
            "registration_number": r.registration_number,
            "vehicle_type": r.vehicle_type,
            "model": r.model,
            "color": r.color,
            "manufacturer": r.manufacturer,
            "owner_name": r.full_name,
            "owner_mobile": r.mobile,
        }
        for r in rows
    ]

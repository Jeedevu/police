from typing import Optional
from sqlalchemy.orm import Session, aliased
from app.models.known_associate import KnownAssociate
from app.models.person_identity import PersonIdentity


def execute(
    db: Session,
    person_id: int,
    relationship_type: Optional[str] = None,
    limit: int = 30,
) -> list[dict]:
    PersonAlias = aliased(PersonIdentity)

    query = db.query(
        KnownAssociate.associate_id,
        KnownAssociate.person_id,
        KnownAssociate.associate_person_id,
        KnownAssociate.relationship_type,
        KnownAssociate.confidence,
        PersonIdentity.full_name.label("person_name"),
        PersonIdentity.risk_score.label("person_risk_score"),
        PersonIdentity.mobile.label("person_mobile"),
        PersonAlias.full_name.label("associate_name"),
        PersonAlias.risk_score.label("associate_risk_score"),
        PersonAlias.mobile.label("associate_mobile"),
    ).join(
        PersonIdentity,
        KnownAssociate.person_id == PersonIdentity.person_id,
    ).join(
        PersonAlias,
        KnownAssociate.associate_person_id == PersonAlias.person_id,
    ).filter(
        (KnownAssociate.person_id == person_id) | (KnownAssociate.associate_person_id == person_id)
    )

    if relationship_type:
        query = query.filter(KnownAssociate.relationship_type.ilike(f"%{relationship_type}%"))

    rows = query.limit(limit).all()

    return [
        {
            "associate_id": r.associate_id,
            "person_id": r.person_id,
            "person_name": r.person_name,
            "person_risk_score": r.person_risk_score,
            "person_mobile": r.person_mobile,
            "associate_person_id": r.associate_person_id,
            "associate_name": r.associate_name,
            "associate_risk_score": r.associate_risk_score,
            "associate_mobile": r.associate_mobile,
            "relationship_type": r.relationship_type,
            "confidence": r.confidence,
        }
        for r in rows
    ]

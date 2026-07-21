from sqlalchemy import func
from app.models.criminal_history import CriminalHistory
from app.models.person_identity import PersonIdentity


def repeat_offenders(db):
    results = (
        db.query(
            PersonIdentity.person_id,
            PersonIdentity.full_name,
            PersonIdentity.risk_score,
            func.count(CriminalHistory.person_id).label("cases")
        )
        .join(PersonIdentity, CriminalHistory.person_id == PersonIdentity.person_id)
        .group_by(PersonIdentity.person_id, PersonIdentity.full_name, PersonIdentity.risk_score)
        .having(func.count(CriminalHistory.person_id) > 1)
        .all()
    )

    return [
        {
            "person_id": row.person_id,
            "full_name": row.full_name,
            "risk_score": row.risk_score,
            "cases": row.cases
        }
        for row in results
    ]
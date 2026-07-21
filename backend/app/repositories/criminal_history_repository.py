from sqlalchemy.orm import Session
from app.models.criminal_history import CriminalHistory


def get_repeat_offenders(db: Session):

    return db.query(CriminalHistory.person_id)\
        .group_by(CriminalHistory.person_id)\
        .having(db.func.count(CriminalHistory.person_id) > 1)\
        .all()
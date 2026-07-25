from sqlalchemy.orm import Session
from app.models.case import Case
from app.schemas.case_schema import CaseCreate


def get_all_cases(db: Session):
    return db.query(Case).all()


def get_case_by_id(db: Session, case_id: int):
    return db.query(Case).filter(Case.case_id == case_id).first()


def create_case(db: Session, case: CaseCreate):
    db_case = Case(
        fir_number=case.fir_number,
        crime_type=case.crime_type,
        district=case.district
    )

    db.add(db_case)
    db.commit()
    db.refresh(db_case)

    return db_case
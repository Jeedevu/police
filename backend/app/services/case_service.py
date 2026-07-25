from sqlalchemy.orm import Session
from app.repositories.case_repository import (
    get_all_cases,
    get_case_by_id,
    create_case,
)


def list_cases(db: Session):
    return get_all_cases(db)


def get_case(db: Session, case_id: int):
    return get_case_by_id(db, case_id)


def add_case(db: Session, case):
    return create_case(db, case)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.case_schema import CaseCreate, CaseResponse
from app.services.case_service import (
    list_cases,
    get_case,
    add_case,
)

router = APIRouter(prefix="/cases", tags=["Cases"])


@router.get("/", response_model=list[CaseResponse])
def read_cases(db: Session = Depends(get_db)):
    return list_cases(db)


@router.get("/{case_id}", response_model=CaseResponse)
def read_case(case_id: int, db: Session = Depends(get_db)):
    case = get_case(db, case_id)

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return case


@router.post("/", response_model=CaseResponse)
def create_case(case: CaseCreate, db: Session = Depends(get_db)):
    return add_case(db, case)
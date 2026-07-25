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


@router.get("", response_model=list[CaseResponse])
@router.get("/", response_model=list[CaseResponse])
def read_cases(db: Session = Depends(get_db)):
    return list_cases(db)


@router.get("/{case_id}", response_model=CaseResponse)
def read_case(case_id: int, db: Session = Depends(get_db)):
    case = get_case(db, case_id)

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return case


@router.post("", response_model=CaseResponse)
@router.post("/", response_model=CaseResponse)
def create_case(case: CaseCreate, db: Session = Depends(get_db)):
    return add_case(db, case)


@router.put("/{case_id}")
def update_existing_case(case_id: int, data: dict, db: Session = Depends(get_db)):
    from app.cases.repository import CaseRepository
    repo = CaseRepository(db)
    c = repo.get_by_id(case_id)
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
    updated = repo.update(c, data)
    return {"success": True, "case_id": updated.case_id}


@router.delete("/{case_id}")
def delete_existing_case(case_id: int, db: Session = Depends(get_db)):
    from app.cases.repository import CaseRepository
    repo = CaseRepository(db)
    c = repo.get_by_id(case_id)
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
    repo.delete(c)
    return {"success": True, "message": f"Case {case_id} deleted successfully"}
"""
Cases API router — CRUD with row-level security.
Preserves existing /cases route behaviour; adds new structured endpoints.
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_officer, get_jurisdiction_filter, require_min_role, require_officer
from app.auth.models import Officer
from app.cases.repository import CaseRepository
from app.cases.schemas import CaseCreate, CaseListResponse, CaseOut, CaseUpdate
from app.database.connection import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cases", tags=["Cases"])


@router.get("", response_model=CaseListResponse)
def list_cases(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    crime_type: Optional[str] = None,
    case_status: Optional[str] = None,
    district: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    jurisdiction: dict = Depends(get_jurisdiction_filter),
):
    """
    List cases with optional filters and automatic row-level security.
    Jurisdiction is automatically applied based on the authenticated officer.
    """
    repo = CaseRepository(db)
    cases, total = repo.list_cases(
        skip=skip,
        limit=limit,
        crime_type=crime_type,
        case_status=case_status,
        district=district,
        search=search,
        jurisdiction=jurisdiction,
    )
    return CaseListResponse(
        total=total,
        skip=skip,
        limit=limit,
        data=[CaseOut.model_validate(c) for c in cases],
    )


@router.get("/{case_id}", response_model=CaseOut)
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    jurisdiction: dict = Depends(get_jurisdiction_filter),
):
    """Get a specific case by ID. Jurisdiction filtering applied."""
    repo = CaseRepository(db)
    case = repo.get_by_id(case_id, jurisdiction)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return CaseOut.model_validate(case)


@router.post("", response_model=CaseOut)
def create_case(
    data: CaseCreate,
    db: Session = Depends(get_db),
    _: Officer = Depends(require_min_role("Sub Inspector")),
):
    """Create a new case. SI+ access required."""
    repo = CaseRepository(db)
    case = repo.create(data.model_dump(exclude_unset=True))
    return CaseOut.model_validate(case)


@router.put("/{case_id}", response_model=CaseOut)
def update_case(
    case_id: int,
    data: CaseUpdate,
    db: Session = Depends(get_db),
    jurisdiction: dict = Depends(get_jurisdiction_filter),
    _: Officer = Depends(require_min_role("Sub Inspector")),
):
    """Update a case. SI+ access. Jurisdiction enforced."""
    repo = CaseRepository(db)
    case = repo.get_by_id(case_id, jurisdiction)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    updated = repo.update(case, data.model_dump(exclude_unset=True))
    return CaseOut.model_validate(updated)


@router.delete("/{case_id}")
def delete_case(
    case_id: int,
    db: Session = Depends(get_db),
    jurisdiction: dict = Depends(get_jurisdiction_filter),
    _: Officer = Depends(require_min_role("SP")),
):
    """Delete a case. SP+ access required."""
    repo = CaseRepository(db)
    case = repo.get_by_id(case_id, jurisdiction)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    repo.delete(case)
    return {"message": f"Case {case_id} deleted successfully"}

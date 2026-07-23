"""
Officers management router.
All management endpoints require at minimum SP-level access.
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_officer, require_min_role, require_officer
from app.auth.models import Officer
from app.auth.schemas import OfficerCreate, OfficerUpdate
from app.auth.service import create_officer
from app.database.connection import get_db
from app.officers.repository import OfficerRepository
from app.officers.schemas import (
    OfficerDetail,
    OfficerListItem,
    OfficerStats,
    PostingRequest,
    PromotionRequest,
    TransferRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Officers"])


@router.get("", response_model=dict)
def list_officers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    role: Optional[str] = None,
    district_id: Optional[int] = None,
    unit_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer),
):
    """List officers with optional filters. Accessible to authenticated users."""
    repo = OfficerRepository(db)
    officers, total = repo.list_officers(
        skip=skip,
        limit=limit,
        role=role,
        district_id=district_id,
        unit_id=unit_id,
        is_active=is_active,
        search=search,
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [OfficerListItem.model_validate(o) for o in officers],
    }


@router.get("/stats", response_model=OfficerStats)
def officer_stats(
    db: Session = Depends(get_db),
    _: Officer = Depends(require_min_role("SP")),
):
    """Officer statistics by role and district. SP+ access."""
    repo = OfficerRepository(db)
    stats = repo.get_stats()
    return OfficerStats(
        total_officers=stats["total_officers"],
        active_officers=stats["active_officers"],
        by_role=stats["by_role"],
        by_district={},
    )


@router.get("/{officer_id}", response_model=OfficerDetail)
def get_officer(
    officer_id: int,
    db: Session = Depends(get_db),
    _: Officer = Depends(require_officer),
):
    """Get a specific officer's details."""
    repo = OfficerRepository(db)
    o = repo.get_by_id(officer_id)
    if not o:
        raise HTTPException(status_code=404, detail="Officer not found")
    return OfficerDetail.model_validate(o)


@router.post("", response_model=OfficerDetail)
def create_new_officer(
    data: OfficerCreate,
    db: Session = Depends(get_db),
    _: Officer = Depends(require_min_role("Sub Inspector")),
):
    """Create a new officer account."""
    import random
    from app.auth.service import get_officer_by_email
    if get_officer_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    officer_data = data.model_dump()
    if not officer_data.get("badge_number"):
        officer_data["badge_number"] = f"KSP-{random.randint(1000, 9999)}"

    o = create_officer(db, officer_data)
    return OfficerDetail.model_validate(o)


@router.delete("/{officer_id}")
def delete_officer(
    officer_id: int,
    db: Session = Depends(get_db),
    _: Officer = Depends(require_min_role("Sub Inspector")),
):
    """Delete an officer record from database."""
    repo = OfficerRepository(db)
    success = repo.delete(officer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Officer not found")
    return {"success": True, "message": f"Officer {officer_id} deleted successfully"}


@router.put("/{officer_id}", response_model=OfficerDetail)
def update_officer(
    officer_id: int,
    data: OfficerUpdate,
    db: Session = Depends(get_db),
    current: Officer = Depends(require_officer),
):
    """Update officer profile. Officers can update their own; SP+ can update others."""
    if current.id != officer_id and current.role_level < 50:
        raise HTTPException(status_code=403, detail="Insufficient authority to update other officers")

    repo = OfficerRepository(db)
    o = repo.get_by_id(officer_id)
    if not o:
        raise HTTPException(status_code=404, detail="Officer not found")

    updated = repo.update(o, data.model_dump(exclude_unset=True))
    return OfficerDetail.model_validate(updated)


@router.post("/transfer", response_model=OfficerDetail)
def transfer_officer(
    req: TransferRequest,
    db: Session = Depends(get_db),
    _: Officer = Depends(require_min_role("SP")),
):
    """Transfer an officer to a new station/district."""
    repo = OfficerRepository(db)
    o = repo.get_by_id(req.officer_id)
    if not o:
        raise HTTPException(status_code=404, detail="Officer not found")

    update_data = {"unit_id": req.new_unit_id}
    if req.new_district_id:
        update_data["district_id"] = req.new_district_id

    updated = repo.update(o, update_data)
    logger.info(f"Officer {o.badge_number} transferred to unit {req.new_unit_id}")
    return OfficerDetail.model_validate(updated)


@router.post("/promote", response_model=OfficerDetail)
def promote_officer(
    req: PromotionRequest,
    db: Session = Depends(get_db),
    _: Officer = Depends(require_min_role("DIG")),
):
    """Promote an officer to a new role. DIG+ access required."""
    repo = OfficerRepository(db)
    o = repo.get_by_id(req.officer_id)
    if not o:
        raise HTTPException(status_code=404, detail="Officer not found")

    updated = repo.update(o, {"role": req.new_role})
    logger.info(f"Officer {o.badge_number} promoted to {req.new_role}")
    return OfficerDetail.model_validate(updated)

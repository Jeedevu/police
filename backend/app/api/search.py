from fastapi import APIRouter, Depends
from typing import Optional
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.search_service import search_all

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("")
def global_search(
    q: str = "",
    crime_type: Optional[str] = None,
    district: Optional[str] = None,
    min_risk: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return search_all(db, q, crime_type=crime_type, district=district, min_risk=min_risk)

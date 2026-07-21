from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.network_service import get_person_network

router = APIRouter(prefix="/network", tags=["Network"])


@router.get("/person/{person_id}")
def network_person(person_id: int, db: Session = Depends(get_db)):
    return get_person_network(db, person_id)

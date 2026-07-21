from pydantic import BaseModel
from typing import Optional


class CaseCreate(BaseModel):
    fir_number: str
    crime_type: str
    district: str


class CaseResponse(BaseModel):
    case_id: int
    fir_number: str
    crime_type: str
    district: str

    class Config:
        from_attributes = True
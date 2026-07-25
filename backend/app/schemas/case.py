from pydantic import BaseModel


class CaseCreate(BaseModel):
    crime_number: str
    crime_type: str
    district: str
    police_station: str
    status: str


class CaseResponse(CaseCreate):
    id: int

    class Config:
        from_attributes = True
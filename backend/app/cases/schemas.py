"""
Pydantic v2 schemas for the Cases module.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class CaseBase(BaseModel):
    fir_number: str
    crime_type: str
    district: Optional[str] = None
    police_station: Optional[str] = None
    case_status: Optional[str] = None
    crime_date: Optional[date] = None
    brief_facts: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None


class CaseCreate(CaseBase):
    police_person_id: Optional[int] = None
    police_station_id: Optional[int] = None
    case_category_id: Optional[int] = None
    gravity_offence_id: Optional[int] = None


class CaseUpdate(BaseModel):
    crime_type: Optional[str] = None
    case_status: Optional[str] = None
    district: Optional[str] = None
    police_station: Optional[str] = None
    brief_facts: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None


class CaseOut(CaseBase):
    case_id: int
    incident_from_date: Optional[datetime] = None
    incident_to_date: Optional[datetime] = None
    info_received_ps_date: Optional[datetime] = None
    police_station_id: Optional[int] = None
    police_person_id: Optional[int] = None

    model_config = {"from_attributes": True}


class CaseListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    data: list[CaseOut]


class CaseTimeline(BaseModel):
    event: str
    timestamp: datetime
    actor: Optional[str] = None
    description: Optional[str] = None

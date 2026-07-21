"""
Pydantic v2 schemas for the Officers management module.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class OfficerListItem(BaseModel):
    id: int
    full_name: str
    badge_number: Optional[str]
    email: str
    role: str
    district_id: Optional[int]
    unit_id: Optional[int]
    is_active: bool
    last_login: Optional[datetime]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class OfficerDetail(OfficerListItem):
    phone: Optional[str]
    avatar_url: Optional[str]
    employee_id: Optional[int]
    zone_id: Optional[int]
    range_id: Optional[int]


class TransferRequest(BaseModel):
    officer_id: int
    new_unit_id: int
    new_district_id: Optional[int] = None
    effective_date: Optional[datetime] = None
    notes: Optional[str] = None


class PromotionRequest(BaseModel):
    officer_id: int
    new_role: str
    effective_date: Optional[datetime] = None
    notes: Optional[str] = None


class PostingRequest(BaseModel):
    officer_id: int
    unit_id: int
    district_id: Optional[int] = None
    zone_id: Optional[int] = None
    range_id: Optional[int] = None
    notes: Optional[str] = None


class OfficerStats(BaseModel):
    total_officers: int
    active_officers: int
    by_role: dict[str, int]
    by_district: dict[str, int]

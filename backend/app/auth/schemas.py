"""
Pydantic v2 schemas for authentication, officer profile, and security endpoints.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ── Request schemas ───────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: str = Field(min_length=4)
    remember_me: bool = False

    @property
    def identifier(self) -> str:
        return (self.email or self.username or "").strip()


class RefreshRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


# ── Response schemas ──────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class OfficerOut(BaseModel):
    id: int
    officer_id: Optional[str] = None
    username: Optional[str] = None
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: str
    badge_number: Optional[str] = None
    rank: Optional[str] = None
    role: str
    phone: Optional[str] = None
    district_id: Optional[int] = None
    police_station_id: Optional[int] = None
    unit_id: Optional[int] = None
    state: Optional[str] = "Karnataka"
    avatar_url: Optional[str] = None
    is_active: bool = True
    is_verified: bool = True
    last_login: Optional[datetime] = None
    last_password_change: Optional[datetime] = None
    permissions: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class OfficerCreate(BaseModel):
    email: str
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    badge_number: Optional[str] = None
    rank: Optional[str] = None
    role: str = "Constable"
    district_id: Optional[int] = None
    unit_id: Optional[int] = None
    police_station_id: Optional[int] = None
    phone: Optional[str] = None
    state: Optional[str] = "Karnataka"


class OfficerUpdate(BaseModel):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    district_id: Optional[int] = None
    unit_id: Optional[int] = None
    police_station_id: Optional[int] = None
    rank: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class LoginResponse(BaseModel):
    officer: OfficerOut
    tokens: TokenResponse
    message: str = "Login successful"

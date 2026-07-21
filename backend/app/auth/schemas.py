"""
Pydantic v2 schemas for authentication endpoints.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ── Request schemas ───────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    remember_me: bool = False


class RefreshRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


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
    email: str
    full_name: str
    badge_number: Optional[str]
    role: str
    district_id: Optional[int]
    unit_id: Optional[int]
    is_active: bool
    avatar_url: Optional[str]
    last_login: Optional[datetime]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class OfficerCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2)
    badge_number: Optional[str] = None
    role: str = "Guest"
    district_id: Optional[int] = None
    unit_id: Optional[int] = None
    phone: Optional[str] = None


class OfficerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    district_id: Optional[int] = None
    unit_id: Optional[int] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class LoginResponse(BaseModel):
    officer: OfficerOut
    tokens: TokenResponse
    message: str = "Login successful"

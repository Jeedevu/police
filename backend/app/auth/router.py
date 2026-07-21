"""
Authentication & User Security Router.

Endpoints:
  POST /api/auth/login
  POST /api/auth/logout
  POST /api/auth/refresh
  GET  /api/auth/me
  GET  /api/auth/profile
  PUT  /api/auth/profile
  POST /api/auth/change-password
  POST /api/auth/forgot-password
  POST /api/auth/reset-password
  POST /api/auth/register
  POST /api/auth/seed-demo
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_officer, require_officer, RequirePermission, RequireRole
from app.auth.models import Officer
from app.auth.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    OfficerCreate,
    OfficerOut,
    OfficerUpdate,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshRequest,
    TokenResponse,
)
from app.auth.service import (
    access_token_expire_seconds,
    authenticate_officer,
    create_access_token,
    create_officer,
    create_refresh_token,
    decode_token,
    get_officer_by_email,
    get_officer_by_id,
    get_officer_permissions,
    hash_password,
    log_audit_event,
    validate_password_strength,
    verify_password,
)
from app.database.connection import get_db
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _build_officer_out(db: Session, officer: Officer) -> OfficerOut:
    """Helper to convert Officer ORM model to OfficerOut schema with permissions."""
    perms = get_officer_permissions(db, officer)
    data = {
        "id": officer.id,
        "officer_id": officer.officer_id or f"KSP-{officer.id:04d}",
        "username": officer.username or officer.email.split("@")[0],
        "email": officer.email,
        "first_name": officer.first_name,
        "last_name": officer.last_name,
        "full_name": officer.full_name,
        "badge_number": officer.badge_number,
        "rank": officer.rank or officer.role,
        "role": officer.role,
        "phone": officer.phone,
        "district_id": officer.district_id,
        "police_station_id": officer.unit_id,
        "unit_id": officer.unit_id,
        "state": officer.state or "Karnataka",
        "avatar_url": officer.avatar_url,
        "is_active": officer.is_active,
        "is_verified": officer.is_verified,
        "last_login": officer.last_login,
        "last_password_change": officer.last_password_change,
        "permissions": perms,
        "created_at": officer.created_at,
        "updated_at": officer.updated_at,
    }
    return OfficerOut(**data)


@router.post("/login", response_model=LoginResponse)
def login(request_data: LoginRequest, req: Request, db: Session = Depends(get_db)):
    """Authenticate officer with email/username + password. Returns JWT access & refresh tokens."""
    client_ip = req.client.host if req.client else None
    identifier = request_data.identifier
    
    if not identifier or not request_data.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email/username and password are required",
        )

    officer, error_msg = authenticate_officer(db, identifier, request_data.password, ip_address=client_ip)
    if not officer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_msg or "Invalid email or password",
        )

    access_token = create_access_token(db, officer)
    refresh_token = create_refresh_token(officer.id, request_data.remember_me)

    officer_out = _build_officer_out(db, officer)

    return LoginResponse(
        officer=officer_out,
        tokens=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=access_token_expire_seconds(),
        ),
        message="Login successful",
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request_data: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access token."""
    try:
        payload = decode_token(request_data.refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Not a refresh token")
        officer_id = int(payload.get("sub") or payload.get("user_id"))
    except (JWTError, ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        ) from exc

    officer = get_officer_by_id(db, officer_id)
    if not officer or not officer.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Officer account not found or inactive")

    new_access = create_access_token(db, officer)
    new_refresh = create_refresh_token(officer.id)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=access_token_expire_seconds(),
    )


@router.post("/logout")
def logout(req: Request, officer: Optional[Officer] = Depends(get_current_officer), db: Session = Depends(get_db)):
    """Logout — client should discard stored tokens; records audit log."""
    client_ip = req.client.host if req.client else None
    if officer:
        logger.info(f"Officer {officer.badge_number or officer.email} logged out")
        log_audit_event(db, "LOGOUT", user_id=officer.id, ip_address=client_ip)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=OfficerOut)
@router.get("/profile", response_model=OfficerOut)
def get_profile(officer: Officer = Depends(require_officer), db: Session = Depends(get_db)):
    """Return current logged in officer profile and permissions."""
    return _build_officer_out(db, officer)


@router.put("/profile", response_model=OfficerOut)
def update_profile(
    data: OfficerUpdate,
    officer: Officer = Depends(require_officer),
    db: Session = Depends(get_db),
):
    """Update officer profile details."""
    updateable = ["full_name", "first_name", "last_name", "phone", "avatar_url"]
    for field in updateable:
        val = getattr(data, field, None)
        if val is not None:
            setattr(officer, field, val)

    officer.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(officer)
    log_audit_event(db, "PROFILE_UPDATE", user_id=officer.id, details="Updated personal profile")
    return _build_officer_out(db, officer)


@router.post("/change-password")
def change_password(
    request_data: ChangePasswordRequest,
    req: Request,
    officer: Officer = Depends(require_officer),
    db: Session = Depends(get_db),
):
    """Change current officer's password."""
    client_ip = req.client.host if req.client else None
    if not verify_password(request_data.current_password, officer.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    is_valid, msg = validate_password_strength(request_data.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)

    officer.password_hash = hash_password(request_data.new_password)
    officer.last_password_change = datetime.now(timezone.utc)
    officer.updated_at = datetime.now(timezone.utc)
    db.commit()

    log_audit_event(db, "PASSWORD_CHANGE", user_id=officer.id, ip_address=client_ip)
    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
def forgot_password(request_data: PasswordResetRequest, req: Request, db: Session = Depends(get_db)):
    """Initiate password reset flow."""
    client_ip = req.client.host if req.client else None
    officer = get_officer_by_email(db, request_data.email)
    if officer:
        import secrets
        reset_token = secrets.token_urlsafe(32)
        officer.reset_token = hash_password(reset_token)
        officer.reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=30)
        db.commit()

        # Optional email notification via Catalyst Mail wrapper
        try:
            notification_service.on_password_reset_requested(
                officer_email=officer.email,
                officer_name=officer.full_name,
                reset_token=reset_token,
                expires_minutes=30,
            )
        except Exception as exc:
            logger.warning(f"Failed to send reset email: {exc}")

        log_audit_event(db, "PASSWORD_RESET_REQUEST", user_id=officer.id, ip_address=client_ip)
    return {"message": "If that email exists, password reset instructions have been sent."}


@router.post("/reset-password")
def reset_password(request_data: PasswordResetConfirm, req: Request, db: Session = Depends(get_db)):
    """Reset password using reset token."""
    client_ip = req.client.host if req.client else None
    now = datetime.now(timezone.utc)
    
    officers = db.query(Officer).filter(
        Officer.reset_token.isnot(None),
        Officer.reset_token_expires > now
    ).all()

    target_officer = None
    for o in officers:
        if verify_password(request_data.token, o.reset_token):
            target_officer = o
            break

    if not target_officer:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    is_valid, msg = validate_password_strength(request_data.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)

    target_officer.password_hash = hash_password(request_data.new_password)
    target_officer.reset_token = None
    target_officer.reset_token_expires = None
    target_officer.last_password_change = now
    target_officer.updated_at = now
    db.commit()

    log_audit_event(db, "PASSWORD_RESET_SUCCESS", user_id=target_officer.id, ip_address=client_ip)
    return {"message": "Password reset successfully. You can now login with your new password."}


@router.post("/register", response_model=OfficerOut)
def register_officer(
    data: OfficerCreate,
    req: Request,
    current_admin: Officer = Depends(RequireRole("Admin", "ADMIN")),
    db: Session = Depends(get_db),
):
    """Register a new officer account (Restricted to Admin)."""
    client_ip = req.client.host if req.client else None
    existing = get_officer_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    officer = create_officer(db, data.model_dump())
    log_audit_event(
        db, "USER_CREATION", user_id=current_admin.id,
        resource=f"Officer:{officer.id}", details=f"Created user {officer.email} role={officer.role}",
        ip_address=client_ip
    )
    return _build_officer_out(db, officer)


@router.post("/seed-demo")
def seed_demo_endpoint(current_admin: Officer = Depends(RequireRole("Admin", "ADMIN"))):
    """Seed demo data (Roles, Permissions, 177 Officers, Cases, Evidence) into PostgreSQL."""
    try:
        from scripts.seed_demo import seed_demo_data
        seed_demo_data()
        return {"message": "Demo database seeded successfully"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Seeding failed: {exc}")

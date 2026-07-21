"""
Authentication API router.
Routes:
  POST /api/auth/login
  POST /api/auth/logout
  POST /api/auth/refresh
  GET  /api/auth/profile
  PUT  /api/auth/profile
  POST /api/auth/forgot-password
  POST /api/auth/reset-password
  POST /api/auth/change-password
"""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_officer, require_officer
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
    hash_password,
    verify_password,
)
from app.database.connection import get_db
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email + password. Returns access and refresh tokens."""
    officer = authenticate_officer(db, request.email, request.password)
    if not officer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(officer.id, officer.role)
    refresh_token = create_refresh_token(officer.id, request.remember_me)

    return LoginResponse(
        officer=OfficerOut.model_validate(officer),
        tokens=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=access_token_expire_seconds(),
        ),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access token."""
    try:
        payload = decode_token(request.refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Not a refresh token")
        officer_id = int(payload["sub"])
    except (JWTError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        ) from exc

    officer = get_officer_by_id(db, officer_id)
    if not officer or not officer.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Officer not found")

    new_access = create_access_token(officer.id, officer.role)
    new_refresh = create_refresh_token(officer.id)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=access_token_expire_seconds(),
    )


@router.post("/logout")
def logout(officer: Optional[Officer] = Depends(get_current_officer)):
    """Logout — client should discard stored tokens; Catalyst Cache session is invalidated if available."""
    if officer:
        logger.info(f"Officer {officer.badge_number} logged out")
        try:
            from app.catalyst.auth_bridge import auth_bridge
            auth_bridge.invalidate_session(officer.id)
        except Exception as exc:
            logger.debug("Session cache invalidation failed (non-fatal): %s", exc)
    else:
        logger.info("Logout request processed for unauthenticated/expired session")
    return {"message": "Logged out successfully"}


@router.get("/profile", response_model=OfficerOut)
def get_profile(officer: Officer = Depends(require_officer)):
    """Return the currently authenticated officer's profile."""
    return OfficerOut.model_validate(officer)


@router.put("/profile", response_model=OfficerOut)
def update_profile(
    data: OfficerUpdate,
    officer: Officer = Depends(require_officer),
    db: Session = Depends(get_db),
):
    """Update officer's own profile (non-sensitive fields)."""
    updateable = ["full_name", "phone", "avatar_url"]
    for field in updateable:
        val = getattr(data, field, None)
        if val is not None:
            setattr(officer, field, val)

    officer.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(officer)
    return OfficerOut.model_validate(officer)


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    officer: Officer = Depends(require_officer),
    db: Session = Depends(get_db),
):
    if not verify_password(request.current_password, officer.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    officer.hashed_password = hash_password(request.new_password)
    officer.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
def forgot_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Initiate password reset flow.

    v3.0 — Now sends the reset email via Catalyst Mail (notification_service).
    The response is always identical (success) to prevent email enumeration.
    """
    officer = get_officer_by_email(db, request.email)
    if officer:
        import secrets
        # Generate a reset token and store it on the officer record
        reset_token = secrets.token_urlsafe(32)
        officer.reset_token = hash_password(reset_token)  # store hashed
        from datetime import datetime, timezone, timedelta
        officer.reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=30)
        db.commit()
        # Send email via Catalyst Mail
        notification_service.on_password_reset_requested(
            officer_email=officer.email,
            officer_name=officer.full_name,
            reset_token=reset_token,
            expires_minutes=30,
        )
        logger.info("Password reset initiated for officer: %s", request.email)
    else:
        logger.info(
            "Password reset requested for unknown email: %s (no action)", request.email
        )
    # Always return success to prevent email enumeration
    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/register", response_model=OfficerOut)
def register_officer(data: OfficerCreate, db: Session = Depends(get_db)):
    """
    Register a new officer account.
    In production, this should be restricted to ADMIN only.

    v3.0 — Triggers notification_service.on_officer_registered():
      * Sends welcome email via Catalyst Mail
      * Creates Catalyst Auth shadow user
      * Writes audit log to Catalyst DataStore
    """
    existing = get_officer_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    officer = create_officer(db, data.model_dump())

    # Async (fire-and-forget) notifications — non-fatal
    try:
        notification_service.on_officer_registered(
            officer_id=officer.id,
            officer_email=officer.email,
            officer_name=officer.full_name,
            badge_number=officer.badge_number or "PENDING",
            role=officer.role,
        )
    except Exception as exc:
        logger.warning("Post-registration notifications failed: %s", exc)

    return OfficerOut.model_validate(officer)

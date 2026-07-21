"""
Authentication service — bcrypt password hashing, JWT creation & verification.
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt as _bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.auth.models import Officer
from app.core.settings import settings

logger = logging.getLogger(__name__)


# ── Password utils ────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Hash password using bcrypt directly (compatible with bcrypt 5.0+)."""
    salt = _bcrypt.gensalt(rounds=12)
    return _bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        return _bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ── JWT utils ─────────────────────────────────────────────────────────────────

def create_access_token(officer_id: int, role: str, extra: dict = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(officer_id),
        "role": role,
        "type": "access",
        "exp": expire,
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(officer_id: int, remember_me: bool = False) -> str:
    days = settings.REFRESH_TOKEN_EXPIRE_DAYS * (3 if remember_me else 1)
    expire = datetime.now(timezone.utc) + timedelta(days=days)
    payload = {
        "sub": str(officer_id),
        "type": "refresh",
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises JWTError on failure."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def access_token_expire_seconds() -> int:
    return settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


# ── Authentication ─────────────────────────────────────────────────────────────

def authenticate_officer(db: Session, email: str, password: str) -> Optional[Officer]:
    """Return Officer if credentials are valid, else None."""
    officer = db.query(Officer).filter(
        Officer.email == email.lower().strip(),
        Officer.is_active == True,
    ).first()

    if not officer:
        logger.warning(f"Login attempt for unknown email: {email}")
        return None

    if not verify_password(password, officer.hashed_password):
        logger.warning(f"Invalid password for officer: {email}")
        return None

    # Update last login
    officer.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(officer)

    logger.info(f"Officer authenticated: {officer.badge_number} ({officer.role})")
    return officer


def get_officer_by_id(db: Session, officer_id: int) -> Optional[Officer]:
    return db.query(Officer).filter(Officer.id == officer_id).first()


def get_officer_by_email(db: Session, email: str) -> Optional[Officer]:
    return db.query(Officer).filter(Officer.email == email.lower().strip()).first()


def create_officer(db: Session, data: dict) -> Officer:
    """Create a new officer with hashed password."""
    officer = Officer(
        email=data["email"].lower().strip(),
        hashed_password=hash_password(data["password"]),
        full_name=data["full_name"],
        badge_number=data.get("badge_number"),
        role=data.get("role", "Guest"),
        district_id=data.get("district_id"),
        unit_id=data.get("unit_id"),
        phone=data.get("phone"),
    )
    db.add(officer)
    db.commit()
    db.refresh(officer)
    return officer

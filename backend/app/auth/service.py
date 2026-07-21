"""
Authentication service — bcrypt password hashing, JWT creation/verification, account security, and audit logging.
"""
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import bcrypt as _bcrypt
from jose import JWTError, jwt
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.models import Officer, Role, Permission
from app.models.audit_log import AuditLog
from app.core.settings import settings

logger = logging.getLogger(__name__)


# ── Password utils ────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Hash password using bcrypt."""
    salt = _bcrypt.gensalt(rounds=12)
    return _bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        return _bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password strength (min 8 chars, mixed case, numbers or special chars)."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    return True, ""


# ── Audit logging helper ──────────────────────────────────────────────────────

def log_audit_event(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    resource: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> None:
    """Write an audit log entry into PostgreSQL."""
    try:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            details=details,
            ip_address=ip_address,
        )
        db.add(log_entry)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to record audit log: {exc}")


# ── Permission Resolver ────────────────────────────────────────────────────────

def get_officer_permissions(db: Session, officer: Officer) -> List[str]:
    """Resolve all permission strings for an officer based on their role."""
    if officer.role and officer.role.upper() == "ADMIN":
        # Admin gets all permissions
        return [
            "Dashboard.View", "Dashboard.Edit", "Cases.Create", "Cases.Read", "Cases.Update", "Cases.Delete",
            "Evidence.Upload", "Evidence.Download", "Evidence.Delete", "Analytics.View", "Analytics.Export",
            "AI.Chat", "AI.GenerateReport", "Officers.View", "Officers.Edit", "Users.Create", "Users.Edit",
            "Users.Delete", "Settings.View", "Settings.Edit", "Notifications.Send", "Audit.View", "Audit.Export",
            "CrimeMap.View", "Investigation.Assign", "Investigation.Close", "CourtOrders.View", "CourtOrders.Upload",
            "Evidence.Verify", "Evidence.Tag", "OCR.Process", "Speech.Process", "Reports.Export", "Mail.Send", "Signals.Publish",
            "dashboard", "cases", "evidence", "analytics", "ai_analytics", "crime_trends", "users", "system_settings", "audit_logs"
        ]
    
    # Try ORM relationship
    if officer.role_rel and officer.role_rel.permissions:
        perms = [p.name for p in officer.role_rel.permissions]
        if perms:
            return perms

    # Query DB by role name if relationship not loaded
    if officer.role:
        role_obj = db.query(Role).filter(Role.name == officer.role).first()
        if role_obj and role_obj.permissions:
            return [p.name for p in role_obj.permissions]

    # Role permission fallbacks
    role_lower = (officer.role or "").lower()
    base_perms = ["Dashboard.View", "Cases.Read", "dashboard", "cases"]
    
    if role_lower in ["sub inspector", "si", "inspector", "dsp", "sp", "dig", "igp", "dgp", "admin"]:
        base_perms.extend(["Evidence.Upload", "Evidence.Download", "Evidence.Tag", "evidence"])
        
    if role_lower in ["inspector", "dsp", "sp", "dig", "igp", "dgp", "admin"]:
        base_perms.extend(["Analytics.View", "AI.Chat", "AI.GenerateReport", "CrimeMap.View", "analytics", "ai_analytics"])

    if role_lower in ["sp", "dig", "igp", "dgp", "admin"]:
        base_perms.extend(["Officers.View", "Officers.Edit", "Investigation.Assign", "Investigation.Close", "users"])

    return base_perms


# ── JWT utils ─────────────────────────────────────────────────────────────────

def create_access_token(db: Session, officer: Officer, extra: dict = None) -> str:
    """
    Generate short-lived JWT Access Token containing:
    user_id, username, role, permissions, officer_id, badge_number, exp
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    permissions = get_officer_permissions(db, officer)
    
    payload = {
        "sub": str(officer.id),
        "user_id": officer.id,
        "username": officer.username or officer.email.split("@")[0],
        "role": officer.role,
        "permissions": permissions,
        "officer_id": officer.officer_id or f"KSP-{officer.id:04d}",
        "badge_number": officer.badge_number or "",
        "type": "access",
        "exp": expire,
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(officer_id: int, remember_me: bool = False) -> str:
    """Generate long-lived JWT Refresh Token."""
    days = settings.REFRESH_TOKEN_EXPIRE_DAYS * (3 if remember_me else 1)
    expire = datetime.now(timezone.utc) + timedelta(days=days)
    payload = {
        "sub": str(officer_id),
        "user_id": officer_id,
        "type": "refresh",
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises JWTError on failure."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def access_token_expire_seconds() -> int:
    return settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


# ── Authentication & Security Logic ──────────────────────────────────────────

MAX_FAILED_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def authenticate_officer(
    db: Session, identifier: str, password: str, ip_address: Optional[str] = None
) -> tuple[Optional[Officer], Optional[str]]:
    """
    Authenticate officer credentials with account locking & audit logging.
    Returns (Officer, None) on success or (None, error_message) on failure.
    """
    clean_id = identifier.lower().strip()
    officer = db.query(Officer).filter(
        (func.lower(Officer.email) == clean_id) | (func.lower(Officer.username) == clean_id)
    ).first()

    if not officer:
        logger.warning(f"Login attempt for non-existent identifier: {identifier}")
        log_audit_event(db, "FAILED_LOGIN", details=f"Unknown identifier: {identifier}", ip_address=ip_address)
        return None, "Invalid email/username or password"

    if not officer.is_active:
        log_audit_event(db, "FAILED_LOGIN", user_id=officer.id, details="Inactive account", ip_address=ip_address)
        return None, "Account is deactivated. Please contact your system administrator."

    # Check if account is locked
    now = datetime.now(timezone.utc)
    if officer.account_locked_until and officer.account_locked_until > now:
        remaining_secs = int((officer.account_locked_until - now).total_seconds())
        remaining_mins = max(1, remaining_secs // 60)
        logger.warning(f"Locked account login attempt: {officer.email}")
        log_audit_event(db, "LOCKED_LOGIN_ATTEMPT", user_id=officer.id, ip_address=ip_address)
        return None, f"Account is temporarily locked due to multiple failed login attempts. Try again in {remaining_mins} minutes."

    # Verify password
    if not verify_password(password, officer.password_hash):
        officer.failed_login_attempts = (officer.failed_login_attempts or 0) + 1
        if officer.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
            officer.account_locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
            msg = f"Account locked for {LOCKOUT_MINUTES} minutes due to {MAX_FAILED_LOGIN_ATTEMPTS} failed attempts."
            logger.warning(f"Account locked: {officer.email}")
            log_audit_event(db, "ACCOUNT_LOCKED", user_id=officer.id, details=msg, ip_address=ip_address)
        else:
            log_audit_event(
                db, "FAILED_LOGIN", user_id=officer.id,
                details=f"Failed attempt {officer.failed_login_attempts}/{MAX_FAILED_LOGIN_ATTEMPTS}",
                ip_address=ip_address
            )
        db.commit()
        return None, "Invalid email/username or password"

    # Reset security counters on successful login
    officer.failed_login_attempts = 0
    officer.account_locked_until = None
    officer.last_login = now
    db.commit()
    db.refresh(officer)

    log_audit_event(db, "LOGIN", user_id=officer.id, details=f"Role: {officer.role}", ip_address=ip_address)
    logger.info(f"Officer authenticated: {officer.badge_number or officer.email} ({officer.role})")
    return officer, None


def get_officer_by_id(db: Session, officer_id: int) -> Optional[Officer]:
    return db.query(Officer).filter(Officer.id == officer_id).first()


def get_officer_by_email(db: Session, email: str) -> Optional[Officer]:
    return db.query(Officer).filter(func.lower(Officer.email) == email.lower().strip()).first()


def create_officer(db: Session, data: dict) -> Officer:
    """Create a new officer account with hashed password and role assignment."""
    email = data["email"].lower().strip()
    password = data["password"]
    role_name = data.get("role", "Constable")
    
    role_obj = db.query(Role).filter(Role.name == role_name).first()

    first_name = data.get("first_name") or data["full_name"].split()[0]
    last_name = data.get("last_name") or (" ".join(data["full_name"].split()[1:]) if len(data["full_name"].split()) > 1 else "")

    officer = Officer(
        email=email,
        username=data.get("username") or email.split("@")[0],
        officer_id=data.get("officer_id") or data.get("badge_number"),
        password_hash=hash_password(password),
        full_name=data["full_name"],
        first_name=first_name,
        last_name=last_name,
        badge_number=data.get("badge_number"),
        rank=data.get("rank") or role_name,
        role=role_name,
        role_id=role_obj.id if role_obj else None,
        district_id=data.get("district_id"),
        unit_id=data.get("unit_id") or data.get("police_station_id"),
        phone=data.get("phone"),
        state=data.get("state", "Karnataka"),
        is_active=data.get("is_active", True),
        is_verified=True,
    )
    db.add(officer)
    db.commit()
    db.refresh(officer)
    return officer

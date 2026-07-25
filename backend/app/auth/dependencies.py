"""
FastAPI dependency injection for authentication and Role-Based Access Control (RBAC).

Provides reusable dependencies:
  - RequireAuthentication / require_officer
  - RequireRole(*allowed_roles)
  - RequirePermission(*required_permissions)
  - CurrentUser / CurrentOfficer
"""
import logging
from typing import List, Optional, Union

from fastapi import Depends, HTTPException, Request, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.auth.models import Officer, ROLE_HIERARCHY
from app.auth.service import decode_token, get_officer_by_id, get_officer_permissions
from app.database.connection import get_db

logger = logging.getLogger(__name__)

# Bearer token scheme
bearer_scheme = HTTPBearer(auto_error=False)


# ── Core dependencies ───────────────────────────────────────────────────────────

def get_current_officer(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[Officer]:
    """
    Extract and validate a Bearer JWT token from the Authorization header.
    Returns None if no token present.
    Raises 401 Unauthorized if token is invalid or expired.
    """
    token = None
    if credentials:
        token = credentials.credentials
    elif "Authorization" in request.headers:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if not token:
        return None

    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        officer_id_str = payload.get("sub") or payload.get("user_id")
        if not officer_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        officer_id = int(officer_id_str)
    except (JWTError, ValueError, TypeError) as exc:
        logger.warning(f"JWT Token validation failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    officer = get_officer_by_id(db, officer_id)
    if not officer or not officer.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Officer account not found or deactivated",
        )

    return officer


def require_officer(
    officer: Optional[Officer] = Depends(get_current_officer),
) -> Officer:
    """Use this when authentication is REQUIRED (raises 401 if not authenticated)."""
    if officer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return officer


# Aliases specified in requirements
RequireAuthentication = require_officer
get_current_user = get_current_officer
CurrentUser = Depends(get_current_officer)
CurrentOfficer = Depends(require_officer)


# ── RBAC Authorization Dependencies ──────────────────────────────────────────

class RequireRole:
    """
    FastAPI dependency enforcing role membership.
    
    Usage:
        @router.get("/cases", dependencies=[Depends(RequireRole("Inspector", "SP"))])
        or
        def get_cases(officer: Officer = Depends(RequireRole("Inspector"))):
    """
    def __init__(self, *allowed_roles: str):
        self.allowed_roles = [r.strip() for r in allowed_roles]

    def __call__(self, officer: Officer = Depends(require_officer)) -> Officer:
        if not officer.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no role assigned",
            )
        
        # Admin has access to everything
        if officer.role.upper() == "ADMIN":
            return officer

        officer_role_lower = officer.role.lower()
        allowed_lower = [r.lower() for r in self.allowed_roles]

        if officer_role_lower not in allowed_lower:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Role '{officer.role}' is not authorized. Required: {self.allowed_roles}",
            )
        return officer


def require_role(*allowed_roles: str):
    """Factory helper for RequireRole dependency."""
    return RequireRole(*allowed_roles)


class RequirePermission:
    """
    FastAPI dependency enforcing specific permissions.
    
    Usage:
        @router.post("/cases", dependencies=[Depends(RequirePermission("Cases.Create"))])
        or
        def create_case(officer: Officer = Depends(RequirePermission("Cases.Create"))):
    """
    def __init__(self, *required_permissions: str):
        self.required_permissions = [p.strip() for p in required_permissions]

    def __call__(
        self, officer: Officer = Depends(require_officer), db: Session = Depends(get_db)
    ) -> Officer:
        # Admin bypass
        if officer.role and officer.role.upper() == "ADMIN":
            return officer

        officer_perms = get_officer_permissions(db, officer)
        officer_perms_lower = [p.lower() for p in officer_perms]

        # Check if officer has any of the required permissions
        has_perm = any(req.lower() in officer_perms_lower for req in self.required_permissions)
        
        if not has_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required permission: {self.required_permissions}",
            )
        return officer


def require_permission(*required_permissions: str):
    """Factory helper for RequirePermission dependency."""
    return RequirePermission(*required_permissions)


def require_min_role(min_role: str):
    """Factory: require officer to have a role >= min_role in the hierarchy."""
    min_level = ROLE_HIERARCHY.get(min_role, 0)

    def _checker(officer: Officer = Depends(require_officer)) -> Officer:
        if officer.role_level < min_level and officer.role.upper() != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient authority. Minimum required role: {min_role}",
            )
        return officer
    return _checker


# ── Row-Level Security ────────────────────────────────────────────────────────

def get_jurisdiction_filter(officer: Optional[Officer] = Depends(get_current_officer)) -> dict:
    """
    Returns a dict of SQLAlchemy filter conditions based on officer's jurisdiction.
    """
    if officer is None:
        return {}

    role = officer.role
    role_upper = (role or "").upper()
    filters = {}

    if role_upper in ("ADMIN", "DGP"):
        return {}

    if role_upper == "ADGP" and officer.zone_id:
        filters["zone_id"] = officer.zone_id
    elif role_upper == "IGP" and officer.range_id:
        filters["range_id"] = officer.range_id
    elif role_upper in ("DIG", "SP") and officer.district_id:
        filters["district_id"] = officer.district_id
    elif role_upper in ("DSP", "ACP", "INSPECTOR", "SUB INSPECTOR", "SI", "HEAD CONSTABLE", "HC", "CONSTABLE"):
        if officer.unit_id:
            filters["police_station_id"] = officer.unit_id
        if officer.district_id:
            filters["district_id"] = officer.district_id
    elif role_upper in ("ANALYST", "GUEST"):
        filters["restrict_sensitive"] = True

    return filters

"""
FastAPI dependency injection for authentication and authorisation.

v3.0 — Token verification now uses :class:`~app.catalyst.auth_bridge.CatalystAuthBridge`:
  1. Try Catalyst Auth token (if Catalyst is configured)
  2. Fall back to existing JWT (always available)
  Both paths produce the same ``Officer`` ORM object — all existing routes
  are completely unaffected.

Session data is cached in Catalyst Cache (SEGMENT_SESSION) after successful
authentication.  On subsequent requests the cached session is used for
jurisdiction filtering without a DB query.

Usage in route:
    @router.get("/cases")
    def get_cases(officer: Officer = Depends(get_current_officer)):
        ...

    @router.delete("/cases/{id}")
    def delete_case(officer: Officer = Depends(require_role("ADMIN", "DGP"))):
        ...
"""
import logging
from typing import Optional

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.auth.models import Officer, ROLE_HIERARCHY
from app.auth.service import get_officer_by_id
from app.catalyst.auth_bridge import auth_bridge
from app.database.connection import get_db

logger = logging.getLogger(__name__)

# Bearer token scheme
bearer_scheme = HTTPBearer(auto_error=False)


# ── Core dependency ───────────────────────────────────────────────────────────

def get_current_officer(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[Officer]:
    """
    Extract and validate a Bearer token from the Authorization header.

    v3.0 — Token verification order:
      1. Catalyst Auth (if Catalyst is configured)
      2. Existing JWT (always available as fallback)

    Returns None (not 401) if no token present — allowing optional auth on routes.
    Raises 401 if a token is present but fails both verification paths.
    """
    if not credentials:
        return None

    raw_token = credentials.credentials

    # ── Bridge verification (Catalyst → JWT fallback) ──────────────────────
    claims = auth_bridge.verify(raw_token)
    if not claims or not claims.officer_id:
        logger.warning("Token rejected by both Catalyst Auth and JWT")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    officer = get_officer_by_id(db, claims.officer_id)
    if not officer or not officer.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Officer account not found or deactivated",
        )

    # ── Cache session in Catalyst Cache (non-blocking best-effort) ─────────
    try:
        auth_bridge.store_session(
            officer.id,
            {
                "role": officer.role,
                "district_id": officer.district_id,
                "unit_id": officer.unit_id,
                "badge_number": officer.badge_number,
                "token_type": claims.token_type,
            },
        )
    except Exception as exc:  # noqa: BLE001
        logger.debug("Session cache store failed (non-fatal): %s", exc)

    logger.debug(
        "Officer authenticated: id=%d role=%s via=%s",
        officer.id,
        officer.role,
        claims.token_type,
    )
    return officer


def require_officer(
    officer: Optional[Officer] = Depends(get_current_officer),
) -> Officer:
    """Use this when auth is REQUIRED (raises 401 if not authenticated)."""
    if officer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return officer


def require_role(*allowed_roles: str):
    """
    Factory: create a dependency that enforces role membership.

    Usage:
        Depends(require_role("ADMIN", "DGP", "SP"))
    """
    def _checker(officer: Officer = Depends(require_officer)) -> Officer:
        if officer.role not in allowed_roles and "ADMIN" not in [officer.role]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{officer.role}' is not authorised. Required: {list(allowed_roles)}",
            )
        return officer
    return _checker


def require_min_role(min_role: str):
    """
    Factory: require officer to have a role >= min_role in the hierarchy.

    Usage:
        Depends(require_min_role("SP"))  # SP and above
    """
    min_level = ROLE_HIERARCHY.get(min_role, 0)

    def _checker(officer: Officer = Depends(require_officer)) -> Officer:
        if officer.role_level < min_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient authority. Minimum required: {min_role}",
            )
        return officer
    return _checker


# ── Row-Level Security ────────────────────────────────────────────────────────

def get_jurisdiction_filter(officer: Optional[Officer] = Depends(get_current_officer)) -> dict:
    """
    Returns a dict of SQLAlchemy filter conditions based on officer's jurisdiction.
    Used to enforce row-level security on cases, suspects, FIRs, evidence.

    ADMIN / DGP → no filter (see all Karnataka)
    ADGP        → filter by zone_id
    IGP         → filter by range_id
    DIG         → filter by district group
    SP          → filter by district_id
    DSP / ACP / Inspector / SI → filter by unit_id (police station)
    Constable / Analyst / Guest → read-only + station filter
    """
    if officer is None:
        # Unauthenticated — return empty filter (routes decide if they enforce auth)
        return {}

    role = officer.role
    filters = {}

    if role in ("ADMIN", "DGP"):
        # Full Karnataka access — no geographic filter
        return {}

    if role == "ADGP" and officer.zone_id:
        filters["zone_id"] = officer.zone_id

    elif role == "IGP" and officer.range_id:
        filters["range_id"] = officer.range_id

    elif role in ("DIG", "SP") and officer.district_id:
        filters["district_id"] = officer.district_id

    elif role in ("DSP", "ACP", "Inspector", "Sub Inspector", "Head Constable", "Constable"):
        if officer.unit_id:
            filters["police_station_id"] = officer.unit_id
        if officer.district_id:
            filters["district_id"] = officer.district_id

    elif role in ("Analyst", "Guest"):
        # Analysts see analytics only; Guests see nothing sensitive
        filters["restrict_sensitive"] = True

    return filters

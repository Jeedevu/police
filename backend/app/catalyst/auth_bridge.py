"""
backend/app/catalyst/auth_bridge.py
======================================
KSP Crime Intelligence Platform — Catalyst Auth Bridge

The bridge between the existing JWT-based authentication system and the new
Catalyst Auth layer.  Both mechanisms run in parallel:

  Verification order
  ------------------
  1. Try Catalyst token verification (if Catalyst is configured)
  2. If Catalyst token fails or Catalyst is not configured → fall back to
     the existing JWT verification (app.auth.service.decode_token)

This ensures:
  * All existing React frontend clients using JWT tokens continue to work
    without any modification.
  * New clients (future mobile app, Catalyst Console) can authenticate via
    Catalyst OAuth and receive the same ``OfficerClaims`` result.
  * Zero disruption to any existing route that uses ``require_officer()`` or
    ``get_current_officer()``.

OfficerClaims
-------------
A lightweight dataclass that both auth paths produce.  It is passed to
:func:`~app.auth.dependencies.get_current_officer` which resolves the
corresponding PostgreSQL ``Officer`` record.

The bridge is stateless — it does not maintain its own session store.
Session data continues to live in JWT claims (existing) and optionally in
Catalyst Cache (new).
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Optional

from jose import JWTError

logger = logging.getLogger("ksp.catalyst.auth_bridge")


@dataclass
class OfficerClaims:
    """
    Normalised claims extracted from either a JWT or a Catalyst token.

    Fields are optional so the bridge can be called with partial information
    and the caller decides what is mandatory.
    """
    officer_id: Optional[int] = None        # PostgreSQL officer PK
    role: str = "Guest"                     # Officer role string
    token_type: str = "jwt"                 # "jwt" | "catalyst"
    catalyst_user_id: Optional[str] = None  # Catalyst user ID (if Catalyst token)
    extra: dict = field(default_factory=dict)

    @property
    def is_authenticated(self) -> bool:
        """True if a valid officer_id was resolved."""
        return self.officer_id is not None


class CatalystAuthBridge:
    """
    Token verification bridge — tries Catalyst first, falls back to JWT.

    Usage (in app.auth.dependencies)::

        bridge = CatalystAuthBridge()
        claims = bridge.verify(raw_token)
        if claims and claims.officer_id:
            officer = get_officer_by_id(db, claims.officer_id)

    The bridge is instantiated once as a module-level singleton to avoid
    repeated construction overhead.
    """

    def __init__(self) -> None:
        self._catalyst_auth: Optional[object] = None

    def _get_catalyst_auth(self):
        """Lazy-import CatalystAuthWrapper to avoid circular imports."""
        if self._catalyst_auth is None:
            from app.catalyst.auth import CatalystAuthWrapper
            self._catalyst_auth = CatalystAuthWrapper()
        return self._catalyst_auth

    # ── Primary entry point ────────────────────────────────────────────────

    def verify(self, raw_token: str) -> Optional[OfficerClaims]:
        """
        Verify a Bearer token using either Catalyst Auth or JWT.

        Verification order:
          1. Catalyst Auth token (if Catalyst is configured)
          2. Existing JWT (always available as fallback)

        Parameters
        ----------
        raw_token:
            The raw Bearer token string from the Authorization header
            (without the "Bearer " prefix).

        Returns
        -------
        OfficerClaims or None
            None if both verification paths fail.
        """
        # ── Path 1: Catalyst Auth ──────────────────────────────────────────
        catalyst_claims = self._verify_via_catalyst(raw_token)
        if catalyst_claims:
            logger.debug(
                "Token verified via Catalyst Auth: officer_id=%s",
                catalyst_claims.officer_id,
            )
            return catalyst_claims

        # ── Path 2: Existing JWT ───────────────────────────────────────────
        jwt_claims = self._verify_via_jwt(raw_token)
        if jwt_claims:
            logger.debug(
                "Token verified via JWT: officer_id=%s", jwt_claims.officer_id
            )
            return jwt_claims

        logger.warning("Token verification failed via both Catalyst Auth and JWT")
        return None

    # ── Catalyst verification ──────────────────────────────────────────────

    def _verify_via_catalyst(self, token: str) -> Optional[OfficerClaims]:
        """
        Try to verify the token via Catalyst Auth SDK.

        Maps the ``catalyst_user_id`` to a PostgreSQL ``officer_id`` using
        the ``email`` claim present in the Catalyst token.

        Returns None silently if:
          * Catalyst is not configured
          * Token is not a valid Catalyst token
          * No officer with matching email found in PostgreSQL
        """
        try:
            auth_wrapper = self._get_catalyst_auth()
            user_details = auth_wrapper.verify_token(token)  # type: ignore[attr-defined]

            if not user_details:
                return None

            catalyst_user_id = str(user_details.get("user_id", ""))
            email = user_details.get("email_id") or user_details.get("email", "")
            role = user_details.get("role_details", {}).get("role_name", "Guest")

            if not email:
                logger.debug("Catalyst token missing email claim — cannot resolve officer")
                return None

            # Resolve officer_id from email via PostgreSQL
            officer_id = self._resolve_officer_id_by_email(email)
            if not officer_id:
                logger.debug(
                    "Catalyst token email=%s has no matching officer in PostgreSQL", email
                )
                return None

            return OfficerClaims(
                officer_id=officer_id,
                role=role,
                token_type="catalyst",
                catalyst_user_id=catalyst_user_id,
                extra={"email": email},
            )
        except Exception as exc:
            logger.debug("Catalyst token verification error: %s", exc)
            return None

    # ── JWT verification ───────────────────────────────────────────────────

    def _verify_via_jwt(self, token: str) -> Optional[OfficerClaims]:
        """
        Verify using the existing python-jose JWT mechanism.

        Delegates to the existing ``app.auth.service.decode_token()`` function,
        which uses the ``SECRET_KEY`` from settings.  This path is unchanged
        from the pre-Catalyst architecture.
        """
        try:
            from app.auth.service import decode_token
            payload = decode_token(token)

            if payload.get("type") != "access":
                return None

            officer_id = int(payload["sub"])
            role = payload.get("role", "Guest")

            return OfficerClaims(
                officer_id=officer_id,
                role=role,
                token_type="jwt",
            )
        except (JWTError, KeyError, ValueError, TypeError) as exc:
            logger.debug("JWT verification failed: %s", exc)
            return None

    # ── Helper ─────────────────────────────────────────────────────────────

    @staticmethod
    def _resolve_officer_id_by_email(email: str) -> Optional[int]:
        """
        Look up the PostgreSQL officer PK by email address.

        This is a direct DB query — kept outside the repository pattern for
        simplicity since the bridge runs very early in the request lifecycle.
        """
        try:
            from app.database.connection import SessionLocal
            from app.auth.service import get_officer_by_email

            db = SessionLocal()
            try:
                officer = get_officer_by_email(db, email)
                return officer.id if officer and officer.is_active else None
            finally:
                db.close()
        except Exception as exc:
            logger.error("Failed to resolve officer by email=%s: %s", email, exc)
            return None

    # ── Session management (Catalyst Cache backed) ─────────────────────────

    def store_session(self, officer_id: int, session_data: dict) -> bool:
        """
        Store officer session data in Catalyst Cache.

        Falls back silently if Catalyst is not configured.

        Parameters
        ----------
        officer_id:
            PostgreSQL officer PK.
        session_data:
            Dict of session attributes to cache (role, jurisdiction, etc.)

        Returns
        -------
        bool — True on success.
        """
        try:
            from app.catalyst.cache import CatalystCacheWrapper, SEGMENT_SESSION, TTL_SESSION
            cache = CatalystCacheWrapper()
            return cache.put(
                SEGMENT_SESSION,
                f"session:officer:{officer_id}",
                session_data,
                TTL_SESSION,
            )
        except Exception as exc:
            logger.debug("Session cache write failed: %s", exc)
            return False

    def get_session(self, officer_id: int) -> Optional[dict]:
        """
        Retrieve officer session data from Catalyst Cache.

        Returns None on cache miss or Catalyst unavailability.
        """
        try:
            from app.catalyst.cache import CatalystCacheWrapper, SEGMENT_SESSION
            cache = CatalystCacheWrapper()
            return cache.get(SEGMENT_SESSION, f"session:officer:{officer_id}")
        except Exception as exc:
            logger.debug("Session cache read failed: %s", exc)
            return None

    def invalidate_session(self, officer_id: int) -> bool:
        """
        Invalidate (delete) an officer's cached session on logout.

        Parameters
        ----------
        officer_id:
            PostgreSQL officer PK.
        """
        try:
            from app.catalyst.cache import CatalystCacheWrapper, SEGMENT_SESSION
            cache = CatalystCacheWrapper()
            return cache.delete(SEGMENT_SESSION, f"session:officer:{officer_id}")
        except Exception as exc:
            logger.debug("Session cache invalidation failed: %s", exc)
            return False


# ── Module-level singleton ─────────────────────────────────────────────────────
# Import this in app.auth.dependencies — do not instantiate inline per request.
auth_bridge = CatalystAuthBridge()

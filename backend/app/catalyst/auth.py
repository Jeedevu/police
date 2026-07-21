"""
backend/app/catalyst/auth.py
==============================
KSP Crime Intelligence Platform — Catalyst Authentication Wrapper

Wraps the Zoho Catalyst Authentication SDK.  This wrapper is used by the
:mod:`app.catalyst.auth_bridge` to validate Catalyst-issued tokens and manage
Catalyst user accounts that shadow the existing ``officers`` PostgreSQL table.

Architecture
------------
Auth router → AuthService → CatalystAuthWrapper → zcatalyst_sdk.auth

Key design choices
------------------
* This wrapper is ADDITIVE.  The existing JWT auth (``app.auth.service``)
  remains the primary auth mechanism.  Catalyst auth is layered on top to
  support session management, SSO, and future Catalyst Console access.
* Officer badge/password login is NOT replaced.  Catalyst provides a secondary
  session layer that can validate tokens independently.
* Every external call is wrapped in try/except to prevent SDK errors from
  propagating to the HTTP layer.

Environment variables
---------------------
  CATALYST_PROJECT_ID    — read by zcatalyst_sdk (set once in config.py)
  CATALYST_PROJECT_KEY   — read by zcatalyst_sdk

TODO:CREDENTIALS — ensure all CATALYST_* vars are set before using this module.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from app.catalyst.config import CatalystServiceError, get_catalyst_app, is_catalyst_available

logger = logging.getLogger("ksp.catalyst.auth")


class CatalystAuthWrapper:
    """
    Thin wrapper around Catalyst Authentication SDK.

    Provides user management operations:
      - token verification for Catalyst-issued tokens
      - user creation (called when a new officer is registered)
      - user profile retrieval / update
      - password reset initiation via Catalyst Auth
    """

    # ── Token verification ─────────────────────────────────────────────────

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify a Catalyst-issued token and return the user claims dict.

        Returns ``None`` if the token is invalid or Catalyst is unavailable.
        The caller (:class:`~app.catalyst.auth_bridge.CatalystAuthBridge`)
        will then fall back to local JWT verification.

        Parameters
        ----------
        token:
            Raw Bearer token from the Authorization header.

        Returns
        -------
        dict or None
            On success: ``{"user_id": str, "email": str, "role": str, ...}``
            On failure / unavailable: ``None``
        """
        if not is_catalyst_available():
            logger.debug("Catalyst unavailable — skipping Catalyst token verification")
            return None

        try:
            app = get_catalyst_app()
            auth = app.Authentication()  # type: ignore[attr-defined]
            user_details = auth.validate_token(token)
            logger.debug("Catalyst token validated for user_id=%s", user_details.get("user_id"))
            return user_details
        except Exception as exc:  # noqa: BLE001
            logger.debug("Catalyst token validation failed (will fall back to JWT): %s", exc)
            return None

    # ── User management ────────────────────────────────────────────────────

    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a Catalyst user profile by ID.

        Parameters
        ----------
        user_id:
            Catalyst user ID (string).

        Returns
        -------
        dict or None
        """
        if not is_catalyst_available():
            return None

        try:
            app = get_catalyst_app()
            user_management = app.UserManagement()  # type: ignore[attr-defined]
            user = user_management.get_current_user()
            logger.debug("Fetched Catalyst user profile: user_id=%s", user_id)
            return dict(user)
        except Exception as exc:
            logger.error("Failed to fetch Catalyst user (user_id=%s): %s", user_id, exc)
            return None

    def create_user(
        self,
        email: str,
        full_name: str,
        role_type: str = "App User",
    ) -> Optional[Dict[str, Any]]:
        """
        Create a shadow Catalyst user account that mirrors a new officer record.

        This is called during officer registration so that Catalyst Auth tokens
        can be issued in addition to the existing JWT tokens.

        Parameters
        ----------
        email:
            Officer email address (used as the Catalyst login identifier).
        full_name:
            Display name shown in Catalyst Console.
        role_type:
            Catalyst platform role.  Use "App User" for standard officers,
            "App Admin" for ADMIN-level officers.
            (TODO:CREDENTIALS — verify role names in your Catalyst Console)

        Returns
        -------
        dict or None
            Created user record from Catalyst, or None on failure.
        """
        if not is_catalyst_available():
            logger.warning(
                "Catalyst unavailable — officer %s not registered in Catalyst Auth", email
            )
            return None

        try:
            app = get_catalyst_app()
            user_management = app.UserManagement()  # type: ignore[attr-defined]
            user = user_management.invite_user(
                {
                    "email_id": email,
                    "first_name": full_name.split()[0] if full_name else full_name,
                    "last_name": " ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else "",
                    "role_details": {"role_name": role_type},
                }
            )
            logger.info("✓ Catalyst user created: email=%s", email)
            return dict(user)
        except Exception as exc:
            logger.error("Failed to create Catalyst user (email=%s): %s", email, exc)
            return None

    def update_user(self, user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update a Catalyst user profile.

        Parameters
        ----------
        user_id:
            Catalyst user ID.
        data:
            Dict of fields to update.  Supported keys: ``first_name``,
            ``last_name``, ``phone_number``.

        Returns
        -------
        dict or None
        """
        if not is_catalyst_available():
            return None

        try:
            app = get_catalyst_app()
            user_management = app.UserManagement()  # type: ignore[attr-defined]
            updated = user_management.update_user_details(user_id, data)
            logger.info("Catalyst user updated: user_id=%s", user_id)
            return dict(updated)
        except Exception as exc:
            logger.error("Failed to update Catalyst user (user_id=%s): %s", user_id, exc)
            return None

    def reset_password(self, email: str) -> bool:
        """
        Trigger a Catalyst-managed password reset email.

        Parameters
        ----------
        email:
            The officer's registered email address.

        Returns
        -------
        bool
            True if the reset was triggered successfully.
        """
        if not is_catalyst_available():
            logger.warning(
                "Catalyst unavailable — password reset for %s must use legacy flow", email
            )
            return False

        try:
            app = get_catalyst_app()
            user_management = app.UserManagement()  # type: ignore[attr-defined]
            user_management.reset_password(email)
            logger.info("Catalyst password reset triggered: email=%s", email)
            return True
        except Exception as exc:
            logger.error("Catalyst password reset failed (email=%s): %s", email, exc)
            return False

    def list_users(self) -> list:
        """
        List all users registered in Catalyst Auth for this project.

        Returns
        -------
        list[dict]
        """
        if not is_catalyst_available():
            return []

        try:
            app = get_catalyst_app()
            user_management = app.UserManagement()  # type: ignore[attr-defined]
            users = user_management.get_all_users()
            return [dict(u) for u in users]
        except Exception as exc:
            logger.error("Failed to list Catalyst users: %s", exc)
            return []

    # ── Health ─────────────────────────────────────────────────────────────

    def health_check(self) -> Dict[str, Any]:
        """Return wrapper health status for the /health endpoint."""
        available = is_catalyst_available()
        return {
            "service": "catalyst_auth",
            "available": available,
            "status": "ok" if available else "unconfigured",
        }

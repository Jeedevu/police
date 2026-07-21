"""
backend/app/catalyst/config.py
================================
KSP Crime Intelligence Platform — Catalyst SDK Initialiser

This module provides the **single point of truth** for initialising the
Zoho Catalyst Python SDK (``zcatalyst-sdk``).  Every other wrapper in
this package calls :func:`get_catalyst_app` to obtain the initialised
Catalyst application instance.

Design decisions
----------------
* ``zcatalyst_sdk.initialize()`` is called **once** at import time through
  the :class:`CatalystConfig` singleton.  Subsequent calls to
  :func:`get_catalyst_app` return the cached instance.
* The module reads credentials from environment variables exclusively.
  No credentials are ever hardcoded.
* A ``is_available()`` helper lets callers degrade gracefully when Catalyst
  is not configured (e.g. running purely against the local PostgreSQL in a
  dev environment without Zoho credentials).

Environment variables required
------------------------------
  CATALYST_PROJECT_ID      — Zoho Catalyst project ID
                             (found in .catalystrc or Catalyst console)
  CATALYST_PROJECT_KEY     — Project API key (Catalyst console → Project → Keys)
  CATALYST_CLIENT_ID       — Zoho OAuth Client ID (api-console.zoho.com)
  CATALYST_CLIENT_SECRET   — Zoho OAuth Client Secret
  CATALYST_REFRESH_TOKEN   — OAuth refresh token (generated via OAuth flow)
  CATALYST_ENV             — "development" | "production"  (default: development)
  CATALYST_ORG_ID          — Zoho organisation ID (optional, for multi-org setups)

TODO:CREDENTIALS — populate the variables above in your .env file before
                   enabling any Catalyst service.
"""
from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Any, Optional

logger = logging.getLogger("ksp.catalyst.config")


class CatalystServiceError(Exception):
    """Raised when a Catalyst SDK operation fails after retries."""


class CatalystConfig:
    """
    Singleton that initialises the Zoho Catalyst SDK exactly once.

    Usage::

        from app.catalyst.config import get_catalyst_app
        app = get_catalyst_app()          # returns zcatalyst_sdk app instance or None
    """

    def __init__(self) -> None:
        self._app: Optional[Any] = None
        self._configured: bool = False
        self._init_attempted: bool = False

    # ── Public API ─────────────────────────────────────────────────────────

    def initialize(self) -> Optional[Any]:
        """
        Initialise the Catalyst SDK with credentials from environment variables.

        Returns the SDK app instance on success, or ``None`` if credentials are
        missing (allowing the rest of the platform to run without Catalyst).
        """
        if self._init_attempted:
            return self._app

        self._init_attempted = True

        project_id = os.getenv("CATALYST_PROJECT_ID", "")
        project_key = os.getenv("CATALYST_PROJECT_KEY", "")
        client_id = os.getenv("CATALYST_CLIENT_ID", "")
        client_secret = os.getenv("CATALYST_CLIENT_SECRET", "")
        refresh_token = os.getenv("CATALYST_REFRESH_TOKEN", "")
        environment = os.getenv("CATALYST_ENV", "development")

        # ── Validate presence of required credentials ─────────────────────
        missing = [
            name
            for name, value in {
                "CATALYST_PROJECT_ID": project_id,
                "CATALYST_PROJECT_KEY": project_key,
                "CATALYST_CLIENT_ID": client_id,
                "CATALYST_CLIENT_SECRET": client_secret,
                "CATALYST_REFRESH_TOKEN": refresh_token,
            }.items()
            if not value
        ]

        if missing:
            logger.warning(
                "Catalyst SDK not initialised — missing environment variables: %s. "
                "Platform will run in PostgreSQL-only mode.  Set these variables to "
                "enable Catalyst services.  (TODO:CREDENTIALS)",
                ", ".join(missing),
            )
            return None

        # ── Attempt SDK initialisation ────────────────────────────────────
        try:
            import zcatalyst_sdk as zc  # type: ignore[import]

            options = {
                "project_id": project_id,
                "project_key": project_key,
                "environment": environment,
                "credential_details": {
                    "type": "refresh",
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "refresh_token": refresh_token,
                },
            }

            self._app = zc.initialize(options)
            self._configured = True
            logger.info(
                "✓ Catalyst SDK initialised | project=%s | env=%s",
                project_id,
                environment,
            )
        except ImportError:
            logger.error(
                "zcatalyst-sdk is not installed.  Add it to requirements.txt: "
                "zcatalyst-sdk>=1.0.0"
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("Catalyst SDK initialisation failed: %s", exc)

        return self._app

    def is_available(self) -> bool:
        """Return True if the SDK is initialised and Catalyst services are usable."""
        return self._configured and self._app is not None

    @property
    def app(self) -> Optional[Any]:
        """The raw zcatalyst_sdk app instance (None if not configured)."""
        return self._app


# ── Module-level singleton ─────────────────────────────────────────────────────

_catalyst_config = CatalystConfig()


@lru_cache(maxsize=1)
def get_catalyst_app() -> Optional[Any]:
    """
    Return the initialised Catalyst app instance (cached singleton).

    Returns ``None`` if credentials are not configured, allowing callers to
    degrade gracefully::

        app = get_catalyst_app()
        if app is None:
            logger.warning("Catalyst unavailable — using local fallback")
            return fallback_result

    This function is safe to call at module import time.
    """
    return _catalyst_config.initialize()


def is_catalyst_available() -> bool:
    """Convenience shortcut — True when Catalyst is fully configured."""
    # Ensure initialisation has run at least once
    get_catalyst_app()
    return _catalyst_config.is_available()


def validate_catalyst_config() -> bool:
    """
    Validate presence of required Catalyst environment variables on startup.
    Logs warnings for any missing credentials, returning True if all present.
    """
    app = get_catalyst_app()
    available = is_catalyst_available()
    if available:
        logger.info("✓ Catalyst configuration validated successfully.")
    else:
        logger.warning(
            "Catalyst configuration check: unconfigured or missing credentials. "
            "Running in PostgreSQL-only mode."
        )
    return available


def catalyst_health_check() -> dict[str, Any]:
    """
    Consolidated health check across all 13 Catalyst service wrappers.
    Returns status dict for system monitoring endpoints.
    """
    available = is_catalyst_available()

    # Import wrappers lazily to avoid circular imports
    from app.catalyst.auth import CatalystAuthWrapper
    from app.catalyst.cache import CatalystCacheWrapper
    from app.catalyst.connections import CatalystConnectionsWrapper
    from app.catalyst.datastore import CatalystDataStoreWrapper
    from app.catalyst.filestore import CatalystFileStoreWrapper
    from app.catalyst.mail import CatalystMailWrapper
    from app.catalyst.nosql import CatalystNoSQLWrapper
    from app.catalyst.quickml import CatalystQuickMLWrapper
    from app.catalyst.scheduler import CatalystSchedulerWrapper
    from app.catalyst.signals import CatalystSignalsWrapper
    from app.catalyst.smartbrowz import CatalystSmartBrowzWrapper
    from app.catalyst.zia import CatalystZiaWrapper

    services = {
        "auth": CatalystAuthWrapper().health_check(),
        "datastore": CatalystDataStoreWrapper().health_check(),
        "nosql": CatalystNoSQLWrapper().health_check(),
        "filestore": CatalystFileStoreWrapper().health_check(),
        "cache": CatalystCacheWrapper().health_check(),
        "zia": CatalystZiaWrapper().health_check(),
        "quickml": CatalystQuickMLWrapper().health_check(),
        "smartbrowz": CatalystSmartBrowzWrapper().health_check(),
        "signals": CatalystSignalsWrapper().health_check(),
        "mail": CatalystMailWrapper().health_check(),
        "scheduler": CatalystSchedulerWrapper().health_check(),
        "connections": CatalystConnectionsWrapper().health_check(),
    }

    return {
        "status": "healthy" if available else "degraded",
        "catalyst_sdk_available": available,
        "mode": "hybrid_catalyst_pg" if available else "pg_only",
        "services": services,
    }


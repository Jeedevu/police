"""
backend/app/catalyst/__init__.py
=================================
KSP Crime Intelligence Platform — Catalyst Services Package

This package contains thin wrapper classes for every Zoho Catalyst service
used by the platform.  Each wrapper:

  * Reads credentials exclusively from environment variables (never hardcoded)
  * Logs every request at DEBUG level and every error at ERROR level
  * Raises typed exceptions (CatalystServiceError) instead of raw SDK errors
  * Implements a graceful ``is_available()`` check so callers can degrade nicely

Wrappers are imported here as convenience re-exports so service/repository
layers only need to do::

    from app.catalyst import CatalystAuthWrapper, CatalystFileStoreWrapper, …

Architecture
------------
Router → Service → Repository → Catalyst Wrapper → Catalyst SDK → Zoho API

Never call Catalyst SDK methods directly from routers or services.
"""

from app.catalyst.config import CatalystConfig, get_catalyst_app  # noqa: F401
from app.catalyst.auth import CatalystAuthWrapper  # noqa: F401
from app.catalyst.datastore import CatalystDataStoreWrapper  # noqa: F401
from app.catalyst.nosql import CatalystNoSQLWrapper  # noqa: F401
from app.catalyst.filestore import CatalystFileStoreWrapper  # noqa: F401
from app.catalyst.cache import CatalystCacheWrapper  # noqa: F401
from app.catalyst.zia import CatalystZiaWrapper  # noqa: F401
from app.catalyst.quickml import CatalystQuickMLWrapper  # noqa: F401
from app.catalyst.smartbrowz import CatalystSmartBrowzWrapper  # noqa: F401
from app.catalyst.signals import CatalystSignalsWrapper  # noqa: F401
from app.catalyst.mail import CatalystMailWrapper  # noqa: F401
from app.catalyst.scheduler import CatalystSchedulerWrapper  # noqa: F401
from app.catalyst.connections import CatalystConnectionsWrapper  # noqa: F401

__all__ = [
    "CatalystConfig",
    "get_catalyst_app",
    "CatalystAuthWrapper",
    "CatalystDataStoreWrapper",
    "CatalystNoSQLWrapper",
    "CatalystFileStoreWrapper",
    "CatalystCacheWrapper",
    "CatalystZiaWrapper",
    "CatalystQuickMLWrapper",
    "CatalystSmartBrowzWrapper",
    "CatalystSignalsWrapper",
    "CatalystMailWrapper",
    "CatalystSchedulerWrapper",
    "CatalystConnectionsWrapper",
]

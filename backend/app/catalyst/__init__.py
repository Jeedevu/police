"""
backend/app/catalyst/__init__.py
=================================
KSP Crime Intelligence Platform — Catalyst Services Package

This package contains thin wrapper classes for Zoho Catalyst operational services:
File Store, OCR, Speech Services, NoSQL, Cache, Signals, Cron, and Mail.

Authentication is handled natively by PostgreSQL + FastAPI JWT + RBAC.
"""

from app.catalyst.config import CatalystConfig, get_catalyst_app  # noqa: F401
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

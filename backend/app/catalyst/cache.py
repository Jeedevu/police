"""
backend/app/catalyst/cache.py
================================
KSP Crime Intelligence Platform — Catalyst Cache Wrapper

Wraps the Zoho Catalyst Cache SDK.

Cache segments (created in Catalyst Console → Cache)
----------------------------------------------------
  CATALYST_CACHE_SEGMENT_DASHBOARD    — dashboard statistics (TTL 300s)
  CATALYST_CACHE_SEGMENT_OFFICER      — officer profile blobs (TTL 600s)
  CATALYST_CACHE_SEGMENT_ANALYTICS    — crime analytics per district (TTL 1800s)
  CATALYST_CACHE_SEGMENT_HEATMAP      — heatmap data (TTL 3600s)
  CATALYST_CACHE_SEGMENT_AI           — AI response cache (TTL 300s)
  CATALYST_CACHE_SEGMENT_SESSION      — officer session data (TTL 1800s)
  CATALYST_CACHE_SEGMENT_CASES        — recent-cases list (TTL 120s)

Each segment ID is a numeric string from the Catalyst Console.

Environment variables
---------------------
  CATALYST_CACHE_SEGMENT_DASHBOARD  — segment ID
  CATALYST_CACHE_SEGMENT_OFFICER    — segment ID
  CATALYST_CACHE_SEGMENT_ANALYTICS  — segment ID
  CATALYST_CACHE_SEGMENT_HEATMAP    — segment ID
  CATALYST_CACHE_SEGMENT_AI         — segment ID
  CATALYST_CACHE_SEGMENT_SESSION    — segment ID
  CATALYST_CACHE_SEGMENT_CASES      — segment ID

TODO:CREDENTIALS — create cache segments in Catalyst Console → Cache and set these env vars.
"""
from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, Optional

from app.catalyst.config import CatalystServiceError, get_catalyst_app, is_catalyst_available

logger = logging.getLogger("ksp.catalyst.cache")

# ── Segment env var names ─────────────────────────────────────────────────────
SEGMENT_DASHBOARD = "CATALYST_CACHE_SEGMENT_DASHBOARD"
SEGMENT_OFFICER = "CATALYST_CACHE_SEGMENT_OFFICER"
SEGMENT_ANALYTICS = "CATALYST_CACHE_SEGMENT_ANALYTICS"
SEGMENT_HEATMAP = "CATALYST_CACHE_SEGMENT_HEATMAP"
SEGMENT_AI = "CATALYST_CACHE_SEGMENT_AI"
SEGMENT_SESSION = "CATALYST_CACHE_SEGMENT_SESSION"
SEGMENT_CASES = "CATALYST_CACHE_SEGMENT_CASES"

# Default TTLs (seconds)
TTL_DASHBOARD = 300
TTL_OFFICER = 600
TTL_ANALYTICS = 1800
TTL_HEATMAP = 3600
TTL_AI = 300
TTL_SESSION = 1800
TTL_CASES = 120


def _get_segment_id(segment_env: str) -> Optional[str]:
    """Resolve a cache segment ID from environment variable."""
    seg_id = os.getenv(segment_env, "")
    if not seg_id:
        logger.warning(
            "Cache segment ID not set.  Set env var %s  (TODO:CREDENTIALS)", segment_env
        )
    return seg_id or None


class CatalystCacheWrapper:
    """
    Thin wrapper around Catalyst Cache SDK.

    Values are serialised to JSON strings internally so any JSON-compatible
    Python object (dict, list, str, int) can be cached transparently.

    All methods degrade gracefully when Catalyst is not configured —
    ``get()`` returns None (cache miss), ``put()`` returns False silently.
    """

    # ── Core operations ────────────────────────────────────────────────────

    def get(self, segment_env: str, cache_key: str) -> Optional[Any]:
        """
        Retrieve a cached value.

        Parameters
        ----------
        segment_env:
            Environment variable name that holds the segment ID
            (e.g. ``SEGMENT_DASHBOARD``).
        cache_key:
            String key for the cached item.

        Returns
        -------
        Deserialised value, or ``None`` on cache miss or unavailability.
        """
        if not is_catalyst_available():
            return None

        segment_id = _get_segment_id(segment_env)
        if not segment_id:
            return None

        try:
            app = get_catalyst_app()
            cache = app.Cache()  # type: ignore[attr-defined]
            segment = cache.segment(segment_id)
            raw = segment.get(cache_key)

            if raw is None:
                logger.debug("Cache MISS: segment=%s key=%s", segment_env, cache_key)
                return None

            logger.debug("Cache HIT: segment=%s key=%s", segment_env, cache_key)
            return json.loads(raw)
        except json.JSONDecodeError:
            # Value was stored as plain string — return as-is
            return raw  # type: ignore[return-value]
        except Exception as exc:
            logger.warning("Cache get failed (segment=%s, key=%s): %s", segment_env, cache_key, exc)
            return None

    def put(
        self,
        segment_env: str,
        cache_key: str,
        value: Any,
        ttl_seconds: int = TTL_DASHBOARD,
    ) -> bool:
        """
        Store a value in the cache.

        Parameters
        ----------
        segment_env:
            Environment variable name holding the segment ID.
        cache_key:
            String key for the cached item.
        value:
            Any JSON-serialisable Python object.
        ttl_seconds:
            Time-to-live in seconds (Catalyst max is typically 7200s).

        Returns
        -------
        bool — True on success.
        """
        if not is_catalyst_available():
            return False

        segment_id = _get_segment_id(segment_env)
        if not segment_id:
            return False

        try:
            app = get_catalyst_app()
            cache = app.Cache()  # type: ignore[attr-defined]
            segment = cache.segment(segment_id)
            serialised = json.dumps(value, default=str)
            segment.put(cache_key, serialised, ttl_seconds)
            logger.debug(
                "Cache PUT: segment=%s key=%s ttl=%ds", segment_env, cache_key, ttl_seconds
            )
            return True
        except Exception as exc:
            logger.warning(
                "Cache put failed (segment=%s, key=%s): %s", segment_env, cache_key, exc
            )
            return False

    def delete(self, segment_env: str, cache_key: str) -> bool:
        """
        Delete a specific key from the cache.

        Returns
        -------
        bool
        """
        if not is_catalyst_available():
            return False

        segment_id = _get_segment_id(segment_env)
        if not segment_id:
            return False

        try:
            app = get_catalyst_app()
            cache = app.Cache()  # type: ignore[attr-defined]
            segment = cache.segment(segment_id)
            segment.delete(cache_key)
            logger.debug("Cache DELETE: segment=%s key=%s", segment_env, cache_key)
            return True
        except Exception as exc:
            logger.warning("Cache delete failed (segment=%s, key=%s): %s", segment_env, cache_key, exc)
            return False

    def flush_segment(self, segment_env: str) -> bool:
        """
        Flush all keys in a cache segment (e.g. during nightly cron cleanup).

        Returns
        -------
        bool
        """
        if not is_catalyst_available():
            return False

        segment_id = _get_segment_id(segment_env)
        if not segment_id:
            return False

        try:
            app = get_catalyst_app()
            cache = app.Cache()  # type: ignore[attr-defined]
            segment = cache.segment(segment_id)
            # Retrieve all keys and delete them one by one
            # (Catalyst SDK does not provide a bulk flush in all versions)
            all_keys = segment.get_all_items()
            deleted = 0
            for item in (all_keys or []):
                key = item.get("cacheKey") or item.get("key", "")
                if key:
                    segment.delete(key)
                    deleted += 1
            logger.info("Cache flush: segment=%s deleted=%d keys", segment_env, deleted)
            return True
        except Exception as exc:
            logger.error("Cache flush failed (segment=%s): %s", segment_env, exc)
            return False

    # ── Typed helpers ──────────────────────────────────────────────────────

    def get_dashboard_stats(self, date_key: str) -> Optional[Dict[str, Any]]:
        """Get cached dashboard statistics for a date key (YYYY-MM-DD)."""
        return self.get(SEGMENT_DASHBOARD, f"dashboard:stats:{date_key}")

    def put_dashboard_stats(self, date_key: str, stats: Dict[str, Any]) -> bool:
        """Cache dashboard statistics."""
        return self.put(SEGMENT_DASHBOARD, f"dashboard:stats:{date_key}", stats, TTL_DASHBOARD)

    def get_officer_profile(self, officer_id: int) -> Optional[Dict[str, Any]]:
        """Get cached officer profile."""
        return self.get(SEGMENT_OFFICER, f"officer:profile:{officer_id}")

    def put_officer_profile(self, officer_id: int, profile: Dict[str, Any]) -> bool:
        """Cache officer profile."""
        return self.put(SEGMENT_OFFICER, f"officer:profile:{officer_id}", profile, TTL_OFFICER)

    def invalidate_officer_profile(self, officer_id: int) -> bool:
        """Invalidate officer profile cache (call after profile update)."""
        return self.delete(SEGMENT_OFFICER, f"officer:profile:{officer_id}")

    def get_analytics(self, district: str, period: str) -> Optional[Dict[str, Any]]:
        """Get cached analytics for a district/period combination."""
        return self.get(SEGMENT_ANALYTICS, f"analytics:{district}:{period}")

    def put_analytics(self, district: str, period: str, data: Dict[str, Any]) -> bool:
        """Cache analytics results."""
        return self.put(
            SEGMENT_ANALYTICS, f"analytics:{district}:{period}", data, TTL_ANALYTICS
        )

    def get_heatmap(self, district: str, crime_type: str) -> Optional[Dict[str, Any]]:
        """Get cached heatmap data."""
        return self.get(SEGMENT_HEATMAP, f"heatmap:{district}:{crime_type}")

    def put_heatmap(self, district: str, crime_type: str, data: Dict[str, Any]) -> bool:
        """Cache heatmap data."""
        return self.put(SEGMENT_HEATMAP, f"heatmap:{district}:{crime_type}", data, TTL_HEATMAP)

    def get_recent_cases(self, officer_id: int) -> Optional[list]:
        """Get cached recent cases list for an officer."""
        return self.get(SEGMENT_CASES, f"cases:recent:{officer_id}")

    def put_recent_cases(self, officer_id: int, cases: list) -> bool:
        """Cache recent cases list."""
        return self.put(SEGMENT_CASES, f"cases:recent:{officer_id}", cases, TTL_CASES)

    # ── Health ─────────────────────────────────────────────────────────────

    def health_check(self) -> Dict[str, Any]:
        """Return wrapper health status with configured segment count."""
        available = is_catalyst_available()
        segments = {
            "dashboard": bool(os.getenv(SEGMENT_DASHBOARD)),
            "officer": bool(os.getenv(SEGMENT_OFFICER)),
            "analytics": bool(os.getenv(SEGMENT_ANALYTICS)),
            "heatmap": bool(os.getenv(SEGMENT_HEATMAP)),
            "ai": bool(os.getenv(SEGMENT_AI)),
            "session": bool(os.getenv(SEGMENT_SESSION)),
            "cases": bool(os.getenv(SEGMENT_CASES)),
        }
        configured_count = sum(1 for v in segments.values() if v)
        return {
            "service": "catalyst_cache",
            "available": available,
            "status": "ok" if available else "unconfigured",
            "configured_segments": configured_count,
            "total_segments": len(segments),
            "segments": segments,
        }

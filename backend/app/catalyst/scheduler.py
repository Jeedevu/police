"""
backend/app/catalyst/scheduler.py
=====================================
KSP Crime Intelligence Platform — Catalyst Cron Wrapper

Wraps the Zoho Catalyst Cron (Job Scheduling) service.

Cron jobs are defined in the Catalyst Console — they are NOT created
programmatically from this code.  This wrapper only provides:
  * A list of all configured jobs (for admin health checks)
  * A method to manually trigger a job (for admin one-off runs)

Jobs defined in Catalyst Console
---------------------------------
  nightly_analytics        — 00:30 IST — aggregate crime analytics
  cache_cleanup            — 01:00 IST — flush expired cache segments
  conversation_archive     — 02:00 IST — archive old NoSQL conversation docs
  audit_log_export         — 03:00 IST — export audit logs to File Store

Each job calls a Catalyst Function (functions/nightly_analytics/handler.py, etc.)

Environment variables
---------------------
  No additional variables needed.  Jobs are identified by name configured
  in the Catalyst Console → Cron.

TODO:CREDENTIALS — create the cron jobs in Catalyst Console → Cron,
                   pointing them to the corresponding Catalyst Functions.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.catalyst.config import get_catalyst_app, is_catalyst_available

logger = logging.getLogger("ksp.catalyst.scheduler")

# ── Known job names (must match names in Catalyst Console) ────────────────────
JOB_NIGHTLY_ANALYTICS = "nightly_analytics"
JOB_CACHE_CLEANUP = "cache_cleanup"
JOB_CONVERSATION_ARCHIVE = "conversation_archive"
JOB_AUDIT_LOG_EXPORT = "audit_log_export"

ALL_KNOWN_JOBS = [
    JOB_NIGHTLY_ANALYTICS,
    JOB_CACHE_CLEANUP,
    JOB_CONVERSATION_ARCHIVE,
    JOB_AUDIT_LOG_EXPORT,
]


class CatalystSchedulerWrapper:
    """
    Read-only wrapper around Catalyst Cron service.

    Jobs are created and managed in the Catalyst Console.
    This wrapper provides visibility (list jobs) and admin operations (trigger).
    """

    def list_jobs(self) -> List[Dict[str, Any]]:
        """
        List all cron jobs configured in this Catalyst project.

        Returns
        -------
        list[dict]
            Each dict contains: ``name``, ``status``, ``cron_expression``,
            ``next_run``, ``last_run``, ``function_name``
        """
        if not is_catalyst_available():
            logger.debug("Catalyst unavailable — returning known job names as stubs")
            return [{"name": job, "status": "unknown"} for job in ALL_KNOWN_JOBS]

        try:
            app = get_catalyst_app()
            cron = app.Cron()  # type: ignore[attr-defined]
            jobs = cron.get_all_jobs()
            logger.debug("Scheduler list_jobs: returned %d jobs", len(jobs))
            return [dict(j) for j in (jobs or [])]
        except Exception as exc:
            logger.error("Scheduler list_jobs failed: %s", exc)
            return []

    def trigger_job(self, job_name: str) -> bool:
        """
        Manually trigger a cron job by name (admin use only).

        Useful for one-off runs (e.g. force a cache flush or analytics run
        without waiting for the schedule).

        Parameters
        ----------
        job_name:
            Job name as configured in Catalyst Console (see ``ALL_KNOWN_JOBS``).

        Returns
        -------
        bool — True if trigger was accepted.
        """
        if not is_catalyst_available():
            logger.warning("Catalyst unavailable — cannot trigger job: %s", job_name)
            return False

        try:
            app = get_catalyst_app()
            cron = app.Cron()  # type: ignore[attr-defined]
            job = cron.get_job(job_name)
            job.trigger()
            logger.info("✓ Cron job manually triggered: %s", job_name)
            return True
        except Exception as exc:
            logger.error("Scheduler trigger_job failed (job=%s): %s", job_name, exc)
            return False

    def get_job_status(self, job_name: str) -> Optional[Dict[str, Any]]:
        """
        Get the status and last run details of a specific cron job.

        Parameters
        ----------
        job_name:
            Job name as configured in Catalyst Console.

        Returns
        -------
        dict or None
        """
        if not is_catalyst_available():
            return None

        try:
            app = get_catalyst_app()
            cron = app.Cron()  # type: ignore[attr-defined]
            job = cron.get_job(job_name)
            details = job.get_details()
            return dict(details) if details else None
        except Exception as exc:
            logger.error("Scheduler get_job_status failed (job=%s): %s", job_name, exc)
            return None

    def health_check(self) -> Dict[str, Any]:
        """Return wrapper health status with known jobs list."""
        available = is_catalyst_available()
        return {
            "service": "catalyst_scheduler",
            "available": available,
            "status": "ok" if available else "unconfigured",
            "known_jobs": ALL_KNOWN_JOBS,
            "note": "Jobs are managed in Catalyst Console → Cron  (TODO:CREDENTIALS)",
        }

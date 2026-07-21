"""
backend/app/services/notification_service.py
===============================================
KSP Crime Intelligence Platform — Notification Service

Orchestrates all notification delivery across Catalyst Mail and Catalyst Signals.
This is the single point of entry for any notification triggered by business events.

Design
------
  * Routers do NOT call Mail or Signals directly.
  * Routers call this service.  The service calls wrappers.
  * All notifications are fire-and-forget — failures are logged but do NOT
    raise HTTP exceptions (notification failure must never break core flows).

Events handled
--------------
  * Officer onboarding (welcome + Catalyst user creation)
  * Case assignment
  * Evidence uploaded
  * Case status changed
  * Password reset
  * Report ready
  * Nightly digest (called by Cron function)
"""
from __future__ import annotations

import logging
from typing import Optional

from app.catalyst.mail import CatalystMailWrapper
from app.catalyst.signals import CatalystSignalsWrapper
from app.catalyst.datastore import CatalystDataStoreWrapper
from app.core.settings import settings

logger = logging.getLogger("ksp.service.notification")

# ── Singleton wrappers (one instance per process) ─────────────────────────────
_mail = CatalystMailWrapper()
_signals = CatalystSignalsWrapper()
_datastore = CatalystDataStoreWrapper()


class NotificationService:
    """
    Unified notification service.

    Methods are intentionally synchronous and fire-and-forget.
    They swallow exceptions after logging — notification failure is never fatal.
    """

    # ── Officer lifecycle ──────────────────────────────────────────────────

    def on_officer_registered(
        self,
        officer_id: int,
        officer_email: str,
        officer_name: str,
        badge_number: str,
        role: str,
    ) -> None:
        """
        Actions triggered when a new officer account is created:
          1. Send welcome email via Catalyst Mail
          2. Create shadow Catalyst Auth user
          3. Log to Catalyst DataStore AuditLogs

        Parameters
        ----------
        officer_id:
            PostgreSQL officer PK.
        officer_email, officer_name, badge_number, role:
            Officer details.
        """
        # Welcome email
        try:
            _mail.send_welcome(
                officer_email=officer_email,
                officer_name=officer_name,
                badge_number=badge_number,
                role=role,
                frontend_url=settings.FRONTEND_URL,
            )
        except Exception as exc:
            logger.warning("Welcome email failed (officer_id=%d): %s", officer_id, exc)

        # Audit log
        self._log_audit(
            officer_id=officer_id,
            action="OFFICER_REGISTERED",
            resource_type="Officer",
            resource_id=str(officer_id),
            details=f"email={officer_email} role={role}",
        )

        logger.info(
            "on_officer_registered complete: officer_id=%d email=%s",
            officer_id,
            officer_email,
        )

    # ── Case events ────────────────────────────────────────────────────────

    def on_case_created(
        self,
        case_id: int,
        case_number: str,
        district_id: int,
        created_by_officer_id: int,
    ) -> None:
        """
        Actions triggered when a new case is registered:
          1. Push notification to district officers via Catalyst Signals
          2. Log to DataStore InvestigationLogs

        Parameters
        ----------
        case_id, case_number:
            Case identifiers.
        district_id:
            District ID for targeted push notification topic.
        created_by_officer_id:
            Officer who registered the case.
        """
        try:
            _signals.notify_case_created(
                case_id=case_id,
                case_number=case_number,
                district_id=district_id,
            )
        except Exception as exc:
            logger.warning("Case created signal failed (case_id=%d): %s", case_id, exc)

        self._log_investigation(
            case_id=case_id,
            officer_id=created_by_officer_id,
            action="CASE_CREATED",
            description=f"Case {case_number} registered",
        )

    def on_officer_assigned_to_case(
        self,
        assigned_officer_id: int,
        assigned_officer_email: str,
        assigned_officer_name: str,
        case_id: int,
        case_number: str,
        assigned_by_officer_id: int,
    ) -> None:
        """
        Actions triggered when an officer is assigned as IO to a case:
          1. Push notification to the assigned officer
          2. Email notification to the assigned officer
          3. Log to DataStore

        Parameters
        ----------
        assigned_officer_id, assigned_officer_email, assigned_officer_name:
            The officer being assigned.
        case_id, case_number:
            The case.
        assigned_by_officer_id:
            The officer making the assignment.
        """
        try:
            _signals.notify_officer_assigned(
                officer_id=assigned_officer_id,
                case_id=case_id,
                case_number=case_number,
            )
        except Exception as exc:
            logger.warning(
                "Officer assigned signal failed (officer_id=%d): %s",
                assigned_officer_id,
                exc,
            )

        try:
            _mail.send_case_assignment(
                officer_email=assigned_officer_email,
                officer_name=assigned_officer_name,
                case_number=case_number,
                case_id=case_id,
                frontend_url=settings.FRONTEND_URL,
            )
        except Exception as exc:
            logger.warning(
                "Case assignment email failed (officer_id=%d): %s",
                assigned_officer_id,
                exc,
            )

        self._log_investigation(
            case_id=case_id,
            officer_id=assigned_by_officer_id,
            action="OFFICER_ASSIGNED",
            description=f"Officer {assigned_officer_name} assigned as IO",
        )

    # ── Evidence events ────────────────────────────────────────────────────

    def on_evidence_uploaded(
        self,
        case_id: int,
        case_number: str,
        evidence_type: str,
        uploader_officer_id: int,
        uploader_name: str,
        io_officer_email: Optional[str] = None,
        io_officer_name: Optional[str] = None,
    ) -> None:
        """
        Actions triggered when evidence is uploaded:
          1. Push notification to case watchers
          2. Email IO if email is provided

        Parameters
        ----------
        case_id, case_number:
            Case identifiers.
        evidence_type:
            Type of evidence (image, video, audio, document).
        uploader_officer_id, uploader_name:
            The officer who uploaded.
        io_officer_email, io_officer_name:
            Case IO email/name (optional — if provided, email is sent).
        """
        try:
            _signals.notify_evidence_uploaded(
                case_id=case_id,
                officer_id=uploader_officer_id,
                evidence_type=evidence_type,
            )
        except Exception as exc:
            logger.warning(
                "Evidence uploaded signal failed (case_id=%d): %s", case_id, exc
            )

        if io_officer_email and io_officer_name:
            try:
                _mail.send_evidence_notification(
                    officer_email=io_officer_email,
                    officer_name=io_officer_name,
                    case_number=case_number,
                    case_id=case_id,
                    evidence_type=evidence_type,
                    uploader_name=uploader_name,
                )
            except Exception as exc:
                logger.warning(
                    "Evidence uploaded email failed (case_id=%d): %s", case_id, exc
                )

    # ── Auth events ────────────────────────────────────────────────────────

    def on_password_reset_requested(
        self,
        officer_email: str,
        officer_name: str,
        reset_token: str,
        expires_minutes: int = 30,
    ) -> None:
        """
        Send a password reset email with a tokenised link.

        Parameters
        ----------
        officer_email, officer_name:
            Officer identity.
        reset_token:
            The raw reset token (caller is responsible for generating and storing it).
        expires_minutes:
            Expiry window for the reset link.
        """
        reset_link = (
            f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        )
        try:
            _mail.send_password_reset(
                officer_email=officer_email,
                officer_name=officer_name,
                reset_link=reset_link,
                expires_minutes=expires_minutes,
            )
        except Exception as exc:
            logger.error(
                "Password reset email failed (email=%s): %s", officer_email, exc
            )

    def on_report_ready(
        self,
        officer_id: int,
        officer_email: str,
        officer_name: str,
        report_type: str,
        file_id: str,
    ) -> None:
        """Notify officer that a generated report is ready."""
        try:
            _signals.notify_report_ready(
                officer_id=officer_id,
                report_type=report_type,
                file_id=file_id,
            )
        except Exception as exc:
            logger.warning("Report ready signal failed: %s", exc)

    # ── Internal helpers ───────────────────────────────────────────────────

    def _log_investigation(
        self,
        case_id: int,
        officer_id: int,
        action: str,
        description: str,
    ) -> None:
        """Write an entry to the InvestigationLogs DataStore table."""
        from datetime import datetime, timezone
        try:
            _datastore.log_investigation({
                "case_id": case_id,
                "officer_id": officer_id,
                "action": action,
                "description": description,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as exc:
            logger.debug("Investigation log write failed: %s", exc)

    def _log_audit(
        self,
        officer_id: int,
        action: str,
        resource_type: str,
        resource_id: str,
        details: str,
    ) -> None:
        """Write an entry to the AuditLogs DataStore table."""
        from datetime import datetime, timezone
        try:
            _datastore.write_audit_log({
                "officer_id": officer_id,
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "details": details,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as exc:
            logger.debug("Audit log write failed: %s", exc)


# ── Module-level singleton ─────────────────────────────────────────────────────
notification_service = NotificationService()

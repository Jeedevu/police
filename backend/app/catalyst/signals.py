"""
backend/app/catalyst/signals.py
==================================
KSP Crime Intelligence Platform — Catalyst Signals Wrapper

Wraps the Zoho Catalyst Signals (Push Notification) service.

Signals are used to send real-time push notifications to the KSP mobile
and web frontend when important events occur:

  Trigger events
  --------------
  * Case Created        → notify assigned inspector
  * Evidence Uploaded   → notify case IO (Investigating Officer)
  * Officer Assigned    → notify the newly assigned officer
  * Case Status Changed → notify complainant officer
  * Urgent Alert        → broadcast to district officers

Topics
------
  Topics are named strings used to broadcast to groups of subscribers.
  Subscribers register their device tokens via the frontend SDK.

  Topic naming convention:
    case:{case_id}                  — all officers watching a specific case
    district:{district_id}          — all officers in a district
    officer:{officer_id}            — direct notification to one officer
    broadcast:all                   — all active officers (emergency alerts only)
    role:{role_name}                — by role (e.g. role:Inspector)

Environment variables
---------------------
  No additional variables needed beyond CATALYST_PROJECT_ID.
  Signals is a project-level service.

TODO:CREDENTIALS — register device tokens in the Catalyst Console → Signals
                   before push notifications can be delivered to mobile devices.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.catalyst.config import CatalystServiceError, get_catalyst_app, is_catalyst_available

logger = logging.getLogger("ksp.catalyst.signals")

# ── Notification type constants ────────────────────────────────────────────────
NOTIF_CASE_CREATED = "CASE_CREATED"
NOTIF_EVIDENCE_UPLOADED = "EVIDENCE_UPLOADED"
NOTIF_OFFICER_ASSIGNED = "OFFICER_ASSIGNED"
NOTIF_CASE_STATUS_CHANGED = "CASE_STATUS_CHANGED"
NOTIF_URGENT_ALERT = "URGENT_ALERT"
NOTIF_REPORT_READY = "REPORT_READY"
NOTIF_OCR_COMPLETE = "OCR_COMPLETE"
NOTIF_TRANSCRIPT_READY = "TRANSCRIPT_READY"


class CatalystSignalsWrapper:
    """
    Thin wrapper around Catalyst Signals push notification service.

    Methods degrade gracefully when Catalyst is not configured — notifications
    are logged but not delivered.
    """

    # ── Core push notification ─────────────────────────────────────────────

    def send_push_notification(
        self,
        topic: str,
        title: str,
        message: str,
        payload: Optional[Dict[str, Any]] = None,
        notification_type: str = "INFO",
    ) -> bool:
        """
        Send a push notification to all subscribers of a topic.

        Parameters
        ----------
        topic:
            Topic string (e.g. ``"case:12345"``, ``"officer:42"``).
        title:
            Notification title (shown in push notification banner).
        message:
            Notification body text.
        payload:
            Additional JSON payload attached to the notification
            (available in the frontend notification handler).
        notification_type:
            One of ``"INFO"``, ``"WARNING"``, ``"URGENT"``.

        Returns
        -------
        bool — True on success.
        """
        if not is_catalyst_available():
            logger.warning(
                "Catalyst Signals unavailable — push notification NOT sent: "
                "topic=%s title=%s",
                topic,
                title,
            )
            return False

        try:
            app = get_catalyst_app()
            signals = app.Pushnotification()  # type: ignore[attr-defined]

            notification = {
                "title": title,
                "content": message,
                "data": {
                    "type": notification_type,
                    "topic": topic,
                    **(payload or {}),
                },
            }

            signals.publish(topic, notification)
            logger.info(
                "✓ Push notification sent: topic=%s type=%s title=%s",
                topic,
                notification_type,
                title,
            )
            return True
        except Exception as exc:
            logger.error(
                "Signals send_push_notification failed (topic=%s): %s", topic, exc
            )
            return False

    # ── Subscription management ────────────────────────────────────────────

    def subscribe(self, device_token: str, topic: str) -> bool:
        """
        Subscribe a device token to a notification topic.

        Called by the React frontend (via API) when an officer logs in or
        when they open a specific case.

        Parameters
        ----------
        device_token:
            FCM / APNS device token provided by the frontend.
        topic:
            Topic to subscribe to.

        Returns
        -------
        bool
        """
        if not is_catalyst_available():
            return False

        try:
            app = get_catalyst_app()
            signals = app.Pushnotification()  # type: ignore[attr-defined]
            signals.subscribe(device_token, topic)
            logger.debug("Signals subscribe: token=***%s topic=%s", device_token[-6:], topic)
            return True
        except Exception as exc:
            logger.error("Signals subscribe failed (topic=%s): %s", topic, exc)
            return False

    def unsubscribe(self, device_token: str, topic: str) -> bool:
        """
        Unsubscribe a device token from a topic.

        Parameters
        ----------
        device_token:
            FCM / APNS device token.
        topic:
            Topic to unsubscribe from.

        Returns
        -------
        bool
        """
        if not is_catalyst_available():
            return False

        try:
            app = get_catalyst_app()
            signals = app.Pushnotification()  # type: ignore[attr-defined]
            signals.unsubscribe(device_token, topic)
            logger.debug("Signals unsubscribe: token=***%s topic=%s", device_token[-6:], topic)
            return True
        except Exception as exc:
            logger.error("Signals unsubscribe failed (topic=%s): %s", topic, exc)
            return False

    # ── Typed notification helpers ─────────────────────────────────────────

    def notify_case_created(
        self, case_id: int, case_number: str, district_id: int
    ) -> bool:
        """Notify district officers that a new case has been registered."""
        return self.send_push_notification(
            topic=f"district:{district_id}",
            title="New Case Registered",
            message=f"Case {case_number} has been created and is pending assignment.",
            payload={"case_id": case_id, "case_number": case_number},
            notification_type=NOTIF_CASE_CREATED,
        )

    def notify_evidence_uploaded(
        self, case_id: int, officer_id: int, evidence_type: str
    ) -> bool:
        """Notify the case IO that new evidence has been uploaded."""
        return self.send_push_notification(
            topic=f"case:{case_id}",
            title="Evidence Uploaded",
            message=f"New {evidence_type} evidence added to Case {case_id}.",
            payload={"case_id": case_id, "evidence_type": evidence_type},
            notification_type=NOTIF_EVIDENCE_UPLOADED,
        )

    def notify_officer_assigned(
        self, officer_id: int, case_id: int, case_number: str
    ) -> bool:
        """Notify an officer they have been assigned to a case."""
        return self.send_push_notification(
            topic=f"officer:{officer_id}",
            title="Case Assigned to You",
            message=f"You have been assigned as IO for Case {case_number}.",
            payload={"case_id": case_id, "case_number": case_number},
            notification_type=NOTIF_OFFICER_ASSIGNED,
        )

    def notify_report_ready(self, officer_id: int, report_type: str, file_id: str) -> bool:
        """Notify an officer that a report PDF is ready for download."""
        return self.send_push_notification(
            topic=f"officer:{officer_id}",
            title="Report Ready",
            message=f"Your {report_type} report is ready for download.",
            payload={"file_id": file_id, "report_type": report_type},
            notification_type=NOTIF_REPORT_READY,
        )

    # ── Health ─────────────────────────────────────────────────────────────

    def health_check(self) -> Dict[str, Any]:
        """Return wrapper health status."""
        available = is_catalyst_available()
        return {
            "service": "catalyst_signals",
            "available": available,
            "status": "ok" if available else "unconfigured",
            "topic_schema": {
                "case": "case:{case_id}",
                "district": "district:{district_id}",
                "officer": "officer:{officer_id}",
                "role": "role:{role_name}",
                "broadcast": "broadcast:all",
            },
        }

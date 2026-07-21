"""
backend/app/api/notifications.py
===================================
KSP Crime Intelligence Platform — Notifications API

Routes for officer notifications — stored in Catalyst DataStore.
Push notification subscription is handled by the Signals wrapper.

Routes
------
  GET    /api/notifications           — List current officer's notifications
  PATCH  /api/notifications/{row_id}/read — Mark notification as read
  DELETE /api/notifications/{row_id}  — Delete a notification
  POST   /api/notifications/subscribe — Register device token for push notifications
  POST   /api/notifications/unsubscribe — Unregister device token
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.auth.dependencies import require_officer
from app.auth.models import Officer
from app.catalyst.datastore import CatalystDataStoreWrapper, TABLE_NOTIFICATIONS
from app.catalyst.signals import CatalystSignalsWrapper

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

_datastore = CatalystDataStoreWrapper()
_signals = CatalystSignalsWrapper()


# ── Schemas ────────────────────────────────────────────────────────────────────

class SubscribeRequest(BaseModel):
    device_token: str
    topics: list[str] = []


class UnsubscribeRequest(BaseModel):
    device_token: str
    topic: str


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("")
def list_notifications(
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    officer: Officer = Depends(require_officer),
):
    """
    Return paginated notifications for the current officer.

    Parameters
    ----------
    limit:
        Maximum number of notifications to return (default 20, max 100).
    unread_only:
        If True, only unread notifications are returned.

    Returns
    -------
    dict with ``count`` and ``notifications`` list.
    """
    notifications = _datastore.get_officer_notifications(
        officer_id=officer.id,
        limit=limit,
        unread_only=unread_only,
    )
    return {
        "officer_id": officer.id,
        "count": len(notifications),
        "unread_only": unread_only,
        "notifications": notifications,
    }


@router.patch("/{row_id}/read")
def mark_as_read(
    row_id: str,
    officer: Officer = Depends(require_officer),
):
    """
    Mark a notification as read.

    Parameters
    ----------
    row_id:
        Catalyst DataStore ROWID of the notification.
    """
    result = _datastore.update_row(
        TABLE_NOTIFICATIONS,
        row_id,
        {"read_status": "true"},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True, "row_id": row_id, "read_status": True}


@router.delete("/{row_id}")
def delete_notification(
    row_id: str,
    officer: Officer = Depends(require_officer),
):
    """
    Delete a notification by ROWID.

    Officers can only delete their own notifications.
    """
    success = _datastore.delete_row(TABLE_NOTIFICATIONS, row_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True, "row_id": row_id}


@router.post("/subscribe")
def subscribe_to_push(
    request: SubscribeRequest,
    officer: Officer = Depends(require_officer),
):
    """
    Register a device token for push notifications.

    Subscribes the device to:
      * The officer's personal topic (``officer:{officer_id}``)
      * The officer's district topic (``district:{district_id}``)
      * Any additional topics specified in the request body

    Parameters
    ----------
    request.device_token:
        FCM or APNS device token provided by the frontend.
    request.topics:
        Additional topics to subscribe to (optional).

    Returns
    -------
    dict confirming subscription status.
    """
    subscribed = []
    failed = []

    # Always subscribe to personal and district topics
    auto_topics = [f"officer:{officer.id}"]
    if officer.district_id:
        auto_topics.append(f"district:{officer.district_id}")

    all_topics = list(set(auto_topics + request.topics))

    for topic in all_topics:
        success = _signals.subscribe(request.device_token, topic)
        if success:
            subscribed.append(topic)
        else:
            failed.append(topic)

    if not subscribed and failed:
        raise HTTPException(
            status_code=503,
            detail="Catalyst Signals is not configured.  Push notifications unavailable.",
        )

    logger.info(
        "Push subscription: officer=%d subscribed=%s",
        officer.id,
        subscribed,
    )

    return {
        "success": len(subscribed) > 0,
        "subscribed_topics": subscribed,
        "failed_topics": failed,
    }


@router.post("/unsubscribe")
def unsubscribe_from_push(
    request: UnsubscribeRequest,
    officer: Officer = Depends(require_officer),
):
    """
    Unsubscribe a device token from a push notification topic.

    Parameters
    ----------
    request.device_token:
        FCM / APNS device token.
    request.topic:
        Topic to unsubscribe from.
    """
    success = _signals.unsubscribe(request.device_token, request.topic)
    return {
        "success": success,
        "device_token": f"***{request.device_token[-6:]}",
        "topic": request.topic,
    }

"""
backend/app/ai/conversation_store.py
=======================================
KSP Crime Intelligence Platform — Persistent Conversation Store

Replaces the original in-memory dict with a **dual-backend** implementation:

  Primary backend:   Catalyst NoSQL (persists across restarts, multi-instance safe)
  Fallback backend:  In-memory dict (used when Catalyst is not configured)

The same public API is preserved exactly — all callers (chat_service.py, ai.py)
continue to work without modification::

    from app.ai.conversation_store import get_history, append_turn, clear_history

Catalyst NoSQL table: ``ConversationHistory``
Document schema::

    {
        "session_key": "officer_42",
        "turns": [
            {"role": "user", "content": "...", "timestamp": "..."},
            {"role": "assistant", "content": "...", "timestamp": "..."}
        ],
        "turn_count": 2
    }

Each session_key maps to exactly ONE NoSQL document (upserted on each turn).
The document is fetched on read and the in-memory cache acts as a write-through
layer to reduce NoSQL API calls during a single conversation.

v3.0 changes
------------
  * Conversation history is now persisted to Catalyst NoSQL.
  * Sessions survive server restarts and load-balancer switching.
  * In-memory dict remains as L1 cache (within the same process lifetime).
  * Fallback: if Catalyst unavailable, in-memory dict is used (v2.0 behaviour).
"""
from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger("ksp.ai.conversation_store")

# ── In-memory L1 cache (write-through, also serves as fallback) ───────────────
_store: dict[str, list[dict]] = defaultdict(list)

# Maximum turns to keep per session in both memory and NoSQL
MAX_HISTORY: int = 50


# ── Catalyst NoSQL wrapper (lazy import to avoid circular deps) ────────────────

def _get_nosql():
    """Return CatalystNoSQLWrapper, or None if Catalyst is not configured."""
    try:
        from app.catalyst.config import is_catalyst_available
        if not is_catalyst_available():
            return None
        from app.catalyst.nosql import CatalystNoSQLWrapper
        return CatalystNoSQLWrapper()
    except Exception as exc:
        logger.debug("NoSQL wrapper unavailable: %s", exc)
        return None


# ── Public API (identical to v2.0 — no caller changes required) ────────────────

def get_history(session_key: str) -> List[Dict[str, Any]]:
    """
    Return conversation history for a session.

    Reads from in-memory cache first.  If the session is not in memory
    (e.g. after a restart), fetches from Catalyst NoSQL.

    Parameters
    ----------
    session_key:
        Unique session identifier, e.g. ``"officer_42"`` or a UUID.

    Returns
    -------
    list[dict]
        List of turn dicts: ``{"role": str, "content": str, "timestamp": str}``
    """
    # L1 cache hit
    if _store[session_key]:
        return _store[session_key].copy()

    # L2: Catalyst NoSQL (if available)
    nosql = _get_nosql()
    if nosql:
        try:
            document = nosql.get_conversation(session_key)
            if document and document.get("turns"):
                turns = document["turns"]
                # Warm the L1 cache
                _store[session_key] = turns[-MAX_HISTORY:]
                logger.debug(
                    "Conversation loaded from NoSQL: session=%s turns=%d",
                    session_key,
                    len(turns),
                )
                return _store[session_key].copy()
        except Exception as exc:
            logger.warning("NoSQL conversation fetch failed: %s", exc)

    return []


def append_turn(
    session_key: str,
    role: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Add a turn to the conversation history and persist to Catalyst NoSQL.

    Parameters
    ----------
    session_key:
        Unique session identifier.
    role:
        ``"user"`` or ``"assistant"``.
    content:
        Turn content (message text or summary).
    metadata:
        Optional extra fields merged into the turn dict
        (e.g. ``{"intent": "sql_query", "rows_returned": 5}``).
    """
    turn: Dict[str, Any] = {
        "role": role,
        "content": content[:2000],  # cap at 2k chars to avoid huge NoSQL docs
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if metadata:
        turn.update(metadata)

    # Write to L1 cache
    _store[session_key].append(turn)

    # Trim L1 to MAX_HISTORY
    if len(_store[session_key]) > MAX_HISTORY:
        _store[session_key] = _store[session_key][-MAX_HISTORY:]

    # Write-through to Catalyst NoSQL (non-blocking best-effort)
    _persist_to_nosql(session_key, _store[session_key])


def clear_history(session_key: str) -> None:
    """
    Clear conversation history for a session (both memory and NoSQL).

    Parameters
    ----------
    session_key:
        Session to clear.
    """
    _store[session_key] = []

    nosql = _get_nosql()
    if nosql:
        try:
            document = nosql.get_conversation(session_key)
            if document and document.get("documentId"):
                nosql.update(
                    nosql.TABLE_CONVERSATION_HISTORY if hasattr(nosql, "TABLE_CONVERSATION_HISTORY")
                    else "ConversationHistory",
                    document["documentId"],
                    {"turns": [], "turn_count": 0},
                )
                logger.info("Conversation history cleared in NoSQL: session=%s", session_key)
        except Exception as exc:
            logger.warning("NoSQL conversation clear failed: %s", exc)


def list_sessions() -> List[str]:
    """
    Return all active session keys (from in-memory cache).

    Note: does not query NoSQL — returns only sessions active in this process.
    """
    return [k for k, v in _store.items() if v]


def get_all_sessions_summary() -> List[Dict[str, Any]]:
    """
    Return summary of all in-memory sessions.

    Returns
    -------
    list[dict]
        Each dict: ``{session_key, turn_count, last_message, last_timestamp}``
    """
    summaries = []
    for key, turns in _store.items():
        if turns:
            summaries.append({
                "session_key": key,
                "turn_count": len(turns),
                "last_message": turns[-1].get("content", "")[:100],
                "last_timestamp": turns[-1].get("timestamp"),
            })
    return summaries


# ── Private helpers ────────────────────────────────────────────────────────────

def _persist_to_nosql(session_key: str, turns: List[Dict[str, Any]]) -> None:
    """
    Write the current turn list to Catalyst NoSQL (upsert).

    Errors are swallowed — a NoSQL write failure must never break the chat
    pipeline.  The in-memory cache remains authoritative for the current session.
    """
    nosql = _get_nosql()
    if not nosql:
        return

    try:
        nosql.upsert_conversation(session_key, turns)
        logger.debug(
            "Conversation persisted to NoSQL: session=%s turns=%d",
            session_key,
            len(turns),
        )
    except Exception as exc:
        logger.warning("NoSQL conversation persist failed (session=%s): %s", session_key, exc)

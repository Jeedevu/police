"""
backend/app/catalyst/nosql.py
===============================
KSP Crime Intelligence Platform — Catalyst NoSQL Wrapper

Wraps the Zoho Catalyst NoSQL (document store) SDK.

Used for
--------
  * Conversation history (AI chat memory, replaces in-memory dict)
  * AI context and evidence references per conversation
  * Evidence file metadata (linked to Catalyst File Store file_id)
  * GPS metadata for evidence
  * OCR output documents (extracted text, confidence, page count)
  * Speech-to-text transcripts
  * Chat sessions
  * Analytics cache blobs
  * Activity timeline events

NoSQL tables (Catalyst Console → NoSQL)
---------------------------------------
  ConversationHistory   — AI chat sessions and turn history
  EvidenceMetadata      — Metadata for evidence files
  OCROutputs            — OCR extracted text results
  SpeechTranscripts     — STT transcripts for audio evidence
  AnalyticsCache        — Cached analytics blobs
  ActivityTimeline      — Officer activity events

TODO:CREDENTIALS — create these tables in Catalyst Console → NoSQL before use.
                   Each table needs a unique table_id; the SDK uses table names
                   configured in the Catalyst Console.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.catalyst.config import CatalystServiceError, get_catalyst_app, is_catalyst_available

logger = logging.getLogger("ksp.catalyst.nosql")

# ── NoSQL table name constants ─────────────────────────────────────────────────
# TODO:CREDENTIALS — verify these table names match what you create in Catalyst Console
TABLE_CONVERSATION_HISTORY = "ConversationHistory"
TABLE_EVIDENCE_METADATA = "EvidenceMetadata"
TABLE_OCR_OUTPUTS = "OCROutputs"
TABLE_SPEECH_TRANSCRIPTS = "SpeechTranscripts"
TABLE_ANALYTICS_CACHE = "AnalyticsCache"
TABLE_ACTIVITY_TIMELINE = "ActivityTimeline"


class CatalystNoSQLWrapper:
    """
    Thin wrapper around Catalyst NoSQL SDK.

    Documents are stored as JSON-like objects.  Each document has a system-
    generated ``documentId`` that is used for retrieval and updates.

    All methods degrade gracefully when Catalyst is not configured.
    """

    # ── Generic CRUD ───────────────────────────────────────────────────────

    def insert(self, table_name: str, document: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Insert a document into a NoSQL table.

        Parameters
        ----------
        table_name:
            Exact NoSQL table name from Catalyst Console.
        document:
            JSON-serialisable dict to store.

        Returns
        -------
        dict or None
            Inserted document with ``documentId`` key, or None on failure.
        """
        if not is_catalyst_available():
            logger.warning("Catalyst unavailable — NoSQL insert skipped (table=%s)", table_name)
            return None

        try:
            app = get_catalyst_app()
            nosql = app.Nosql()  # type: ignore[attr-defined]
            table = nosql.table(table_name)
            result = table.insert_documents([document])
            doc_id = (result[0] if result else {}).get("documentId", "?")
            logger.debug("NoSQL insert: table=%s documentId=%s", table_name, doc_id)
            return result[0] if result else None
        except Exception as exc:
            logger.error("NoSQL insert failed (table=%s): %s", table_name, exc)
            raise CatalystServiceError(f"NoSQL insert failed: {exc}") from exc

    def get(self, table_name: str, document_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch a document by its system documentId.

        Parameters
        ----------
        table_name:
            Exact NoSQL table name.
        document_id:
            System-generated document ID.

        Returns
        -------
        dict or None
        """
        if not is_catalyst_available():
            return None

        try:
            app = get_catalyst_app()
            nosql = app.Nosql()  # type: ignore[attr-defined]
            table = nosql.table(table_name)
            result = table.get_document(document_id)
            logger.debug("NoSQL get: table=%s documentId=%s", table_name, document_id)
            return result
        except Exception as exc:
            logger.error(
                "NoSQL get failed (table=%s, id=%s): %s", table_name, document_id, exc
            )
            return None

    def update(
        self, table_name: str, document_id: str, data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update a document by documentId (partial update — only listed keys change).

        Parameters
        ----------
        table_name:
            Exact NoSQL table name.
        document_id:
            System-generated document ID.
        data:
            Key-value pairs to update in the document.

        Returns
        -------
        dict or None — updated document.
        """
        if not is_catalyst_available():
            return None

        try:
            app = get_catalyst_app()
            nosql = app.Nosql()  # type: ignore[attr-defined]
            table = nosql.table(table_name)
            result = table.update_document({"documentId": document_id, **data})
            logger.debug("NoSQL update: table=%s documentId=%s", table_name, document_id)
            return result
        except Exception as exc:
            logger.error(
                "NoSQL update failed (table=%s, id=%s): %s", table_name, document_id, exc
            )
            raise CatalystServiceError(f"NoSQL update failed: {exc}") from exc

    def delete(self, table_name: str, document_id: str) -> bool:
        """
        Delete a document by documentId.

        Returns
        -------
        bool
        """
        if not is_catalyst_available():
            return False

        try:
            app = get_catalyst_app()
            nosql = app.Nosql()  # type: ignore[attr-defined]
            table = nosql.table(table_name)
            table.delete_document(document_id)
            logger.info("NoSQL delete: table=%s documentId=%s", table_name, document_id)
            return True
        except Exception as exc:
            logger.error(
                "NoSQL delete failed (table=%s, id=%s): %s", table_name, document_id, exc
            )
            return False

    def query(
        self,
        table_name: str,
        filter_expr: Dict[str, Any],
        page_token: Optional[str] = None,
        max_results: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Query a NoSQL table with a filter expression.

        Parameters
        ----------
        table_name:
            Exact NoSQL table name.
        filter_expr:
            Catalyst NoSQL filter dict, e.g.::

                {"session_key": {"value": "officer_42", "operator": "IS"}}

        page_token:
            Pagination token from a previous query response.
        max_results:
            Maximum number of documents to return (default 50).

        Returns
        -------
        list[dict]
        """
        if not is_catalyst_available():
            logger.warning("Catalyst unavailable — NoSQL query skipped (table=%s)", table_name)
            return []

        try:
            app = get_catalyst_app()
            nosql = app.Nosql()  # type: ignore[attr-defined]
            table = nosql.table(table_name)
            query_options: Dict[str, Any] = {
                "filter": filter_expr,
                "maxResults": max_results,
            }
            if page_token:
                query_options["nextPageToken"] = page_token

            result = table.query_documents(query_options)
            docs = result.get("data", []) if isinstance(result, dict) else result or []
            logger.debug(
                "NoSQL query: table=%s filter=%s returned=%d", table_name, filter_expr, len(docs)
            )
            return docs
        except Exception as exc:
            logger.error("NoSQL query failed (table=%s): %s", table_name, exc)
            return []

    # ── Conversation History helpers ───────────────────────────────────────

    def get_conversation(self, session_key: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve the full conversation document for a session key.

        Returns the document (which contains a ``turns`` list) or None.
        """
        results = self.query(
            TABLE_CONVERSATION_HISTORY,
            {"session_key": {"value": session_key, "operator": "IS"}},
            max_results=1,
        )
        return results[0] if results else None

    def upsert_conversation(self, session_key: str, turns: List[Dict[str, Any]]) -> bool:
        """
        Create or update the conversation document for a session key.

        Parameters
        ----------
        session_key:
            Unique key for the conversation (e.g. ``"officer_42"``).
        turns:
            Full list of conversation turns to persist.

        Returns
        -------
        bool — True on success.
        """
        existing = self.get_conversation(session_key)
        payload = {
            "session_key": session_key,
            "turns": turns,
            "turn_count": len(turns),
        }

        if existing and existing.get("documentId"):
            result = self.update(
                TABLE_CONVERSATION_HISTORY, existing["documentId"], payload
            )
        else:
            result = self.insert(TABLE_CONVERSATION_HISTORY, payload)

        return result is not None

    # ── Evidence Metadata helpers ──────────────────────────────────────────

    def save_evidence_metadata(self, metadata: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Store evidence file metadata in NoSQL.

        Expected keys: case_id, officer_id, file_id (Catalyst), file_name,
        file_type, file_hash, upload_time, gps_lat, gps_lon, description,
        evidence_type, status, ocr_triggered, transcript_triggered
        """
        return self.insert(TABLE_EVIDENCE_METADATA, metadata)

    def get_evidence_metadata(self, case_id: int) -> List[Dict[str, Any]]:
        """Retrieve all evidence metadata documents for a case."""
        return self.query(
            TABLE_EVIDENCE_METADATA,
            {"case_id": {"value": str(case_id), "operator": "IS"}},
            max_results=200,
        )

    # ── OCR Output helpers ─────────────────────────────────────────────────

    def save_ocr_output(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Store OCR extraction output.

        Expected keys: file_id, case_id, extracted_text, confidence,
                       page_count, processed_at, evidence_metadata_id
        """
        return self.insert(TABLE_OCR_OUTPUTS, data)

    def get_ocr_output(self, file_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve OCR output for a specific file."""
        results = self.query(
            TABLE_OCR_OUTPUTS,
            {"file_id": {"value": file_id, "operator": "IS"}},
            max_results=1,
        )
        return results[0] if results else None

    # ── Speech Transcript helpers ──────────────────────────────────────────

    def save_transcript(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Store an STT transcript.

        Expected keys: file_id, case_id, transcript_text, confidence,
                       language_code, duration_seconds, processed_at
        """
        return self.insert(TABLE_SPEECH_TRANSCRIPTS, data)

    # ── Activity Timeline helpers ──────────────────────────────────────────

    def log_activity(
        self,
        officer_id: int,
        action: str,
        resource_type: str,
        resource_id: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Log an officer activity event to the timeline."""
        from datetime import datetime, timezone

        payload: Dict[str, Any] = {
            "officer_id": officer_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        return self.insert(TABLE_ACTIVITY_TIMELINE, payload)

    # ── Health ─────────────────────────────────────────────────────────────

    def health_check(self) -> Dict[str, Any]:
        """Return wrapper health status."""
        available = is_catalyst_available()
        return {
            "service": "catalyst_nosql",
            "available": available,
            "status": "ok" if available else "unconfigured",
            "tables": [
                TABLE_CONVERSATION_HISTORY,
                TABLE_EVIDENCE_METADATA,
                TABLE_OCR_OUTPUTS,
                TABLE_SPEECH_TRANSCRIPTS,
                TABLE_ANALYTICS_CACHE,
                TABLE_ACTIVITY_TIMELINE,
            ],
        }

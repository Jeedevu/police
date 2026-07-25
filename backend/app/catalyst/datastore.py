"""
backend/app/catalyst/datastore.py
===================================
KSP Crime Intelligence Platform — Catalyst Data Store Wrapper

Wraps the Zoho Catalyst Data Store (ZCQL-based relational store).

Architecture decision
---------------------
PostgreSQL remains the **primary OLTP store** for all existing 34+ entity
tables (Cases, Officers, Evidence, etc.).  Catalyst Data Store is used
**only for new entities** that have no existing PostgreSQL counterpart:

  * InvestigationLogs
  * Notifications
  * AuditLogs
  * AnalyticsSummaries
  * CrimeHeatmapCache

This wrapper is used exclusively by:
  Repository classes (``app/repositories/``) → never called from routers directly.

ZCQL reference
--------------
Catalyst Data Store uses ZCQL (Zoho Catalyst Query Language), a SQL-like syntax:
  SELECT * FROM InvestigationLogs WHERE case_id = 12345
  INSERT INTO Notifications (officer_id, message, type) VALUES (1, 'Case assigned', 'INFO')

Environment variables
---------------------
  CATALYST_PROJECT_ID   — read by zcatalyst_sdk (set in config.py)
  CATALYST_DATASTORE_*  — no extra vars needed; tables are identified by name

TODO:CREDENTIALS — create the Catalyst DataStore tables in the Catalyst Console
                   before running table-specific repository operations.
                   Table names must match exactly what is used here.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.catalyst.config import CatalystServiceError, get_catalyst_app, is_catalyst_available

logger = logging.getLogger("ksp.catalyst.datastore")

# ── Catalyst DataStore table names (new entities only) ────────────────────────
# These must match the table names created in the Catalyst Console exactly.
# TODO:CREDENTIALS — verify / create these tables in Catalyst Console → DataStore
TABLE_INVESTIGATION_LOGS = "InvestigationLogs"
TABLE_NOTIFICATIONS = "Notifications"
TABLE_AUDIT_LOGS = "AuditLogs"
TABLE_ANALYTICS_SUMMARIES = "AnalyticsSummaries"
TABLE_CRIME_HEATMAP_CACHE = "CrimeHeatmapCache"


class CatalystDataStoreWrapper:
    """
    Thin wrapper around Catalyst Data Store SDK.

    All methods degrade gracefully when Catalyst is not configured — they log
    a warning and return an empty result rather than raising exceptions.
    """

    # ── Generic CRUD ───────────────────────────────────────────────────────

    def insert_row(self, table_name: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Insert a single row into a Catalyst DataStore table.

        Parameters
        ----------
        table_name:
            Exact table name as defined in Catalyst Console.
        data:
            Column-value pairs to insert.

        Returns
        -------
        dict or None
            The inserted row (with system-generated ROWID) or None on failure.
        """
        if not is_catalyst_available():
            logger.warning("Catalyst unavailable — insert_row skipped for table=%s", table_name)
            return None

        try:
            app = get_catalyst_app()
            table = app.Datastore().Table(table_name)  # type: ignore[attr-defined]
            result = table.insert_row(data)
            row_id = result.get("ROWID") or result.get("rowId", "?")
            logger.debug("DataStore insert: table=%s ROWID=%s", table_name, row_id)
            return result
        except Exception as exc:
            logger.error("DataStore insert_row failed (table=%s): %s", table_name, exc)
            raise CatalystServiceError(f"DataStore insert failed: {exc}") from exc

    def get_row(self, table_name: str, row_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch a single row by its system ROWID.

        Parameters
        ----------
        table_name:
            Exact table name.
        row_id:
            Catalyst system ROWID (string).

        Returns
        -------
        dict or None
        """
        if not is_catalyst_available():
            return None

        try:
            app = get_catalyst_app()
            table = app.Datastore().Table(table_name)  # type: ignore[attr-defined]
            result = table.get_row(row_id)
            logger.debug("DataStore get_row: table=%s ROWID=%s", table_name, row_id)
            return result
        except Exception as exc:
            logger.error("DataStore get_row failed (table=%s, id=%s): %s", table_name, row_id, exc)
            return None

    def update_row(
        self, table_name: str, row_id: str, data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update a row by ROWID.

        Parameters
        ----------
        table_name:
            Exact table name.
        row_id:
            Catalyst system ROWID.
        data:
            Column-value pairs to update.

        Returns
        -------
        dict or None — updated row.
        """
        if not is_catalyst_available():
            return None

        try:
            app = get_catalyst_app()
            table = app.Datastore().Table(table_name)  # type: ignore[attr-defined]
            data_with_id = {"ROWID": row_id, **data}
            result = table.update_row(data_with_id)
            logger.debug("DataStore update_row: table=%s ROWID=%s", table_name, row_id)
            return result
        except Exception as exc:
            logger.error(
                "DataStore update_row failed (table=%s, id=%s): %s", table_name, row_id, exc
            )
            raise CatalystServiceError(f"DataStore update failed: {exc}") from exc

    def delete_row(self, table_name: str, row_id: str) -> bool:
        """
        Delete a row by ROWID.

        Returns
        -------
        bool
            True on success, False if Catalyst is unavailable or the operation fails.
        """
        if not is_catalyst_available():
            return False

        try:
            app = get_catalyst_app()
            table = app.Datastore().Table(table_name)  # type: ignore[attr-defined]
            table.delete_row(row_id)
            logger.info("DataStore delete_row: table=%s ROWID=%s", table_name, row_id)
            return True
        except Exception as exc:
            logger.error(
                "DataStore delete_row failed (table=%s, id=%s): %s", table_name, row_id, exc
            )
            return False

    def query(self, zcql_string: str) -> List[Dict[str, Any]]:
        """
        Execute a ZCQL SELECT query and return matching rows.

        Parameters
        ----------
        zcql_string:
            Valid ZCQL query string, e.g.::

                "SELECT * FROM Notifications WHERE officer_id = 42 ORDER BY CREATEDTIME DESC LIMIT 20"

        Returns
        -------
        list[dict]
            Matching rows, or empty list on failure.

        Raises
        ------
        CatalystServiceError
            On query execution failure (not on Catalyst-unavailable).
        """
        if not is_catalyst_available():
            logger.warning("Catalyst unavailable — query skipped: %s", zcql_string[:80])
            return []

        try:
            app = get_catalyst_app()
            zcql = app.ZCQL()  # type: ignore[attr-defined]
            rows = zcql.execute_query(zcql_string)
            logger.debug("DataStore query: returned %d rows | ZCQL: %s", len(rows), zcql_string[:80])
            return rows if rows else []
        except Exception as exc:
            logger.error("DataStore query failed: %s | ZCQL: %s", exc, zcql_string[:80])
            raise CatalystServiceError(f"DataStore query failed: {exc}") from exc

    def bulk_insert(self, table_name: str, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Insert multiple rows in a single API call.

        Parameters
        ----------
        table_name:
            Exact table name.
        rows:
            List of column-value dicts to insert.

        Returns
        -------
        list[dict]
            Inserted rows with system-generated ROWIDs.
        """
        if not is_catalyst_available():
            logger.warning(
                "Catalyst unavailable — bulk_insert skipped (%d rows) for table=%s",
                len(rows),
                table_name,
            )
            return []

        try:
            app = get_catalyst_app()
            table = app.Datastore().Table(table_name)  # type: ignore[attr-defined]
            result = table.insert_rows(rows)
            logger.info(
                "DataStore bulk_insert: table=%s inserted=%d", table_name, len(result)
            )
            return result if result else []
        except Exception as exc:
            logger.error("DataStore bulk_insert failed (table=%s): %s", table_name, exc)
            raise CatalystServiceError(f"DataStore bulk insert failed: {exc}") from exc

    # ── Convenience methods for known tables ──────────────────────────────

    def log_investigation(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Insert a row into InvestigationLogs.

        Expected fields: case_id, officer_id, action, description, timestamp
        """
        return self.insert_row(TABLE_INVESTIGATION_LOGS, data)

    def create_notification(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Insert a row into Notifications.

        Expected fields: officer_id, message, notification_type, read_status, case_id
        """
        return self.insert_row(TABLE_NOTIFICATIONS, data)

    def write_audit_log(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Insert a row into AuditLogs.

        Expected fields: officer_id, action, resource_type, resource_id,
                         ip_address, details, timestamp
        """
        return self.insert_row(TABLE_AUDIT_LOGS, data)

    def get_officer_notifications(
        self, officer_id: int, limit: int = 20, unread_only: bool = False
    ) -> List[Dict[str, Any]]:
        """Return notifications for a specific officer."""
        read_filter = " AND read_status = 'false'" if unread_only else ""
        zcql = (
            f"SELECT * FROM {TABLE_NOTIFICATIONS} "
            f"WHERE officer_id = {officer_id}{read_filter} "
            f"ORDER BY CREATEDTIME DESC LIMIT {limit}"
        )
        return self.query(zcql)

    # ── Health ─────────────────────────────────────────────────────────────

    def health_check(self) -> Dict[str, Any]:
        """Return wrapper health status."""
        available = is_catalyst_available()
        return {
            "service": "catalyst_datastore",
            "available": available,
            "status": "ok" if available else "unconfigured",
            "note": "PostgreSQL is primary OLTP; DataStore used for new entities only",
        }

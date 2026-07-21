"""
backend/app/catalyst/connections.py
======================================
KSP Crime Intelligence Platform — Catalyst Connections Wrapper

Wraps the Zoho Catalyst Connections service.

Catalyst Connections is an API integration manager that securely stores
authentication credentials for third-party services and proxies API calls
through Catalyst's network — credentials never leave Zoho servers.

Planned integrations
--------------------
  * External crime database APIs (NCRB, CID)
  * Payment gateway (for court fine lookups)
  * External identity verification services
  * Interpol API (future)
  * State government data portals

Connection names are defined in Catalyst Console → Connections.
This wrapper invokes those pre-configured connections.

Environment variables
---------------------
  No additional env vars needed — connection names and credentials are
  managed entirely within the Catalyst Console → Connections.

TODO:CREDENTIALS — create connections in Catalyst Console → Connections.
                   Each connection has a unique name and pre-configured auth.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from app.catalyst.config import CatalystServiceError, get_catalyst_app, is_catalyst_available

logger = logging.getLogger("ksp.catalyst.connections")

# ── Connection names (must match Catalyst Console → Connections) ──────────────
# TODO:CREDENTIALS — create these connections in Catalyst Console
CONN_NCRB = "ncrb_crime_database"        # National Crime Records Bureau API
CONN_CID = "cid_state_portal"            # Criminal Investigation Department portal
CONN_GOVT_ID = "govt_identity_verify"    # Government ID verification


class CatalystConnectionsWrapper:
    """
    Thin wrapper around Catalyst Connections proxied API calls.

    Catalyst Connections securely holds third-party API credentials and
    proxies all outbound calls through Zoho's infrastructure.  This means
    API keys for external services never need to be stored in our .env file.
    """

    def invoke(
        self,
        connection_name: str,
        method: str,
        path: str,
        body: Optional[Dict[str, Any]] = None,
        query_params: Optional[Dict[str, str]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Invoke a pre-configured Catalyst Connection.

        Parameters
        ----------
        connection_name:
            Name of the connection as defined in Catalyst Console.
        method:
            HTTP method: "GET", "POST", "PUT", "DELETE".
        path:
            API path appended to the connection's base URL.
            e.g. ``"/api/v1/records?id=12345"``
        body:
            Request body (for POST / PUT).
        query_params:
            Query string parameters to append to the URL.
        headers:
            Additional request headers (merged with connection-level headers).

        Returns
        -------
        dict
            Parsed JSON response from the external API.

        Raises
        ------
        CatalystServiceError
            If the connection invocation fails.
        RuntimeError
            If Catalyst is not configured.
        """
        if not is_catalyst_available():
            raise RuntimeError(
                f"Catalyst unavailable — cannot invoke connection '{connection_name}'.  "
                "Ensure CATALYST_* env vars are set."
            )

        try:
            app = get_catalyst_app()
            connections = app.Connection()  # type: ignore[attr-defined]
            connection = connections.connection(connection_name)

            request_options: Dict[str, Any] = {
                "method": method.upper(),
                "path": path,
            }
            if body:
                request_options["body"] = body
            if query_params:
                request_options["query_params"] = query_params
            if headers:
                request_options["headers"] = headers

            response = connection.invoke(request_options)
            logger.info(
                "Connections invoke: conn=%s method=%s path=%s status=%s",
                connection_name,
                method,
                path,
                response.get("status_code", "?"),
            )
            return dict(response) if response else {}
        except Exception as exc:
            logger.error(
                "Connections invoke failed (conn=%s, method=%s, path=%s): %s",
                connection_name,
                method,
                path,
                exc,
            )
            raise CatalystServiceError(
                f"Connection '{connection_name}' invocation failed: {exc}"
            ) from exc

    # ── Typed connection helpers ───────────────────────────────────────────

    def query_ncrb(self, endpoint: str, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Query the NCRB (National Crime Records Bureau) API via Catalyst Connection.

        TODO:CREDENTIALS — create connection 'ncrb_crime_database' in Catalyst Console.

        Parameters
        ----------
        endpoint:
            NCRB API endpoint path (e.g. ``"/records/search"``).
        params:
            Query parameters.

        Returns
        -------
        dict
        """
        return self.invoke(
            connection_name=CONN_NCRB,
            method="GET",
            path=endpoint,
            query_params=params,
        )

    def verify_government_id(self, id_type: str, id_number: str) -> Dict[str, Any]:
        """
        Verify a government-issued ID via the configured identity verification connection.

        TODO:CREDENTIALS — create connection 'govt_identity_verify' in Catalyst Console.

        Parameters
        ----------
        id_type:
            Type of ID: "aadhaar", "pan", "passport", "voter_id".
        id_number:
            The ID number to verify.

        Returns
        -------
        dict — verification result.
        """
        return self.invoke(
            connection_name=CONN_GOVT_ID,
            method="POST",
            path="/verify",
            body={"id_type": id_type, "id_number": id_number},
        )

    # ── Health ─────────────────────────────────────────────────────────────

    def health_check(self) -> Dict[str, Any]:
        """Return wrapper health status."""
        available = is_catalyst_available()
        return {
            "service": "catalyst_connections",
            "available": available,
            "status": "ok" if available else "unconfigured",
            "defined_connections": [CONN_NCRB, CONN_CID, CONN_GOVT_ID],
            "note": "Create connections in Catalyst Console → Connections  (TODO:CREDENTIALS)",
        }

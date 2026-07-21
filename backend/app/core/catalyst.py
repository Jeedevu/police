"""
Zoho Catalyst SDK Connection & Client Module.
Initializes Catalyst client and provides health verification helper.
"""
import logging
import httpx
from app.core.settings import settings

logger = logging.getLogger("ksp.catalyst")


class CatalystClient:
    """
    Client wrapper for Zoho Catalyst integration services.
    Supports REST API connection and SDK initialisation.
    """

    def __init__(self):
        self.url = settings.CATALYST_URL
        self.token = settings.CATALYST_TOKEN
        self.org_id = settings.CATALYST_ORG

    def is_configured(self) -> bool:
        return bool(self.url and self.token)

    def health_check(self) -> dict:
        if not self.is_configured():
            return {
                "status": "unconfigured",
                "message": "Catalyst credentials not present in environment",
                "configured": False
            }
        
        try:
            headers = {
                "Authorization": f"Zoho-oauthtoken {self.token}",
                "catalyst-org-id": self.org_id
            }
            # Verify endpoint reachability
            with httpx.Client(timeout=5.0) as client:
                res = client.get(self.url, headers=headers)
                return {
                    "status": "connected" if res.status_code < 500 else "error",
                    "status_code": res.status_code,
                    "configured": True
                }
        except Exception as exc:
            logger.warning(f"Catalyst health check error: {exc}")
            return {
                "status": "offline",
                "error": str(exc),
                "configured": True
            }


catalyst_client = CatalystClient()

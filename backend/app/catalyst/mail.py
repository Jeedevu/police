"""
backend/app/catalyst/mail.py
================================
KSP Crime Intelligence Platform — Catalyst Mail Wrapper

Wraps the Zoho Catalyst Mail service for transactional emails.

Emails sent automatically
--------------------------
  * Case update notifications (assignment, status change)
  * Evidence added alerts (to case IO)
  * Password reset links
  * Officer onboarding / welcome
  * Nightly report digest (scheduled via Cron)

Environment variables
---------------------
  CATALYST_MAIL_FROM_ADDRESS   — sender email address (must be verified in Catalyst)
  CATALYST_MAIL_FROM_NAME      — display name (default: "KSP Crime Intelligence")

TODO:CREDENTIALS — verify the from_address in Catalyst Console → Mail → Sender Addresses.
                   Without a verified sender, all sends will fail.

HTML email templates are embedded directly as f-strings in this module.
For production, move templates to a /templates/ directory using Jinja2.
"""
from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

from app.catalyst.config import CatalystServiceError, get_catalyst_app, is_catalyst_available

logger = logging.getLogger("ksp.catalyst.mail")

# ── Sender identity ────────────────────────────────────────────────────────────
# TODO:CREDENTIALS — set these in .env
_FROM_ADDRESS = os.getenv("CATALYST_MAIL_FROM_ADDRESS", "")
_FROM_NAME = os.getenv("CATALYST_MAIL_FROM_NAME", "KSP Crime Intelligence Platform")

# ── KSP Email base styles ──────────────────────────────────────────────────────
_EMAIL_BASE_CSS = """
  body { font-family: Arial, Helvetica, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 30px auto; background: #ffffff;
               border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
  .header { background: #1a237e; color: #fff; padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 20px; }
  .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.8; }
  .body { padding: 32px; color: #333; line-height: 1.6; }
  .footer { background: #f4f6f9; padding: 16px 32px; font-size: 11px; color: #888;
            text-align: center; border-top: 1px solid #e0e0e0; }
  .btn { display: inline-block; padding: 12px 24px; background: #1a237e; color: #fff;
         text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 16px; }
  .alert { background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;
           padding: 12px 16px; margin-top: 16px; color: #856404; }
"""


def _build_email_html(subject: str, body_html: str) -> str:
    """Wrap body HTML in the KSP email shell template."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>{_EMAIL_BASE_CSS}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚔 Karnataka State Police</h1>
      <p>Crime Intelligence Platform — Official Communication</p>
    </div>
    <div class="body">
      {body_html}
    </div>
    <div class="footer">
      This is an automated message from KSP Crime Intelligence Platform.<br>
      Do not reply to this email. For support, contact your system administrator.<br>
      <strong>CONFIDENTIAL — FOR OFFICIAL USE ONLY</strong>
    </div>
  </div>
</body>
</html>"""


class CatalystMailWrapper:
    """
    Thin wrapper around Catalyst Mail transactional email service.

    All methods fall back to a warning log when Catalyst is not configured,
    rather than raising exceptions.
    """

    # ── Core send ──────────────────────────────────────────────────────────

    def send(
        self,
        to: str,
        subject: str,
        html_body: str,
        cc: Optional[List[str]] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
    ) -> bool:
        """
        Send a transactional email.

        Parameters
        ----------
        to:
            Recipient email address.
        subject:
            Email subject line.
        html_body:
            Full HTML email body (will be wrapped in KSP template).
        cc:
            Optional list of CC email addresses.
        attachments:
            Optional list of ``{"filename": str, "content": bytes}`` dicts.

        Returns
        -------
        bool — True on success.
        """
        if not is_catalyst_available():
            logger.warning(
                "Catalyst Mail unavailable — email NOT sent to %s | subject: %s",
                to,
                subject,
            )
            return False

        from_address = os.getenv("CATALYST_MAIL_FROM_ADDRESS", "")
        if not from_address:
            logger.error(
                "CATALYST_MAIL_FROM_ADDRESS not set — email NOT sent.  (TODO:CREDENTIALS)"
            )
            return False

        full_html = _build_email_html(subject, html_body)

        try:
            app = get_catalyst_app()
            mail = app.Mail()  # type: ignore[attr-defined]

            mail_options: Dict[str, Any] = {
                "from": {"address": from_address, "name": _FROM_NAME},
                "to": [{"address": to}],
                "subject": subject,
                "html_body": full_html,
            }

            if cc:
                mail_options["cc"] = [{"address": addr} for addr in cc]

            if attachments:
                mail_options["attachments"] = attachments

            mail.send_mail(mail_options)
            logger.info("✓ Email sent: to=%s subject=%s", to, subject)
            return True
        except Exception as exc:
            logger.error("Catalyst Mail send failed (to=%s): %s", to, exc)
            return False

    # ── Typed email helpers ────────────────────────────────────────────────

    def send_case_assignment(
        self,
        officer_email: str,
        officer_name: str,
        case_number: str,
        case_id: int,
        frontend_url: str = "",
    ) -> bool:
        """Send case assignment notification email to an officer."""
        case_url = f"{frontend_url}/cases/{case_id}" if frontend_url else "#"
        body = f"""
        <p>Dear <strong>{officer_name}</strong>,</p>
        <p>You have been assigned as the Investigating Officer for the following case:</p>
        <table style="width:100%; border-collapse: collapse; margin-top: 12px;">
          <tr><td style="padding: 8px; font-weight:bold; background:#f4f6f9;">Case Number</td>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">{case_number}</td></tr>
          <tr><td style="padding: 8px; font-weight:bold; background:#f4f6f9;">Case ID</td>
              <td style="padding: 8px;">{case_id}</td></tr>
        </table>
        <p>Please log in to the KSP Crime Intelligence Platform to review the case details
           and begin your investigation.</p>
        <a href="{case_url}" class="btn">View Case</a>
        <div class="alert">
          ⚠️ This case assignment is effective immediately.
             Please acknowledge receipt within 24 hours.
        </div>
        """
        return self.send(
            to=officer_email,
            subject=f"[KSP] Case Assignment — {case_number}",
            html_body=body,
        )

    def send_evidence_notification(
        self,
        officer_email: str,
        officer_name: str,
        case_number: str,
        case_id: int,
        evidence_type: str,
        uploader_name: str,
    ) -> bool:
        """Notify case IO that new evidence has been added."""
        body = f"""
        <p>Dear <strong>{officer_name}</strong>,</p>
        <p>New evidence has been added to a case under your investigation:</p>
        <table style="width:100%; border-collapse: collapse; margin-top: 12px;">
          <tr><td style="padding: 8px; font-weight:bold; background:#f4f6f9;">Case Number</td>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">{case_number}</td></tr>
          <tr><td style="padding: 8px; font-weight:bold; background:#f4f6f9;">Evidence Type</td>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">{evidence_type}</td></tr>
          <tr><td style="padding: 8px; font-weight:bold; background:#f4f6f9;">Uploaded By</td>
              <td style="padding: 8px;">{uploader_name}</td></tr>
        </table>
        <p>Log in to the platform to review the new evidence.</p>
        """
        return self.send(
            to=officer_email,
            subject=f"[KSP] New Evidence Added — Case {case_number}",
            html_body=body,
        )

    def send_password_reset(
        self,
        officer_email: str,
        officer_name: str,
        reset_link: str,
        expires_minutes: int = 30,
    ) -> bool:
        """Send a password reset link email."""
        body = f"""
        <p>Dear <strong>{officer_name}</strong>,</p>
        <p>A password reset has been requested for your KSP Crime Intelligence Platform account.</p>
        <p>Click the button below to reset your password.
           This link expires in <strong>{expires_minutes} minutes</strong>.</p>
        <a href="{reset_link}" class="btn">Reset Password</a>
        <div class="alert">
          ⚠️ If you did not request this reset, please ignore this email and contact
          your system administrator immediately.
        </div>
        """
        return self.send(
            to=officer_email,
            subject="[KSP] Password Reset Request",
            html_body=body,
        )

    def send_welcome(
        self,
        officer_email: str,
        officer_name: str,
        badge_number: str,
        role: str,
        frontend_url: str = "",
    ) -> bool:
        """Send welcome / onboarding email to a newly registered officer."""
        body = f"""
        <p>Dear <strong>{officer_name}</strong>,</p>
        <p>Welcome to the <strong>KSP Crime Intelligence Platform</strong>.</p>
        <p>Your account has been created with the following details:</p>
        <table style="width:100%; border-collapse: collapse; margin-top: 12px;">
          <tr><td style="padding: 8px; font-weight:bold; background:#f4f6f9;">Email</td>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">{officer_email}</td></tr>
          <tr><td style="padding: 8px; font-weight:bold; background:#f4f6f9;">Badge Number</td>
              <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">{badge_number}</td></tr>
          <tr><td style="padding: 8px; font-weight:bold; background:#f4f6f9;">Role</td>
              <td style="padding: 8px;">{role}</td></tr>
        </table>
        <p>Please log in and change your default password immediately.</p>
        <a href="{frontend_url or '#'}" class="btn">Log In to Platform</a>
        """
        return self.send(
            to=officer_email,
            subject="[KSP] Welcome to Crime Intelligence Platform",
            html_body=body,
        )

    # ── Health ─────────────────────────────────────────────────────────────

    def health_check(self) -> Dict[str, Any]:
        """Return wrapper health status."""
        available = is_catalyst_available()
        from_configured = bool(os.getenv("CATALYST_MAIL_FROM_ADDRESS"))
        return {
            "service": "catalyst_mail",
            "available": available,
            "from_address_configured": from_configured,
            "status": "ok" if (available and from_configured) else "unconfigured",
            "note": (
                "Set CATALYST_MAIL_FROM_ADDRESS and verify it in Catalyst Console  "
                "(TODO:CREDENTIALS)"
                if not from_configured
                else None
            ),
        }

"""
backend/app/repositories/evidence_repository.py
==================================================
KSP Crime Intelligence Platform — Catalyst-Native Evidence Repository

This repository implements the full Catalyst-first evidence upload pipeline:

  Upload flow
  -----------
  FastAPI Route → EvidenceRepository.upload()
      ↓
  1. Upload file bytes → Catalyst File Store → get file_id
  ↓
  2. Create evidence record → PostgreSQL (existing Evidence table)
  ↓
  3. Save rich metadata → Catalyst NoSQL (EvidenceMetadata table)
  ↓
  4. Trigger OCR         → Catalyst Zia (images + PDFs)
  ↓
  5. Trigger STT         → Catalyst Zia (audio files)
  ↓
  6. Emit Signals        → Notify case IO via push notification
  ↓
  7. Log audit           → Catalyst DataStore (AuditLogs)
  ↓
  8. Return result dict  → Router sends response to client

The PostgreSQL Evidence record is still created for backward compatibility
with the existing API surface.  The Catalyst services add richness on top.

If Catalyst File Store is NOT configured (no env vars), the upload falls
back to the legacy local disk storage so existing functionality is preserved.
"""
from __future__ import annotations

import hashlib
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.models.evidence import Evidence

logger = logging.getLogger("ksp.repository.evidence")

# ── Evidence type detection ────────────────────────────────────────────────────

_EXTENSION_TYPE: Dict[str, str] = {
    ".jpg": "image", ".jpeg": "image", ".png": "image",
    ".webp": "image", ".bmp": "image", ".gif": "image",
    ".mp4": "video", ".avi": "video", ".mov": "video", ".mkv": "video",
    ".mp3": "audio", ".wav": "audio", ".aac": "audio", ".ogg": "audio",
    ".pdf": "document", ".doc": "document", ".docx": "document", ".txt": "document",
}

# ── Legacy local upload directory (fallback when Catalyst not configured) ──────
_LEGACY_UPLOAD_DIR = (
    Path(__file__).resolve().parent.parent.parent / "uploads" / "evidence"
)


def _detect_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    return _EXTENSION_TYPE.get(ext, "unknown")


def _compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class EvidenceRepository:
    """
    Catalyst-native evidence repository.

    Dependencies are injected via ``__init__`` to make this class testable
    without a live Catalyst connection.

    Parameters
    ----------
    db:
        SQLAlchemy Session — used to write the PostgreSQL Evidence record.
    """

    def __init__(self, db: Session) -> None:
        self.db = db
        self._filestore = None
        self._nosql = None
        self._zia = None
        self._signals = None
        self._datastore = None

    # ── Lazy-loaded Catalyst wrappers (avoid import at module load time) ───────

    @property
    def filestore(self):
        if self._filestore is None:
            from app.catalyst.filestore import CatalystFileStoreWrapper
            self._filestore = CatalystFileStoreWrapper()
        return self._filestore

    @property
    def nosql(self):
        if self._nosql is None:
            from app.catalyst.nosql import CatalystNoSQLWrapper
            self._nosql = CatalystNoSQLWrapper()
        return self._nosql

    @property
    def zia(self):
        if self._zia is None:
            from app.catalyst.zia import CatalystZiaWrapper
            self._zia = CatalystZiaWrapper()
        return self._zia

    @property
    def signals(self):
        if self._signals is None:
            from app.catalyst.signals import CatalystSignalsWrapper
            self._signals = CatalystSignalsWrapper()
        return self._signals

    @property
    def datastore(self):
        if self._datastore is None:
            from app.catalyst.datastore import CatalystDataStoreWrapper
            self._datastore = CatalystDataStoreWrapper()
        return self._datastore

    # ── Primary upload method ──────────────────────────────────────────────

    def upload(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: str,
        case_id: int,
        officer_id: int,
        officer_name: str,
        description: Optional[str] = None,
        gps_lat: Optional[float] = None,
        gps_lon: Optional[float] = None,
        evidence_type_override: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Full Catalyst-native evidence upload pipeline.

        Parameters
        ----------
        file_bytes:
            Raw file content.
        filename:
            Original filename from the client upload.
        content_type:
            MIME type.
        case_id:
            PostgreSQL case ID this evidence belongs to.
        officer_id:
            PostgreSQL officer ID of the uploader.
        officer_name:
            Human-readable officer name (for PostgreSQL record).
        description:
            Optional text description of the evidence.
        gps_lat, gps_lon:
            Optional GPS coordinates where evidence was collected.
        evidence_type_override:
            Override detected evidence type (image/video/audio/document).

        Returns
        -------
        dict with keys:
            success, evidence_id, file_id (Catalyst), file_name,
            file_type, case_id, ocr_triggered, transcript_triggered,
            storage_backend ("catalyst" | "local")
        """
        evidence_type = evidence_type_override or _detect_type(filename)
        file_hash = _compute_sha256(file_bytes)
        uploaded_at = datetime.now(timezone.utc).isoformat()

        # ── Step 1: Upload to Catalyst File Store (or fall back to disk) ──────
        storage_backend = "local"
        file_id: str = ""
        file_url: str = ""

        try:
            from app.catalyst.config import is_catalyst_available
            if is_catalyst_available():
                upload_result = self.filestore.upload(
                    file_bytes=file_bytes,
                    filename=filename,
                    content_type=content_type,
                )
                file_id = upload_result.get("file_id", "")
                file_url = upload_result.get("file_url", "")
                storage_backend = "catalyst"
                logger.info(
                    "Evidence uploaded to Catalyst File Store: file_id=%s case_id=%d",
                    file_id,
                    case_id,
                )
            else:
                # Fallback: local disk (legacy behaviour preserved)
                file_id = self._save_to_local_disk(file_bytes, filename, case_id)
                storage_backend = "local"
                logger.warning(
                    "Catalyst not configured — evidence saved locally: %s", file_id
                )
        except Exception as exc:
            logger.error("Evidence upload failed (file=%s): %s", filename, exc)
            # Final fallback — try local disk
            try:
                file_id = self._save_to_local_disk(file_bytes, filename, case_id)
                storage_backend = "local_fallback"
            except Exception as disk_exc:
                raise RuntimeError(
                    f"Evidence upload failed on both Catalyst and local disk: {disk_exc}"
                ) from exc

        # ── Step 2: Create PostgreSQL Evidence record (backward compat) ────────
        db_evidence = self._create_postgres_record(
            case_id=case_id,
            evidence_type=evidence_type,
            description=description or filename,
            officer_name=officer_name,
            file_id=file_id,
            file_hash=file_hash,
            storage_backend=storage_backend,
        )

        # ── Step 3: Save metadata to Catalyst NoSQL ───────────────────────────
        self._save_nosql_metadata(
            evidence_id=db_evidence.evidence_id,
            case_id=case_id,
            officer_id=officer_id,
            officer_name=officer_name,
            filename=filename,
            content_type=content_type,
            evidence_type=evidence_type,
            file_id=file_id,
            file_url=file_url,
            file_hash=file_hash,
            uploaded_at=uploaded_at,
            gps_lat=gps_lat,
            gps_lon=gps_lon,
            description=description,
            storage_backend=storage_backend,
        )

        # ── Step 4: Auto-trigger OCR for images and PDFs ─────────────────────
        ocr_triggered = False
        if evidence_type in ("image", "document"):
            ocr_triggered = self._trigger_ocr(
                file_bytes=file_bytes,
                content_type=content_type,
                file_id=file_id,
                case_id=case_id,
            )

        # ── Step 5: Auto-trigger Speech-to-Text for audio ─────────────────────
        transcript_triggered = False
        if evidence_type == "audio":
            transcript_triggered = self._trigger_stt(
                file_bytes=file_bytes,
                content_type=content_type,
                file_id=file_id,
                case_id=case_id,
            )

        # ── Step 6: Emit push notification to case watchers ──────────────────
        self.signals.notify_evidence_uploaded(
            case_id=case_id,
            officer_id=officer_id,
            evidence_type=evidence_type,
        )

        # ── Step 7: Write audit log ───────────────────────────────────────────
        self.datastore.write_audit_log({
            "officer_id": officer_id,
            "action": "EVIDENCE_UPLOAD",
            "resource_type": "Evidence",
            "resource_id": str(db_evidence.evidence_id),
            "details": f"file={filename} type={evidence_type} storage={storage_backend}",
            "timestamp": uploaded_at,
        })

        logger.info(
            "Evidence upload complete: evidence_id=%d case_id=%d storage=%s "
            "ocr=%s stt=%s",
            db_evidence.evidence_id,
            case_id,
            storage_backend,
            ocr_triggered,
            transcript_triggered,
        )

        return {
            "success": True,
            "evidence_id": db_evidence.evidence_id,
            "file_id": file_id,
            "file_name": filename,
            "file_type": evidence_type,
            "case_id": case_id,
            "storage_backend": storage_backend,
            "ocr_triggered": ocr_triggered,
            "transcript_triggered": transcript_triggered,
            "file_hash": file_hash,
        }

    # ── Private helpers ────────────────────────────────────────────────────

    def _save_to_local_disk(self, file_bytes: bytes, filename: str, case_id: int) -> str:
        """Fallback: save to local disk when Catalyst is not configured."""
        _LEGACY_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        suffix = Path(filename).suffix.lower()
        safe_name = f"case_{case_id}_{timestamp}{suffix}"
        dest = _LEGACY_UPLOAD_DIR / safe_name
        with open(dest, "wb") as fh:
            fh.write(file_bytes)
        return safe_name

    def _create_postgres_record(
        self,
        case_id: int,
        evidence_type: str,
        description: str,
        officer_name: str,
        file_id: str,
        file_hash: str,
        storage_backend: str,
    ) -> Evidence:
        """Write the PostgreSQL Evidence record (preserves backward compat)."""
        evidence = Evidence(
            case_id=case_id,
            evidence_type=evidence_type,
            description=description,
            file_url=f"/uploads/evidence/{file_id}",
        )
        for attr, val in [
            ("collected_by", officer_name),
            ("collected_date", datetime.now()),
            ("status", "Collected"),
            ("catalyst_file_id", file_id),
            ("file_hash", file_hash),
            ("storage_backend", storage_backend),
        ]:
            if hasattr(evidence, attr):
                setattr(evidence, attr, val)

        self.db.add(evidence)
        self.db.commit()
        self.db.refresh(evidence)
        return evidence

    def _save_nosql_metadata(self, **kwargs: Any) -> None:
        """Save rich evidence metadata to Catalyst NoSQL."""
        try:
            self.nosql.save_evidence_metadata(kwargs)
        except Exception as exc:
            # Non-fatal — metadata save failure should not fail the upload
            logger.warning("NoSQL metadata save failed: %s", exc)

    def _trigger_ocr(
        self,
        file_bytes: bytes,
        content_type: str,
        file_id: str,
        case_id: int,
    ) -> bool:
        """Run OCR via Catalyst Zia and store result in NoSQL."""
        try:
            if content_type == "application/pdf":
                result = self.zia.ocr_pdf(file_bytes)
            else:
                result = self.zia.ocr_image(file_bytes, content_type)

            if result.get("success") and result.get("extracted_text"):
                self.nosql.save_ocr_output({
                    "file_id": file_id,
                    "case_id": case_id,
                    "extracted_text": result["extracted_text"],
                    "confidence": result.get("confidence", 0),
                    "page_count": result.get("page_count", 1),
                    "char_count": result.get("char_count", 0),
                    "processed_at": datetime.now(timezone.utc).isoformat(),
                })
                logger.info(
                    "OCR complete: file_id=%s extracted=%d chars",
                    file_id,
                    result.get("char_count", 0),
                )
            return result.get("success", False)
        except Exception as exc:
            logger.error("OCR trigger failed (file_id=%s): %s", file_id, exc)
            return False

    def _trigger_stt(
        self,
        file_bytes: bytes,
        content_type: str,
        file_id: str,
        case_id: int,
    ) -> bool:
        """Run Speech-to-Text via Catalyst Zia and store transcript in NoSQL."""
        try:
            result = self.zia.speech_to_text(file_bytes, content_type)

            if result.get("success") and result.get("transcript"):
                self.nosql.save_transcript({
                    "file_id": file_id,
                    "case_id": case_id,
                    "transcript_text": result["transcript"],
                    "confidence": result.get("confidence", 0),
                    "language_code": result.get("language", "en-IN"),
                    "char_count": result.get("char_count", 0),
                    "processed_at": datetime.now(timezone.utc).isoformat(),
                })
                logger.info(
                    "STT complete: file_id=%s transcript=%d chars",
                    file_id,
                    result.get("char_count", 0),
                )
            return result.get("success", False)
        except Exception as exc:
            logger.error("STT trigger failed (file_id=%s): %s", file_id, exc)
            return False

    # ── List / Get helpers ─────────────────────────────────────────────────

    def list_evidence(
        self,
        case_id: Optional[int] = None,
        evidence_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ):
        """List evidence records from PostgreSQL (primary source)."""
        q = self.db.query(Evidence)
        if case_id:
            q = q.filter(Evidence.case_id == case_id)
        if evidence_type:
            q = q.filter(Evidence.evidence_type.ilike(f"%{evidence_type}%"))
        total = q.count()
        items = q.order_by(Evidence.evidence_id.desc()).offset(skip).limit(limit).all()
        return items, total

    def get_evidence_metadata(self, case_id: int) -> list:
        """Get rich metadata from Catalyst NoSQL for all evidence in a case."""
        return self.nosql.get_evidence_metadata(case_id)

    def get_ocr_output(self, file_id: str) -> Optional[Dict[str, Any]]:
        """Get OCR extracted text for a specific file."""
        return self.nosql.get_ocr_output(file_id)

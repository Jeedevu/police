"""
backend/app/evidence/router.py
================================
KSP Crime Intelligence Platform — Evidence Router (Catalyst-Native)

v3.0 — Evidence upload now routes through :class:`EvidenceRepository` which:
  * Uploads files to Catalyst File Store (not local disk)
  * Saves rich metadata to Catalyst NoSQL
  * Auto-triggers Zia OCR (images, PDFs)
  * Auto-triggers Zia Speech-to-Text (audio)
  * Emits Catalyst Signals push notification
  * Writes to Catalyst DataStore AuditLogs
  * Creates backward-compatible PostgreSQL Evidence record

All existing API contracts (request/response shape, route paths) are preserved.
The only visible change: the response now includes ``file_id`` (Catalyst) and
``storage_backend`` ("catalyst" | "local") fields.

Fallback: if Catalyst File Store is not configured, files are saved to the
legacy local disk location (backward compatibility preserved).
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_officer, require_min_role, require_officer
from app.auth.models import Officer
from app.database.connection import get_db
from app.evidence.schemas import EvidenceListResponse, EvidenceOut, EvidenceUploadResponse
from app.repositories.evidence_repository import EvidenceRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/evidence", tags=["Evidence"])

ALLOWED_EXTENSIONS = {
    "image": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"],
    "video": [".mp4", ".avi", ".mov", ".mkv"],
    "audio": [".mp3", ".wav", ".aac", ".ogg"],
    "document": [".pdf", ".doc", ".docx", ".txt"],
}

ALL_ALLOWED = {ext for exts in ALLOWED_EXTENSIONS.values() for ext in exts}


@router.get("", response_model=EvidenceListResponse)
def list_evidence(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    case_id: Optional[int] = None,
    evidence_type: Optional[str] = None,
    db: Session = Depends(get_db),
    _: Officer = Depends(require_officer),
):
    """
    List evidence records with optional case_id and type filters.

    Data is served from PostgreSQL (the primary source for evidence records).
    Catalyst NoSQL metadata is available via ``GET /api/evidence/{case_id}/metadata``.
    """
    repo = EvidenceRepository(db)
    items, total = repo.list_evidence(
        case_id=case_id,
        evidence_type=evidence_type,
        skip=skip,
        limit=limit,
    )
    return EvidenceListResponse(
        total=total,
        skip=skip,
        limit=limit,
        data=[EvidenceOut.model_validate(e) for e in items],
    )


@router.post("/upload", response_model=EvidenceUploadResponse)
async def upload_evidence(
    case_id: int = Form(...),
    description: Optional[str] = Form(None),
    collected_by: Optional[str] = Form(None),
    gps_lat: Optional[float] = Form(None),
    gps_lon: Optional[float] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    officer: Officer = Depends(require_min_role("Sub Inspector")),
):
    """
    Upload an evidence file.

    v3.0 upload pipeline:
      1. Validate file extension
      2. Upload to Catalyst File Store (fallback: local disk)
      3. Create PostgreSQL Evidence record
      4. Save metadata to Catalyst NoSQL
      5. Auto-trigger OCR (images/PDFs) or STT (audio)
      6. Emit push notification to case watchers
      7. Write audit log

    Accepts optional GPS coordinates for geo-tagged evidence.
    """
    from pathlib import Path

    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALL_ALLOWED:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{suffix}' not allowed. Allowed: {sorted(ALL_ALLOWED)}",
        )

    content_type = file.content_type or "application/octet-stream"

    try:
        file_bytes = await file.read()
    except Exception as exc:
        logger.error("Failed to read uploaded file: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to read uploaded file") from exc

    repo = EvidenceRepository(db)

    try:
        result = repo.upload(
            file_bytes=file_bytes,
            filename=file.filename,
            content_type=content_type,
            case_id=case_id,
            officer_id=officer.id,
            officer_name=collected_by or officer.full_name,
            description=description,
            gps_lat=gps_lat,
            gps_lon=gps_lon,
        )
    except RuntimeError as exc:
        logger.error("Evidence upload failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return EvidenceUploadResponse(
        success=True,
        message="Evidence uploaded successfully",
        evidence_id=result["evidence_id"],
        file_name=file.filename,
        file_type=result["file_type"],
        case_id=case_id,
        # v3.0 additional fields
        file_id=result.get("file_id", ""),
        storage_backend=result.get("storage_backend", "local"),
        ocr_triggered=result.get("ocr_triggered", False),
        transcript_triggered=result.get("transcript_triggered", False),
    )


@router.get("/{case_id}/metadata")
def get_evidence_metadata(
    case_id: int,
    db: Session = Depends(get_db),
    _: Officer = Depends(require_officer),
):
    """
    Return rich Catalyst NoSQL metadata for all evidence in a case.

    Includes: file_id, file_hash, GPS coordinates, upload_time,
    OCR status, transcript status, storage_backend.

    Returns an empty list if Catalyst NoSQL is not configured.
    """
    repo = EvidenceRepository(db)
    metadata = repo.get_evidence_metadata(case_id)
    return {
        "case_id": case_id,
        "count": len(metadata),
        "metadata": metadata,
    }


@router.get("/{case_id}/ocr/{file_id}")
def get_ocr_output(
    case_id: int,
    file_id: str,
    db: Session = Depends(get_db),
    _: Officer = Depends(require_officer),
):
    """
    Return OCR extracted text for a specific evidence file.

    Parameters
    ----------
    case_id:
        Case ID (used for authorization context).
    file_id:
        Catalyst File Store file ID returned during upload.

    Returns
    -------
    dict with ``extracted_text``, ``confidence``, ``page_count``.
    Returns 404 if OCR output not found in Catalyst NoSQL.
    """
    repo = EvidenceRepository(db)
    ocr_data = repo.get_ocr_output(file_id)
    if not ocr_data:
        raise HTTPException(
            status_code=404,
            detail="OCR output not found. Either OCR has not completed or Catalyst is not configured.",
        )
    return ocr_data

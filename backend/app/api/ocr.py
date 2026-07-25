"""
backend/app/api/ocr.py
=========================
KSP Crime Intelligence Platform — Catalyst Zia OCR API

Routes for on-demand OCR requests and retrieval of stored OCR outputs.

Routes
------
  POST /api/ocr/extract          — Submit image or PDF for OCR extraction
  GET  /api/ocr/{file_id}        — Retrieve stored OCR output for a file
  GET  /api/ocr/case/{case_id}   — List all OCR outputs for a case

OCR is also triggered automatically during evidence upload.
These routes allow on-demand re-extraction or retrieval for display.
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.auth.dependencies import require_officer
from app.auth.models import Officer
from app.catalyst.config import is_catalyst_available
from app.catalyst.zia import CatalystZiaWrapper, LANGUAGE_EN_IN, LANGUAGE_KN_IN
from app.catalyst.nosql import CatalystNoSQLWrapper

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ocr", tags=["OCR"])

_zia = CatalystZiaWrapper()
_nosql = CatalystNoSQLWrapper()

SUPPORTED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/bmp", "image/webp", "image/tiff"}
SUPPORTED_DOC_TYPES = {"application/pdf"}
ALL_SUPPORTED = SUPPORTED_IMAGE_TYPES | SUPPORTED_DOC_TYPES


@router.post("/extract")
async def extract_text(
    file: UploadFile = File(...),
    language: Optional[str] = Form(LANGUAGE_EN_IN),
    case_id: Optional[int] = Form(None),
    file_id: Optional[str] = Form(None),
    officer: Officer = Depends(require_officer),
):
    """
    Submit an image or PDF for OCR text extraction using Catalyst Zia.

    Accepts: JPEG, PNG, BMP, WebP, TIFF, PDF

    Parameters
    ----------
    file:
        Image or PDF file to extract text from.
    language:
        Language hint: "en-IN" (default) or "kn-IN" (Kannada).
    case_id:
        Optional case ID — if provided, the OCR output is saved to NoSQL.
    file_id:
        Optional Catalyst File Store file ID — if provided, linked in metadata.

    Returns
    -------
    dict with ``extracted_text``, ``confidence``, ``char_count``, ``success``.
    """
    if not is_catalyst_available():
        raise HTTPException(
            status_code=503,
            detail="Catalyst Zia OCR is not configured.  Set CATALYST_* env vars.",
        )

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALL_SUPPORTED:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported content type '{content_type}'.  Supported: {sorted(ALL_SUPPORTED)}",
        )

    if language not in (LANGUAGE_EN_IN, LANGUAGE_KN_IN, "en-US"):
        language = LANGUAGE_EN_IN

    try:
        file_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to read file") from exc

    # Run OCR
    if content_type == "application/pdf":
        result = _zia.ocr_pdf(file_bytes, language=language)
    else:
        result = _zia.ocr_image(file_bytes, content_type=content_type, language=language)

    if not result.get("success"):
        raise HTTPException(
            status_code=502,
            detail=f"OCR extraction failed: {result.get('error', 'Unknown error')}",
        )

    # Save to NoSQL if case_id provided
    if case_id and result.get("extracted_text"):
        try:
            from datetime import datetime, timezone
            _nosql.save_ocr_output({
                "file_id": file_id or file.filename,
                "case_id": case_id,
                "extracted_text": result["extracted_text"],
                "confidence": result.get("confidence", 0),
                "page_count": result.get("page_count", 1),
                "char_count": result.get("char_count", 0),
                "language": language,
                "submitted_by_officer_id": officer.id,
                "processed_at": datetime.now(timezone.utc).isoformat(),
            })
            result["saved_to_nosql"] = True
            logger.info(
                "OCR result saved to NoSQL: case_id=%d chars=%d",
                case_id,
                result.get("char_count", 0),
            )
        except Exception as exc:
            logger.warning("OCR NoSQL save failed: %s", exc)
            result["saved_to_nosql"] = False

    return result


@router.get("/{file_id}")
def get_ocr_output(
    file_id: str,
    _: Officer = Depends(require_officer),
):
    """
    Retrieve stored OCR output for a specific file from Catalyst NoSQL.

    Parameters
    ----------
    file_id:
        Catalyst File Store file ID or filename used during OCR extraction.

    Returns
    -------
    dict with ``extracted_text``, ``confidence``, ``page_count``.
    Raises 404 if no OCR output is stored for this file.
    """
    result = _nosql.get_ocr_output(file_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"No OCR output found for file_id={file_id}.  "
                   "OCR may not have been triggered or Catalyst NoSQL is not configured.",
        )
    return result


@router.get("/case/{case_id}")
def list_case_ocr_outputs(
    case_id: int,
    _: Officer = Depends(require_officer),
):
    """
    List all stored OCR extraction outputs for a case.

    Returns all OCR documents in Catalyst NoSQL associated with this case_id.
    Useful for displaying extracted text from multiple evidence files in the UI.
    """
    from app.catalyst.nosql import TABLE_OCR_OUTPUTS
    results = _nosql.query(
        TABLE_OCR_OUTPUTS,
        {"case_id": {"value": str(case_id), "operator": "IS"}},
        max_results=100,
    )
    return {
        "case_id": case_id,
        "count": len(results),
        "ocr_outputs": results,
    }

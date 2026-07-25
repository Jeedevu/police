"""
backend/app/api/files.py
==========================
KSP Crime Intelligence Platform — Catalyst File Store API

Routes for direct file management via Catalyst File Store.
These routes complement the evidence upload flow and provide
general-purpose file operations for authorised officers.

Routes
------
  GET    /api/files/{file_id}         — Get file metadata
  GET    /api/files/{file_id}/download — Download file bytes
  DELETE /api/files/{file_id}         — Delete file (Admin only)
  GET    /api/files/folder/{folder_name} — List files in a folder
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse

from app.auth.dependencies import require_min_role, require_officer, require_role
from app.auth.models import Officer
from app.catalyst.filestore import CatalystFileStoreWrapper, EvidenceFolder, resolve_folder_id
from app.catalyst.config import is_catalyst_available

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/files", tags=["Files"])

_filestore = CatalystFileStoreWrapper()


@router.get("/health")
def file_store_health(_: Officer = Depends(require_officer)):
    """Return Catalyst File Store health and configured folder count."""
    return _filestore.health_check()


@router.get("/{file_id}/details")
def get_file_details(
    file_id: str,
    _: Officer = Depends(require_officer),
):
    """
    Get metadata for a file stored in Catalyst File Store.

    Parameters
    ----------
    file_id:
        Catalyst File Store file ID (returned during evidence upload).

    Returns
    -------
    dict with file name, size, URL, folder, content type.
    """
    if not is_catalyst_available():
        raise HTTPException(
            status_code=503,
            detail="Catalyst File Store is not configured.  Set CATALYST_FILE_STORE_FOLDER_* env vars.",
        )
    details = _filestore.get_file_details(file_id)
    if not details:
        raise HTTPException(status_code=404, detail=f"File not found: {file_id}")
    return details


@router.get("/{file_id}/download")
def download_file(
    file_id: str,
    _: Officer = Depends(require_officer),
):
    """
    Download a file from Catalyst File Store.

    Returns the raw file bytes as a streaming response.
    Content-Type is set from the file's stored metadata.
    """
    if not is_catalyst_available():
        raise HTTPException(status_code=503, detail="Catalyst File Store not configured.")

    try:
        file_bytes = _filestore.download(file_id)
    except Exception as exc:
        logger.error("File download failed (file_id=%s): %s", file_id, exc)
        raise HTTPException(status_code=404, detail=f"File not found or download failed: {file_id}") from exc

    import io
    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={file_id}"},
    )


@router.delete("/{file_id}")
def delete_file(
    file_id: str,
    officer: Officer = Depends(require_role("ADMIN", "DGP", "SP")),
):
    """
    Delete a file from Catalyst File Store.

    Restricted to ADMIN, DGP, and SP roles.
    Note: deleting a file does NOT automatically remove its NoSQL metadata record.
    That should be handled separately if needed.
    """
    if not is_catalyst_available():
        raise HTTPException(status_code=503, detail="Catalyst File Store not configured.")

    success = _filestore.delete(file_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"File not found or deletion failed: {file_id}")

    logger.info("File deleted: file_id=%s by officer=%d", file_id, officer.id)
    return {"success": True, "message": f"File {file_id} deleted", "deleted_by": officer.badge_number}


@router.get("/folder/{folder_name}")
def list_folder_files(
    folder_name: str,
    _: Officer = Depends(require_min_role("Inspector")),
):
    """
    List all files in a named Catalyst File Store folder.

    Parameters
    ----------
    folder_name:
        Evidence folder name.  Must be one of:
        evidence_images, evidence_videos, evidence_audio, fir, chargesheets,
        court_orders, forensic, fingerprints, dna, cctv, witness, misc

    Returns
    -------
    list of file metadata dicts.
    """
    folder_map = {
        "evidence_images": EvidenceFolder.EVIDENCE_IMAGES,
        "evidence_videos": EvidenceFolder.EVIDENCE_VIDEOS,
        "evidence_audio": EvidenceFolder.EVIDENCE_AUDIO,
        "fir": EvidenceFolder.FIR,
        "chargesheets": EvidenceFolder.CHARGESHEETS,
        "court_orders": EvidenceFolder.COURT_ORDERS,
        "forensic": EvidenceFolder.FORENSIC,
        "fingerprints": EvidenceFolder.FINGERPRINTS,
        "dna": EvidenceFolder.DNA,
        "cctv": EvidenceFolder.CCTV,
        "witness": EvidenceFolder.WITNESS,
        "misc": EvidenceFolder.MISC,
    }

    folder_enum = folder_map.get(folder_name.lower())
    if not folder_enum:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown folder '{folder_name}'.  Valid: {list(folder_map.keys())}",
        )

    folder_id = resolve_folder_id(folder_enum)
    if not folder_id:
        raise HTTPException(
            status_code=503,
            detail=f"Folder '{folder_name}' is not configured.  Set {folder_enum.value} env var.",
        )

    files = _filestore.get_folder_files(folder_id)
    return {"folder": folder_name, "count": len(files), "files": files}

"""
backend/app/catalyst/filestore.py
====================================
KSP Crime Intelligence Platform — Catalyst File Store Wrapper

Wraps the Zoho Catalyst File Store SDK.

All evidence files, FIR documents, forensic reports, and other assets are
stored exclusively in Catalyst File Store — NEVER on local disk.

Upload flow
-----------
  React → FastAPI (this wrapper) → Catalyst File Store → return file_id
      → save metadata to Catalyst NoSQL → return file_id to client

Folder structure (created in Catalyst Console)
-----------------------------------------------
  Evidence Images    → CATALYST_FILE_STORE_FOLDER_EVIDENCE_IMAGES
  Evidence Videos    → CATALYST_FILE_STORE_FOLDER_EVIDENCE_VIDEOS
  Evidence Audio     → CATALYST_FILE_STORE_FOLDER_EVIDENCE_AUDIO
  FIR Documents      → CATALYST_FILE_STORE_FOLDER_FIR
  Charge Sheets      → CATALYST_FILE_STORE_FOLDER_CHARGESHEETS
  Court Orders       → CATALYST_FILE_STORE_FOLDER_COURT_ORDERS
  Forensic Reports   → CATALYST_FILE_STORE_FOLDER_FORENSIC
  Fingerprints       → CATALYST_FILE_STORE_FOLDER_FINGERPRINTS
  DNA Reports        → CATALYST_FILE_STORE_FOLDER_DNA
  CCTV               → CATALYST_FILE_STORE_FOLDER_CCTV
  Witness Statements → CATALYST_FILE_STORE_FOLDER_WITNESS
  Misc               → CATALYST_FILE_STORE_FOLDER_MISC

Environment variables
---------------------
  CATALYST_FILE_STORE_FOLDER_EVIDENCE_IMAGES   — folder ID from Catalyst Console
  CATALYST_FILE_STORE_FOLDER_EVIDENCE_VIDEOS   — folder ID
  CATALYST_FILE_STORE_FOLDER_EVIDENCE_AUDIO    — folder ID
  CATALYST_FILE_STORE_FOLDER_FIR               — folder ID
  CATALYST_FILE_STORE_FOLDER_CHARGESHEETS      — folder ID
  CATALYST_FILE_STORE_FOLDER_COURT_ORDERS      — folder ID
  CATALYST_FILE_STORE_FOLDER_FORENSIC          — folder ID
  CATALYST_FILE_STORE_FOLDER_FINGERPRINTS      — folder ID
  CATALYST_FILE_STORE_FOLDER_DNA               — folder ID
  CATALYST_FILE_STORE_FOLDER_CCTV              — folder ID
  CATALYST_FILE_STORE_FOLDER_WITNESS           — folder ID
  CATALYST_FILE_STORE_FOLDER_MISC              — folder ID

TODO:CREDENTIALS — create folders in Catalyst Console → File Store and set the
                   above env vars.  The folder IDs are numeric strings.
"""
from __future__ import annotations

import io
import logging
import os
from enum import Enum
from typing import Any, Dict, Optional

from app.catalyst.config import CatalystServiceError, get_catalyst_app, is_catalyst_available

logger = logging.getLogger("ksp.catalyst.filestore")


class EvidenceFolder(str, Enum):
    """Maps evidence types to File Store environment variable names."""

    EVIDENCE_IMAGES = "CATALYST_FILE_STORE_FOLDER_EVIDENCE_IMAGES"
    EVIDENCE_VIDEOS = "CATALYST_FILE_STORE_FOLDER_EVIDENCE_VIDEOS"
    EVIDENCE_AUDIO = "CATALYST_FILE_STORE_FOLDER_EVIDENCE_AUDIO"
    FIR = "CATALYST_FILE_STORE_FOLDER_FIR"
    CHARGESHEETS = "CATALYST_FILE_STORE_FOLDER_CHARGESHEETS"
    COURT_ORDERS = "CATALYST_FILE_STORE_FOLDER_COURT_ORDERS"
    FORENSIC = "CATALYST_FILE_STORE_FOLDER_FORENSIC"
    FINGERPRINTS = "CATALYST_FILE_STORE_FOLDER_FINGERPRINTS"
    DNA = "CATALYST_FILE_STORE_FOLDER_DNA"
    CCTV = "CATALYST_FILE_STORE_FOLDER_CCTV"
    WITNESS = "CATALYST_FILE_STORE_FOLDER_WITNESS"
    MISC = "CATALYST_FILE_STORE_FOLDER_MISC"


# Map file extension → EvidenceFolder
_EXTENSION_TO_FOLDER: Dict[str, EvidenceFolder] = {
    ".jpg": EvidenceFolder.EVIDENCE_IMAGES,
    ".jpeg": EvidenceFolder.EVIDENCE_IMAGES,
    ".png": EvidenceFolder.EVIDENCE_IMAGES,
    ".webp": EvidenceFolder.EVIDENCE_IMAGES,
    ".bmp": EvidenceFolder.EVIDENCE_IMAGES,
    ".gif": EvidenceFolder.EVIDENCE_IMAGES,
    ".mp4": EvidenceFolder.EVIDENCE_VIDEOS,
    ".avi": EvidenceFolder.EVIDENCE_VIDEOS,
    ".mov": EvidenceFolder.EVIDENCE_VIDEOS,
    ".mkv": EvidenceFolder.EVIDENCE_VIDEOS,
    ".mp3": EvidenceFolder.EVIDENCE_AUDIO,
    ".wav": EvidenceFolder.EVIDENCE_AUDIO,
    ".aac": EvidenceFolder.EVIDENCE_AUDIO,
    ".ogg": EvidenceFolder.EVIDENCE_AUDIO,
    ".pdf": EvidenceFolder.FIR,   # default PDF to FIR; can be overridden by caller
    ".doc": EvidenceFolder.MISC,
    ".docx": EvidenceFolder.MISC,
    ".txt": EvidenceFolder.MISC,
}


def resolve_folder_id(folder_enum: EvidenceFolder) -> Optional[str]:
    """
    Resolve a folder ID from the environment variable named by the enum.

    Returns None if the variable is not set (graceful degradation).
    """
    folder_id = os.getenv(folder_enum.value, "")
    if not folder_id:
        logger.warning(
            "File Store folder ID not set.  "
            "Set env var %s in .env  (TODO:CREDENTIALS)",
            folder_enum.value,
        )
        return None
    return folder_id


def detect_folder(filename: str, override: Optional[EvidenceFolder] = None) -> EvidenceFolder:
    """Determine the correct File Store folder from the file extension."""
    if override:
        return override
    ext = os.path.splitext(filename)[-1].lower()
    return _EXTENSION_TO_FOLDER.get(ext, EvidenceFolder.MISC)


class CatalystFileStoreWrapper:
    """
    Thin wrapper around Catalyst File Store SDK.

    Files are NEVER stored locally.  All uploads go directly to Catalyst
    File Store and the returned ``file_id`` is saved in Catalyst NoSQL metadata.
    """

    # ── Upload ─────────────────────────────────────────────────────────────

    def upload(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: str,
        folder: Optional[EvidenceFolder] = None,
    ) -> Dict[str, Any]:
        """
        Upload a file to Catalyst File Store.

        Parameters
        ----------
        file_bytes:
            Raw file bytes (read from UploadFile in FastAPI route).
        filename:
            Original filename (used for the File Store object name).
        content_type:
            MIME type, e.g. ``"image/jpeg"``.
        folder:
            Target :class:`EvidenceFolder`.  Detected from extension if omitted.

        Returns
        -------
        dict with keys: ``file_id``, ``file_name``, ``file_url``, ``folder_id``,
                        ``file_size``, ``content_type``

        Raises
        ------
        CatalystServiceError
            If Catalyst is available but the upload fails.
        RuntimeError
            If Catalyst is not configured (caller should handle with local fallback
            or appropriate HTTP 503).
        """
        if not is_catalyst_available():
            raise RuntimeError(
                "Catalyst File Store is not configured.  "
                "Set CATALYST_FILE_STORE_FOLDER_* env vars.  (TODO:CREDENTIALS)"
            )

        target_folder = detect_folder(filename, folder)
        folder_id = resolve_folder_id(target_folder)

        if not folder_id:
            raise CatalystServiceError(
                f"Folder ID for {target_folder.value} is not set.  "
                "Configure the env var and create the folder in Catalyst Console."
            )

        try:
            app = get_catalyst_app()
            file_store = app.Filestore()  # type: ignore[attr-defined]
            folder_obj = file_store.folder(folder_id)

            file_like = io.BytesIO(file_bytes)
            file_like.name = filename  # some SDK versions use .name attribute

            result = folder_obj.upload_file(file_like)

            file_id = str(result.get("id") or result.get("file_id", ""))
            file_url = result.get("url") or result.get("file_url") or ""

            logger.info(
                "✓ File uploaded to Catalyst File Store: file_id=%s name=%s size=%d bytes",
                file_id,
                filename,
                len(file_bytes),
            )

            return {
                "file_id": file_id,
                "file_name": filename,
                "file_url": file_url,
                "folder_id": folder_id,
                "folder_type": target_folder.value,
                "file_size": len(file_bytes),
                "content_type": content_type,
            }
        except Exception as exc:
            logger.error("File Store upload failed (file=%s): %s", filename, exc)
            raise CatalystServiceError(f"File upload failed: {exc}") from exc

    # ── Download ───────────────────────────────────────────────────────────

    def download(self, file_id: str) -> bytes:
        """
        Download a file from Catalyst File Store by its file_id.

        Parameters
        ----------
        file_id:
            Catalyst File Store file ID.

        Returns
        -------
        bytes
            Raw file bytes.

        Raises
        ------
        CatalystServiceError
        """
        if not is_catalyst_available():
            raise RuntimeError("Catalyst File Store is not configured.")

        try:
            app = get_catalyst_app()
            file_store = app.Filestore()  # type: ignore[attr-defined]
            file_obj = file_store.file(file_id)
            data = file_obj.download()
            logger.debug("File Store download: file_id=%s bytes=%d", file_id, len(data))
            return data
        except Exception as exc:
            logger.error("File Store download failed (file_id=%s): %s", file_id, exc)
            raise CatalystServiceError(f"File download failed: {exc}") from exc

    # ── Delete ─────────────────────────────────────────────────────────────

    def delete(self, file_id: str) -> bool:
        """
        Delete a file from Catalyst File Store.

        Returns
        -------
        bool — True on success.
        """
        if not is_catalyst_available():
            return False

        try:
            app = get_catalyst_app()
            file_store = app.Filestore()  # type: ignore[attr-defined]
            file_obj = file_store.file(file_id)
            file_obj.delete()
            logger.info("File Store delete: file_id=%s", file_id)
            return True
        except Exception as exc:
            logger.error("File Store delete failed (file_id=%s): %s", file_id, exc)
            return False

    # ── Metadata ───────────────────────────────────────────────────────────

    def get_file_details(self, file_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve file metadata (name, size, URL, folder) from Catalyst.

        Returns
        -------
        dict or None
        """
        if not is_catalyst_available():
            return None

        try:
            app = get_catalyst_app()
            file_store = app.Filestore()  # type: ignore[attr-defined]
            file_obj = file_store.file(file_id)
            details = file_obj.get_file_details()
            return dict(details) if details else None
        except Exception as exc:
            logger.error("File Store get_details failed (file_id=%s): %s", file_id, exc)
            return None

    def get_folder_files(self, folder_id: str, max_results: int = 100) -> list:
        """
        List all files in a File Store folder.

        Parameters
        ----------
        folder_id:
            Catalyst File Store folder ID.
        max_results:
            Maximum number of files to return.

        Returns
        -------
        list[dict]
        """
        if not is_catalyst_available():
            return []

        try:
            app = get_catalyst_app()
            file_store = app.Filestore()  # type: ignore[attr-defined]
            folder_obj = file_store.folder(folder_id)
            files = folder_obj.get_folder_details()
            return list(files) if files else []
        except Exception as exc:
            logger.error("File Store get_folder_files failed (folder_id=%s): %s", folder_id, exc)
            return []

    # ── Health ─────────────────────────────────────────────────────────────

    def health_check(self) -> Dict[str, Any]:
        """Return wrapper health status with configured folder count."""
        available = is_catalyst_available()
        configured_folders = [
            f.value
            for f in EvidenceFolder
            if os.getenv(f.value)
        ]
        return {
            "service": "catalyst_filestore",
            "available": available,
            "status": "ok" if available else "unconfigured",
            "configured_folders": len(configured_folders),
            "total_folders": len(EvidenceFolder),
        }

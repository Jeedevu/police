"""
backend/app/api/audio.py
==========================
KSP Crime Intelligence Platform — Audio Transcription API

Routes for audio evidence transcription via Catalyst Zia Speech-to-Text.

Routes
------
  POST /api/audio/transcribe        — Transcribe an audio file to text
  GET  /api/audio/transcript/{file_id} — Retrieve stored transcript
  GET  /api/audio/transcripts/{case_id} — List all transcripts for a case

Transcription is also triggered automatically during evidence upload for
audio files.  These routes allow on-demand transcription or retrieval.

Supported audio formats: WAV, MP3, AAC, OGG, FLAC
Supported languages: en-IN (English India), kn-IN (Kannada), en-US
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.auth.dependencies import require_officer
from app.auth.models import Officer
from app.catalyst.config import is_catalyst_available
from app.catalyst.zia import CatalystZiaWrapper, LANGUAGE_EN_IN, LANGUAGE_KN_IN
from app.catalyst.nosql import CatalystNoSQLWrapper, TABLE_SPEECH_TRANSCRIPTS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/audio", tags=["Audio"])

_zia = CatalystZiaWrapper()
_nosql = CatalystNoSQLWrapper()

SUPPORTED_AUDIO_TYPES = {
    "audio/wav", "audio/mpeg", "audio/mp3", "audio/aac",
    "audio/ogg", "audio/flac", "audio/x-wav",
}


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Form(LANGUAGE_EN_IN),
    case_id: Optional[int] = Form(None),
    file_id: Optional[str] = Form(None),
    officer: Officer = Depends(require_officer),
):
    """
    Transcribe an audio file to text using Catalyst Zia Speech-to-Text.

    Accepts: WAV, MP3, AAC, OGG, FLAC

    Parameters
    ----------
    file:
        Audio file to transcribe.
    language:
        Transcription language: "en-IN" (default), "kn-IN" (Kannada), "en-US".
    case_id:
        Optional case ID — if provided, transcript is saved to Catalyst NoSQL.
    file_id:
        Optional Catalyst File Store file ID to link the transcript.

    Returns
    -------
    dict with ``transcript``, ``confidence``, ``language``, ``char_count``.
    """
    if not is_catalyst_available():
        raise HTTPException(
            status_code=503,
            detail="Catalyst Zia Speech-to-Text is not configured.  Set CATALYST_* env vars.",
        )

    content_type = file.content_type or "audio/wav"

    # Normalise common MIME aliases
    if content_type in ("audio/mp3", "audio/mpeg"):
        content_type = "audio/mpeg"

    if content_type not in SUPPORTED_AUDIO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio type '{content_type}'.  Supported: {sorted(SUPPORTED_AUDIO_TYPES)}",
        )

    if language not in (LANGUAGE_EN_IN, LANGUAGE_KN_IN, "en-US"):
        language = LANGUAGE_EN_IN

    try:
        audio_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to read audio file") from exc

    result = _zia.speech_to_text(
        audio_bytes=audio_bytes,
        content_type=content_type,
        language=language,
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=502,
            detail=f"Transcription failed: {result.get('error', 'Unknown error')}",
        )

    # Save to NoSQL if case_id provided
    if case_id and result.get("transcript"):
        try:
            from datetime import datetime, timezone
            _nosql.save_transcript({
                "file_id": file_id or file.filename,
                "case_id": case_id,
                "transcript_text": result["transcript"],
                "confidence": result.get("confidence", 0),
                "language_code": language,
                "char_count": result.get("char_count", 0),
                "submitted_by_officer_id": officer.id,
                "processed_at": datetime.now(timezone.utc).isoformat(),
            })
            result["saved_to_nosql"] = True
            logger.info(
                "Transcript saved to NoSQL: case_id=%d chars=%d",
                case_id,
                result.get("char_count", 0),
            )
        except Exception as exc:
            logger.warning("Transcript NoSQL save failed: %s", exc)
            result["saved_to_nosql"] = False

    return result


@router.post("/tts")
async def text_to_speech(
    text: str = Form(...),
    language: Optional[str] = Form(LANGUAGE_EN_IN),
    _: Officer = Depends(require_officer),
):
    """
    Convert AI response text to audio bytes using Catalyst Zia TTS.

    Used by the frontend to play AI investigation responses via the
    Web Audio API for voice-enabled interfaces.

    Parameters
    ----------
    text:
        Text to synthesise (max 5000 characters).
    language:
        Synthesis language: "en-IN" or "kn-IN".

    Returns
    -------
    Binary audio response (WAV or MP3).
    """
    if not is_catalyst_available():
        raise HTTPException(
            status_code=503,
            detail="Catalyst Zia TTS is not configured.  Set CATALYST_* env vars.",
        )

    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="text cannot be empty")

    from app.catalyst.zia import VOICE_EN_IN_FEMALE, VOICE_KN_IN_FEMALE

    voice = VOICE_KN_IN_FEMALE if language == LANGUAGE_KN_IN else VOICE_EN_IN_FEMALE

    audio_bytes = _zia.text_to_speech(
        text=text,
        voice=voice,
        language_code=language,
    )

    if not audio_bytes:
        raise HTTPException(status_code=502, detail="TTS synthesis failed or returned empty")

    return StreamingResponse(
        iter([audio_bytes]),
        media_type="audio/wav",
        headers={"Content-Disposition": "inline; filename=tts_response.wav"},
    )


@router.get("/transcript/{file_id}")
def get_transcript(
    file_id: str,
    _: Officer = Depends(require_officer),
):
    """
    Retrieve the stored Speech-to-Text transcript for a file.

    Parameters
    ----------
    file_id:
        File ID (Catalyst File Store ID or filename).

    Returns
    -------
    dict with ``transcript_text``, ``confidence``, ``language_code``.
    Raises 404 if no transcript is stored.
    """
    results = _nosql.query(
        TABLE_SPEECH_TRANSCRIPTS,
        {"file_id": {"value": file_id, "operator": "IS"}},
        max_results=1,
    )
    if not results:
        raise HTTPException(
            status_code=404,
            detail=f"No transcript found for file_id={file_id}. "
                   "Transcription may not have been triggered or Catalyst is not configured.",
        )
    return results[0]


@router.get("/transcripts/{case_id}")
def list_case_transcripts(
    case_id: int,
    _: Officer = Depends(require_officer),
):
    """
    List all speech transcripts stored for a case.

    Returns all transcript documents in Catalyst NoSQL for this case_id.
    """
    results = _nosql.query(
        TABLE_SPEECH_TRANSCRIPTS,
        {"case_id": {"value": str(case_id), "operator": "IS"}},
        max_results=100,
    )
    return {
        "case_id": case_id,
        "count": len(results),
        "transcripts": results,
    }

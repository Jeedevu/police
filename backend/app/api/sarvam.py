"""
FastAPI Router for Sarvam AI Speech-to-Speech Assistant.

Endpoints:
  POST /api/stt              - Upload audio file and receive Sarvam STT text transcript.
  POST /api/chat             - Send prompt to Gemini 2.5 Flash & return response + TTS audio.
  POST /api/tts              - Synthesize text into Sarvam Bulbul V3 base64 audio.
  POST /api/speech-to-speech - Complete end-to-end pipeline (Audio -> STT -> Gemini -> TTS).
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_officer
from app.auth.models import Officer
from app.database.connection import get_db
from app.services.ai_chat_service import ai_chat_service
from app.services.sarvam_stt_service import SUPPORTED_STT_LANGUAGES, sarvam_stt_service
from app.services.sarvam_tts_service import sarvam_tts_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Sarvam Speech AI"])


class ChatRequest(BaseModel):
    prompt: str
    language_code: Optional[str] = "kn-IN"
    generate_tts: Optional[bool] = True


class TTSRequest(BaseModel):
    text: str
    language_code: Optional[str] = "kn-IN"
    speaker: Optional[str] = None


@router.post("/stt")
async def speech_to_text_endpoint(
    file: UploadFile = File(...),
    language_code: str = Form("kn-IN"),
):
    """
    Upload recorded microphone audio (WEBM/WAV) and convert to text using Sarvam STT.
    """
    if not file:
        raise HTTPException(status_code=400, detail="Audio file is required")

    audio_bytes = await file.read()
    if not audio_bytes or len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Empty or corrupted audio payload")

    filename = file.filename or "recording.webm"
    result = await sarvam_stt_service.transcribe_audio(
        audio_bytes=audio_bytes,
        filename=filename,
        language_code=language_code,
    )
    return result


@router.post("/chat")
async def chat_endpoint(
    req_data: ChatRequest,
    officer: Optional[Officer] = Depends(get_current_officer),
    db: Session = Depends(get_db),
):
    """
    Process text prompt via Gemini 2.5 Flash, log to PostgreSQL, and synthesize Sarvam voice.
    """
    if not req_data.prompt or not req_data.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt text is required")

    officer_id = officer.id if officer else None
    result = await ai_chat_service.process_chat(
        prompt=req_data.prompt,
        language_code=req_data.language_code or "kn-IN",
        officer_id=officer_id,
        db=db,
        generate_tts=req_data.generate_tts,
    )
    return result


@router.post("/tts")
async def text_to_speech_endpoint(req_data: TTSRequest):
    """
    Synthesize text into speech audio using Sarvam Bulbul V3 model.
    """
    if not req_data.text or not req_data.text.strip():
        raise HTTPException(status_code=400, detail="Text is required for TTS synthesis")

    result = await sarvam_tts_service.text_to_speech(
        text=req_data.text,
        target_language_code=req_data.language_code or "kn-IN",
        speaker=req_data.speaker,
    )
    return result


@router.post("/speech-to-speech")
async def speech_to_speech_endpoint(
    file: UploadFile = File(...),
    language_code: str = Form("kn-IN"),
    officer: Optional[Officer] = Depends(get_current_officer),
    db: Session = Depends(get_db),
):
    """
    End-to-End Speech-to-Speech Pipeline:
    Audio File -> Sarvam STT -> Gemini 2.5 Flash -> PostgreSQL Audit Log -> Sarvam Bulbul V3 TTS -> Audio Payload.
    """
    if not file:
        raise HTTPException(status_code=400, detail="Audio recording file is required")

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio payload")

    # Step 1: STT
    stt_res = await sarvam_stt_service.transcribe_audio(
        audio_bytes=audio_bytes,
        filename=file.filename or "recording.webm",
        language_code=language_code,
    )

    transcript = stt_res.get("transcript", "").strip()
    if not transcript or stt_res.get("status") in ["error", "failed"]:
        return {
            "transcript": transcript or "Could not recognize speech.",
            "response": "Could not recognize speech. Please try speaking again.",
            "language_code": language_code,
            "tts": {"audios": [], "audio_urls": []},
            "status": "stt_error",
        }

    # Step 2: Gemini AI + Step 3: Sarvam TTS
    officer_id = officer.id if officer else None
    chat_res = await ai_chat_service.process_chat(
        prompt=transcript,
        language_code=language_code,
        officer_id=officer_id,
        db=db,
        generate_tts=True,
    )

    return {
        "user_transcript": transcript,
        "ai_response": chat_res.get("response", ""),
        "language_code": language_code,
        "tts": chat_res.get("tts", {}),
        "status": "success",
    }


@router.get("/sarvam/languages")
def get_supported_languages():
    """Return list of supported Indian languages for STT and TTS."""
    return {"languages": SUPPORTED_STT_LANGUAGES}

"""
backend/app/catalyst/zia.py
==============================
KSP Crime Intelligence Platform — Catalyst Zia AI Services Wrapper

Wraps three Catalyst Zia cognitive AI services:
  1. OCR      — extract text from images and PDFs (auto-triggered on evidence upload)
  2. Speech-to-Text — generate transcripts from audio evidence
  3. Text-to-Speech — convert AI responses to audio for voice output

These services are called by the evidence repository and AI services.
Never call Zia directly from routers.

Architecture
------------
Evidence Router → EvidenceRepository → CatalystZiaWrapper → Catalyst Zia SDK
AI Chat Router  → ChatService        → CatalystZiaWrapper → Catalyst Zia SDK

Environment variables
---------------------
  CATALYST_ZIA_PROJECT_KEY   — Zia service key (Catalyst Console → Zia → Keys)
                               (TODO:CREDENTIALS — may be same as CATALYST_PROJECT_KEY)

Supported audio formats for STT: wav, mp3, aac, ogg, flac
Supported image formats for OCR: jpg, jpeg, png, bmp, tiff, pdf (multi-page)
Supported TTS voices: en-IN, en-US, kn-IN (Kannada)
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.catalyst.config import CatalystServiceError, get_catalyst_app, is_catalyst_available

logger = logging.getLogger("ksp.catalyst.zia")

# Supported language codes for Kannada + English
LANGUAGE_EN_IN = "en-IN"
LANGUAGE_EN_US = "en-US"
LANGUAGE_KN_IN = "kn-IN"

# TTS voice constants (verify available voices in Catalyst Console)
# TODO:CREDENTIALS — confirm voice names match those listed in your Catalyst project
VOICE_EN_IN_FEMALE = "en-IN-female"
VOICE_EN_IN_MALE = "en-IN-male"
VOICE_KN_IN_FEMALE = "kn-IN-female"


class CatalystZiaWrapper:
    """
    Thin wrapper around Catalyst Zia cognitive AI services.

    OCR
    ---
    ``ocr_image()``    — extract text from a single image file
    ``ocr_pdf()``      — extract text from a PDF (multi-page supported)

    Speech-to-Text
    --------------
    ``speech_to_text()`` — transcribe an audio file to text

    Text-to-Speech
    --------------
    ``text_to_speech()`` — convert AI response text to audio bytes
    """

    # ── OCR ────────────────────────────────────────────────────────────────

    def ocr_image(
        self,
        image_bytes: bytes,
        content_type: str = "image/jpeg",
        language: str = LANGUAGE_EN_IN,
    ) -> Dict[str, Any]:
        """
        Extract text from an image using Catalyst Zia OCR.

        Automatically triggered when an evidence image is uploaded.
        The extracted text is stored in Catalyst NoSQL (OCROutputs table).

        Parameters
        ----------
        image_bytes:
            Raw image bytes.
        content_type:
            MIME type of the image (e.g. ``"image/jpeg"``).
        language:
            Language hint for better accuracy.  Use ``kn-IN`` for Kannada text.

        Returns
        -------
        dict with keys:
            ``extracted_text``  — full extracted text (str)
            ``confidence``      — average confidence score (float, 0-100)
            ``words``           — list of word-level objects
            ``success``         — bool
        """
        if not is_catalyst_available():
            logger.warning("Catalyst unavailable — OCR skipped")
            return {"success": False, "error": "Catalyst not configured", "extracted_text": ""}

        try:
            app = get_catalyst_app()
            zia = app.Zia()  # type: ignore[attr-defined]
            ocr_service = zia.OCR()

            result = ocr_service.ocr_image(
                image_bytes,
                {
                    "content_type": content_type,
                    "language": language,
                },
            )

            extracted_text = result.get("text", "") or ""
            words = result.get("words", [])
            confidence = result.get("confidence", 0.0)

            logger.info(
                "Zia OCR: extracted %d chars, confidence=%.1f%%",
                len(extracted_text),
                confidence,
            )

            return {
                "success": True,
                "extracted_text": extracted_text,
                "confidence": confidence,
                "words": words,
                "char_count": len(extracted_text),
            }
        except Exception as exc:
            logger.error("Zia OCR (image) failed: %s", exc)
            return {"success": False, "error": str(exc), "extracted_text": ""}

    def ocr_pdf(
        self,
        pdf_bytes: bytes,
        language: str = LANGUAGE_EN_IN,
    ) -> Dict[str, Any]:
        """
        Extract text from a PDF document using Catalyst Zia OCR.

        Multi-page PDFs are fully supported.  Results include per-page text.

        Parameters
        ----------
        pdf_bytes:
            Raw PDF bytes.
        language:
            Language hint for OCR accuracy.

        Returns
        -------
        dict with keys:
            ``extracted_text`` — concatenated full text from all pages
            ``pages``          — list of per-page dicts {``page_number``, ``text``, ``confidence``}
            ``page_count``     — total number of pages
            ``success``        — bool
        """
        if not is_catalyst_available():
            logger.warning("Catalyst unavailable — PDF OCR skipped")
            return {
                "success": False,
                "error": "Catalyst not configured",
                "extracted_text": "",
                "pages": [],
            }

        try:
            app = get_catalyst_app()
            zia = app.Zia()  # type: ignore[attr-defined]
            ocr_service = zia.OCR()

            result = ocr_service.ocr_image(
                pdf_bytes,
                {
                    "content_type": "application/pdf",
                    "language": language,
                },
            )

            pages = result.get("pages", [])
            extracted_text = "\n\n".join(p.get("text", "") for p in pages)

            logger.info(
                "Zia PDF OCR: %d pages, %d chars extracted",
                len(pages),
                len(extracted_text),
            )

            return {
                "success": True,
                "extracted_text": extracted_text,
                "pages": pages,
                "page_count": len(pages),
                "char_count": len(extracted_text),
            }
        except Exception as exc:
            logger.error("Zia OCR (PDF) failed: %s", exc)
            return {
                "success": False,
                "error": str(exc),
                "extracted_text": "",
                "pages": [],
            }

    # ── Speech-to-Text ─────────────────────────────────────────────────────

    def speech_to_text(
        self,
        audio_bytes: bytes,
        content_type: str = "audio/wav",
        language: str = LANGUAGE_EN_IN,
    ) -> Dict[str, Any]:
        """
        Generate a text transcript from an audio file using Catalyst Zia STT.

        Automatically triggered when an audio evidence file is uploaded.
        The transcript is stored in Catalyst NoSQL (SpeechTranscripts table).

        Parameters
        ----------
        audio_bytes:
            Raw audio bytes.
        content_type:
            Audio MIME type (``audio/wav``, ``audio/mp3``, ``audio/aac``, etc.)
        language:
            Language for transcription.  Use ``kn-IN`` for Kannada speech.

        Returns
        -------
        dict with keys:
            ``transcript``      — full transcript text (str)
            ``confidence``      — overall confidence score (float, 0-100)
            ``words``           — word-level timings (list)
            ``duration_seconds``— audio duration estimate
            ``success``         — bool
        """
        if not is_catalyst_available():
            logger.warning("Catalyst unavailable — STT skipped")
            return {"success": False, "error": "Catalyst not configured", "transcript": ""}

        try:
            app = get_catalyst_app()
            zia = app.Zia()  # type: ignore[attr-defined]
            stt_service = zia.SpeechToText()

            result = stt_service.transcribe(
                audio_bytes,
                {
                    "content_type": content_type,
                    "language": language,
                },
            )

            transcript = result.get("text", "") or ""
            confidence = result.get("confidence", 0.0)
            words = result.get("words", [])

            logger.info(
                "Zia STT: transcribed %d chars, confidence=%.1f%%",
                len(transcript),
                confidence,
            )

            return {
                "success": True,
                "transcript": transcript,
                "confidence": confidence,
                "words": words,
                "language": language,
                "char_count": len(transcript),
            }
        except Exception as exc:
            logger.error("Zia STT failed: %s", exc)
            return {"success": False, "error": str(exc), "transcript": ""}

    # ── Text-to-Speech ─────────────────────────────────────────────────────

    def text_to_speech(
        self,
        text: str,
        voice: str = VOICE_EN_IN_FEMALE,
        language: str = LANGUAGE_EN_IN,
        speed: float = 1.0,
    ) -> bytes:
        """
        Convert an AI response text to audio bytes using Catalyst Zia TTS.

        Used by the voice output feature — the frontend receives the audio bytes
        and plays them using the Web Audio API.

        Parameters
        ----------
        text:
            Text to synthesise.  Maximum ~5000 characters per call.
        voice:
            Voice identifier (see module-level constants).
        language:
            Language code.  Automatically switches to Kannada voice for ``kn-IN``.
        speed:
            Speech speed multiplier (0.5 = slow, 1.0 = normal, 2.0 = fast).

        Returns
        -------
        bytes
            Audio bytes in WAV or MP3 format (depends on Catalyst implementation).
            Returns empty bytes if TTS fails.
        """
        if not is_catalyst_available():
            logger.warning("Catalyst unavailable — TTS skipped")
            return b""

        if not text or not text.strip():
            return b""

        try:
            app = get_catalyst_app()
            zia = app.Zia()  # type: ignore[attr-defined]
            tts_service = zia.TextToSpeech()

            audio_bytes = tts_service.synthesize(
                text[:5000],  # hard cap to avoid API limits
                {
                    "voice": voice,
                    "language": language,
                    "speed": speed,
                },
            )

            logger.info("Zia TTS: synthesised %d chars → %d bytes audio", len(text), len(audio_bytes))
            return audio_bytes if audio_bytes else b""
        except Exception as exc:
            logger.error("Zia TTS failed: %s", exc)
            return b""

    # ── Batch OCR (multiple files) ─────────────────────────────────────────

    def batch_ocr(
        self, files: List[Dict[str, Any]], language: str = LANGUAGE_EN_IN
    ) -> List[Dict[str, Any]]:
        """
        Run OCR on multiple files sequentially.

        Parameters
        ----------
        files:
            List of dicts, each with keys: ``bytes``, ``content_type``, ``filename``
        language:
            Language hint applied to all files.

        Returns
        -------
        list[dict]
            One result dict per file (in input order).
        """
        results = []
        for f in files:
            ct = f.get("content_type", "image/jpeg")
            if ct == "application/pdf":
                result = self.ocr_pdf(f["bytes"], language)
            else:
                result = self.ocr_image(f["bytes"], ct, language)
            result["filename"] = f.get("filename", "unknown")
            results.append(result)
        return results

    # ── Health ─────────────────────────────────────────────────────────────

    def health_check(self) -> Dict[str, Any]:
        """Return wrapper health status."""
        available = is_catalyst_available()
        return {
            "service": "catalyst_zia",
            "available": available,
            "status": "ok" if available else "unconfigured",
            "features": {
                "ocr": True,
                "speech_to_text": True,
                "text_to_speech": True,
            },
            "supported_languages": [LANGUAGE_EN_IN, LANGUAGE_EN_US, LANGUAGE_KN_IN],
        }

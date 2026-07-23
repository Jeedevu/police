"""
Sarvam AI Speech-to-Text (STT) Service.
Integrates with Sarvam Saarika v2 model supporting 10 Indian languages:
  kn-IN, hi-IN, ta-IN, te-IN, ml-IN, mr-IN, bn-IN, gu-IN, pa-IN, en-IN
"""
import logging
import os
import httpx
from typing import Optional

from app.core.settings import settings

logger = logging.getLogger(__name__)

SUPPORTED_STT_LANGUAGES = {
    "kn-IN": "Kannada",
    "hi-IN": "Hindi",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "ml-IN": "Malayalam",
    "mr-IN": "Marathi",
    "bn-IN": "Bengali",
    "gu-IN": "Gujarati",
    "pa-IN": "Punjabi",
    "en-IN": "English",
    "unknown": "Auto-Detect",
}


class SarvamSTTService:
    """
    Wrapper for Sarvam AI Speech-to-Text API (https://api.sarvam.ai/speech-to-text).
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("SARVAM_API_KEY") or settings.SARVAM_API_KEY
        self.endpoint = settings.SARVAM_STT_URL

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str = "recording.webm",
        language_code: str = "kn-IN",
        model: str = "saarika:v2.5",
    ) -> dict:
        """
        Send recorded audio bytes to Sarvam STT API and return transcription.
        """
        if not self.is_configured():
            logger.warning("SARVAM_API_KEY is not configured. Falling back to local fallback.")
            return {
                "transcript": "Sarvam API key not set in environment. Please configure SARVAM_API_KEY in backend/.env",
                "language_code": language_code,
                "confidence": 0.0,
                "status": "unconfigured",
            }

        valid_lang = language_code if language_code in SUPPORTED_STT_LANGUAGES else "kn-IN"

        headers = {
            "api-subscription-key": self.api_key.strip(),
        }

        # Format files and form parameters for Sarvam STT
        files = {
            "file": (filename, audio_bytes, "audio/webm"),
        }
        data = {
            "model": model,
            "language_code": valid_lang if valid_lang != "unknown" else "kn-IN",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.endpoint, headers=headers, files=files, data=data)
                
                if response.status_code == 200:
                    res_json = response.json()
                    transcript = res_json.get("transcript", "")
                    logger.info(f"Sarvam STT success ({valid_lang}): {transcript[:60]}...")
                    return {
                        "transcript": transcript,
                        "language_code": valid_lang,
                        "confidence": res_json.get("confidence", 0.95),
                        "status": "success",
                    }
                else:
                    logger.error(f"Sarvam STT API error {response.status_code}: {response.text}")
                    return {
                        "transcript": f"Speech recognition error ({response.status_code})",
                        "error_detail": response.text,
                        "status": "error",
                    }
        except Exception as exc:
            logger.exception(f"Sarvam STT network/exception error: {exc}")
            return {
                "transcript": f"Failed to transcribe audio: {str(exc)}",
                "status": "failed",
            }


sarvam_stt_service = SarvamSTTService()

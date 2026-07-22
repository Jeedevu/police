"""
Sarvam AI Bulbul V3 Text-to-Speech (TTS) Service.
Synthesizes text into natural Indian language voice audio supporting 10 languages:
  kn-IN (Kannada), hi-IN (Hindi), ta-IN (Tamil), te-IN (Telugu), ml-IN (Malayalam),
  mr-IN (Marathi), bn-IN (Bengali), gu-IN (Gujarati), pa-IN (Punjabi), en-IN (English)
"""
import logging
import os
import re
import httpx
from typing import List, Optional

from app.core.settings import settings

logger = logging.getLogger(__name__)

SUPPORTED_TTS_LANGUAGES = {
    "kn-IN": {"name": "Kannada", "speaker": "roopa"},
    "hi-IN": {"name": "Hindi", "speaker": "anushka"},
    "ta-IN": {"name": "Tamil", "speaker": "kavitha"},
    "te-IN": {"name": "Telugu", "speaker": "kavya"},
    "ml-IN": {"name": "Malayalam", "speaker": "shruti"},
    "mr-IN": {"name": "Marathi", "speaker": "shreya"},
    "bn-IN": {"name": "Bengali", "speaker": "manisha"},
    "gu-IN": {"name": "Gujarati", "speaker": "vidya"},
    "pa-IN": {"name": "Punjabi", "speaker": "simran"},
    "en-IN": {"name": "English", "speaker": "kavya"},
}


class SarvamTTSService:
    """
    Wrapper for Sarvam AI Text-to-Speech Bulbul V3 API (https://api.sarvam.ai/text-to-speech).
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("SARVAM_API_KEY") or settings.SARVAM_API_KEY
        self.endpoint = settings.SARVAM_TTS_URL

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    @staticmethod
    def split_into_sentences(text: str) -> List[str]:
        """Split text into sentences for sentence-level low-latency streaming."""
        text = re.sub(r'[\*\#\_`]', '', text)  # Strip markdown symbols
        sentences = re.split(r'(?<=[.!?|॥\n])\s+', text)
        cleaned = [s.strip() for s in sentences if s and len(s.strip()) > 1]
        return cleaned or [text[:300]]

    async def text_to_speech(
        self,
        text: str,
        target_language_code: str = "kn-IN",
        speaker: Optional[str] = None,
        pace: float = 1.05,
        model: str = "bulbul:v3",
    ) -> dict:
        """
        Synthesize text into base64 WAV audio using Sarvam Bulbul V3.
        """
        if not self.is_configured():
            logger.warning("SARVAM_API_KEY is not configured for TTS.")
            return {
                "audios": [],
                "audio_urls": [],
                "status": "unconfigured",
                "message": "SARVAM_API_KEY not configured in backend/.env",
            }

        lang_code = target_language_code if target_language_code in SUPPORTED_TTS_LANGUAGES else "kn-IN"
        selected_speaker = speaker or SUPPORTED_TTS_LANGUAGES[lang_code]["speaker"]

        sentences = self.split_into_sentences(text)
        # Limit to max 3 sentences per batch for fast response
        payload_inputs = sentences[:3]

        headers = {
            "api-subscription-key": self.api_key.strip(),
            "Content-Type": "application/json",
        }

        payload = {
            "inputs": payload_inputs,
            "target_language_code": lang_code,
            "speaker": selected_speaker,
            "pace": pace,
            "speech_sample_rate": 22050,
            "enable_preprocessing": True,
            "model": model,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.endpoint, headers=headers, json=payload)
                if response.status_code == 200:
                    res_json = response.json()
                    raw_audios = res_json.get("audios", [])
                    audio_urls = [f"data:audio/wav;base64,{a}" for a in raw_audios]
                    logger.info(f"Sarvam TTS generated {len(audio_urls)} audio sentences for lang={lang_code}")
                    return {
                        "audios": raw_audios,
                        "audio_urls": audio_urls,
                        "language_code": lang_code,
                        "speaker": selected_speaker,
                        "sentences": payload_inputs,
                        "status": "success",
                    }
                else:
                    logger.error(f"Sarvam TTS API error {response.status_code}: {response.text}")
                    return {
                        "audios": [],
                        "audio_urls": [],
                        "error_detail": response.text,
                        "status": "error",
                    }
        except Exception as exc:
            logger.exception(f"Sarvam TTS exception: {exc}")
            return {
                "audios": [],
                "audio_urls": [],
                "status": "failed",
                "message": str(exc),
            }


sarvam_tts_service = SarvamTTSService()

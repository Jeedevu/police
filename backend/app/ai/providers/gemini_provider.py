"""
Google Gemini 2.5 Flash provider using the official google-genai SDK.
This is the PRIMARY provider for the KSP Crime Intelligence Platform.

Environment variables read:
  GOOGLE_API_KEY   (preferred)
  GEMINI_API_KEY   (alias)
  GEMINI_MODEL     (default: gemini-2.5-flash)
"""
import time
import logging
from typing import AsyncIterator, Optional

from google import genai
from google.genai import types

from app.ai.providers.provider_base import LLMProvider

logger = logging.getLogger(__name__)


class GeminiProvider(LLMProvider):
    """
    Google Gemini 2.5 Flash provider.

    Responsibilities:
      - Natural language understanding
      - Intent detection
      - SQL generation
      - Response formatting / summarisation
      - Conversation management
      - Case summarisation & evidence explanation
      - Investigation assistance

    NOT responsible for:
      - Database access (done separately via SQLAlchemy)
      - Direct SQL execution (handled by query_executor)
    """

    provider_name = "gemini"

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        if not api_key or api_key in ("your_gemini_api_key", ""):
            raise ValueError(
                "Gemini API key is not configured. "
                "Set GOOGLE_API_KEY or GEMINI_API_KEY in backend/.env"
            )
        self._api_key = api_key
        self._model = model
        self._client = genai.Client(api_key=api_key)
        logger.info(f"GeminiProvider initialised — model={model}")

    # ── Synchronous ──────────────────────────────────────────────────────────

    def ask(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
            max_output_tokens=max_tokens,
        )

        for attempt in range(3):
            try:
                response = self._client.models.generate_content(
                    model=self._model,
                    contents=prompt,
                    config=config,
                )
                return response.text

            except Exception as exc:
                err_str = str(exc)
                logger.warning(f"Gemini attempt {attempt + 1} failed: {err_str[:120]}")

                if any(k in err_str for k in ("API_KEY_INVALID", "API key not valid")):
                    raise ValueError(
                        "Invalid Gemini API key. Verify GOOGLE_API_KEY in backend/.env"
                    ) from exc

                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    raise RuntimeError("Gemini API quota exceeded (429 RESOURCE_EXHAUSTED). Please update GOOGLE_API_KEY in backend/.env") from exc

                if attempt < 2:
                    time.sleep(2 ** attempt)

        raise RuntimeError("Gemini service unavailable after 3 attempts.")

    # ── Async ─────────────────────────────────────────────────────────────────

    async def ask_async(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        import asyncio

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: self.ask(prompt, system_prompt, temperature, max_tokens),
        )

    # ── Streaming ─────────────────────────────────────────────────────────────

    async def stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """
        Yields text chunks as they arrive from the Gemini streaming API.
        Falls back to single-response if streaming unavailable.
        """
        import asyncio

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
            max_output_tokens=max_tokens,
        )

        try:
            loop = asyncio.get_event_loop()

            def _stream_sync():
                return self._client.models.generate_content_stream(
                    model=self._model,
                    contents=prompt,
                    config=config,
                )

            stream_iter = await loop.run_in_executor(None, _stream_sync)
            for chunk in stream_iter:
                if chunk.text:
                    yield chunk.text

        except Exception as exc:
            logger.warning(f"Gemini streaming failed, falling back: {exc}")
            result = await self.ask_async(prompt, system_prompt, temperature, max_tokens)
            yield result

    def health_check(self) -> dict:
        try:
            test = self._client.models.generate_content(
                model=self._model,
                contents="ping",
                config=types.GenerateContentConfig(max_output_tokens=5),
            )
            return {
                "provider": self.provider_name,
                "model": self._model,
                "status": "ok",
                "response_preview": (test.text or "")[:20],
            }
        except Exception as exc:
            return {"provider": self.provider_name, "status": "error", "error": str(exc)}

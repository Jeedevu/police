"""
OpenAI provider stub — future integration point.
Activate by setting AI_PROVIDER=openai and OPENAI_API_KEY in .env.
"""
import logging
from typing import Optional

from app.ai.providers.provider_base import LLMProvider

logger = logging.getLogger(__name__)


class OpenAIProvider(LLMProvider):
    provider_name = "openai"

    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self._api_key = api_key
        self._model = model
        logger.info(f"OpenAIProvider stub initialised — model={model}")

    def ask(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        # TODO: Implement with openai SDK when needed
        # from openai import OpenAI
        # client = OpenAI(api_key=self._api_key)
        # response = client.chat.completions.create(...)
        raise NotImplementedError(
            "OpenAI provider is not yet implemented. "
            "Set AI_PROVIDER=gemini in .env to use Gemini."
        )

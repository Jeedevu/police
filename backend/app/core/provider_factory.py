"""
Provider factory — returns the correct LLM provider instance based on AI_PROVIDER setting.
Import get_ai_provider() anywhere you need LLM access.
"""
import logging
from functools import lru_cache

from app.ai.providers.provider_base import LLMProvider

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_ai_provider() -> LLMProvider:
    """
    Returns a cached singleton provider based on settings.AI_PROVIDER.

    Switch providers by changing AI_PROVIDER in .env — no code changes required.
    Supported values: gemini | catalyst | openai
    """
    from app.core.settings import settings

    provider_name = settings.AI_PROVIDER.lower()
    logger.info(f"Initialising AI provider: {provider_name}")

    if provider_name == "gemini":
        from app.ai.providers.gemini_provider import GeminiProvider
        return GeminiProvider(
            api_key=settings.effective_gemini_key,
            model=settings.GEMINI_MODEL,
        )

    elif provider_name == "catalyst":
        from app.ai.providers.catalyst_provider import CatalystProvider
        return CatalystProvider(
            url=settings.CATALYST_URL,
            token=settings.CATALYST_TOKEN,
            org=settings.CATALYST_ORG,
        )

    elif provider_name == "openai":
        from app.ai.providers.openai_provider import OpenAIProvider
        return OpenAIProvider(api_key=settings.OPENAI_API_KEY)

    else:
        raise ValueError(
            f"Unknown AI_PROVIDER '{provider_name}'. "
            "Choose from: gemini, catalyst, openai"
        )

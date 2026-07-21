"""
catalyst_client.py — BACKWARD-COMPATIBLE shim.

All existing code that calls ask_llm() continues to work unchanged.
Internally, ask_llm() now delegates to the active AI provider
(configured via AI_PROVIDER in .env, default: gemini).

DO NOT remove this module — it is imported by:
  - app/ai/planner.py
  - app/ai/reasoning.py
  - app/ai/sql_generator.py
  - app/services/ai_service.py
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

DEFAULT_SYSTEM_PROMPT = "You are an expert PostgreSQL SQL generator for a crime investigation system."


def ask_llm(
    prompt: str,
    system_prompt: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
) -> str:
    """
    Backward-compatible LLM call.
    Routes to whichever provider is configured in settings.AI_PROVIDER.
    """
    from app.core.provider_factory import get_ai_provider

    provider = get_ai_provider()
    return provider.ask(
        prompt=prompt,
        system_prompt=system_prompt or DEFAULT_SYSTEM_PROMPT,
        temperature=temperature,
        max_tokens=max_tokens,
    )

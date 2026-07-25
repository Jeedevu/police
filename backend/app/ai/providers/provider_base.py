"""
Abstract base class for all LLM providers.
Any future provider (OpenAI, Anthropic, Vertex, etc.) must implement this interface.
"""
from abc import ABC, abstractmethod
from typing import AsyncIterator, Optional


class LLMProvider(ABC):
    """
    Provider contract. Implementing providers must expose:
      - ask()          → synchronous single-turn completion
      - ask_async()    → async single-turn completion
      - stream()       → async streaming generator
    """

    # Human-readable name, used in logs and API responses
    provider_name: str = "base"

    @abstractmethod
    def ask(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """Synchronous completion. Returns the full response text."""
        ...

    async def ask_async(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """Async completion. Default implementation wraps ask() — override for true async."""
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: self.ask(prompt, system_prompt, temperature, max_tokens),
        )

    async def stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """
        Streaming generator. Default falls back to single ask()
        and yields the full response as a single chunk.
        Override in providers that support native streaming.
        """
        result = await self.ask_async(prompt, system_prompt, temperature, max_tokens)
        yield result

    def health_check(self) -> dict:
        """Return provider health status."""
        return {"provider": self.provider_name, "status": "ok"}

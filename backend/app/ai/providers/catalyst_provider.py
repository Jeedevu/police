"""
Zoho Catalyst LLM provider (legacy / fallback).
Kept for backward compatibility — swap AI_PROVIDER=catalyst in .env to activate.
"""
import logging
from typing import Optional

import requests

from app.ai.providers.provider_base import LLMProvider

logger = logging.getLogger(__name__)

DEFAULT_SYSTEM = "You are an expert PostgreSQL SQL generator for a crime investigation system."


class CatalystProvider(LLMProvider):
    provider_name = "catalyst"

    def __init__(self, url: str, token: str, org: str):
        self._url = url
        self._token = token
        self._org = org

    def ask(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        headers = {
            "Authorization": f"Zoho-oauthtoken {self._token}",
            "CATALYST-ORG": self._org,
            "Content-Type": "application/json",
        }

        messages = [
            {"role": "system", "content": system_prompt or DEFAULT_SYSTEM},
            {"role": "user", "content": prompt},
        ]

        payload = {
            "model": "crm-di-glm47b_30b_it",
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
            "chat_template_kwargs": {"enable_thinking": True},
        }

        try:
            resp = requests.post(self._url, headers=headers, json=payload, timeout=60)
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
        except Exception as exc:
            logger.error(f"CatalystProvider error: {exc}")
            raise

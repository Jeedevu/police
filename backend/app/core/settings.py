"""
Centralized application settings using Pydantic BaseSettings.
All configuration is loaded from environment variables / .env file.

Railway provides DATABASE_URL as postgres:// — we coerce it to postgresql://.

v3.0 — Added full Catalyst services configuration block.
        All Catalyst env vars are declared here; they are read by the
        individual catalyst/* wrapper modules at runtime.
"""
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ksp_crime_ai"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_postgres_url(cls, v: str) -> str:
        """Railway uses postgres:// — SQLAlchemy requires postgresql://."""
        if v and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    # ── Server ────────────────────────────────────────────────────────────────
    PORT: int = 8000

    # ── AI Provider ───────────────────────────────────────────────────────────
    AI_PROVIDER: Literal["gemini", "catalyst", "openai"] = "gemini"
    GOOGLE_API_KEY: str = ""
    GEMINI_API_KEY: str = ""          # alias — falls back to GOOGLE_API_KEY
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # OpenAI (future)
    OPENAI_API_KEY: str = ""

    # ── Security / JWT ────────────────────────────────────────────────────────
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_use_openssl_rand_hex_32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    FRONTEND_URL: str = "https://police-tjrilmgj.onslate.in"
    EXTRA_CORS_ORIGINS: str = ""

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "https://police-tjrilmgj.onslate.in",
    ]

    @property
    def all_cors_origins(self) -> list[str]:
        """Merge static origins with dynamic FRONTEND_URL and EXTRA_CORS_ORIGINS env vars."""
        extras = [o.strip() for o in self.EXTRA_CORS_ORIGINS.split(",") if o.strip()]
        if self.FRONTEND_URL and self.FRONTEND_URL not in extras:
            extras.append(self.FRONTEND_URL.strip())
        return list(set(self.CORS_ORIGINS + extras))

    # ── App Meta ──────────────────────────────────────────────────────────────
    APP_TITLE: str = "KSP Crime Intelligence Platform"
    APP_VERSION: str = "3.0.0"
    DEBUG: bool = False

    @property
    def effective_gemini_key(self) -> str:
        """Return whichever Gemini key is set."""
        return self.GEMINI_API_KEY or self.GOOGLE_API_KEY

    # =========================================================================
    # ── Catalyst Services Configuration (v3.0) ───────────────────────────────
    # =========================================================================
    # Set all CATALYST_* vars in .env (dev) or Catalyst AppSail env vars (prod).
    # See backend/.env.catalyst.example for the full template.
    # TODO:CREDENTIALS — populate these before enabling Catalyst services.

    # ── Catalyst Core credentials ──────────────────────────────────────────────
    CATALYST_PROJECT_ID: str = ""      # Found in .catalystrc (already: 45574000000028001)
    CATALYST_PROJECT_KEY: str = ""     # Catalyst Console → Project → Keys
    CATALYST_CLIENT_ID: str = ""       # Zoho API Console → OAuth Client ID
    CATALYST_CLIENT_SECRET: str = ""   # Zoho API Console → OAuth Client Secret
    CATALYST_REFRESH_TOKEN: str = ""   # Generated via Zoho OAuth flow
    CATALYST_ENV: str = "development"  # "development" | "production"
    CATALYST_ORG_ID: str = ""          # Zoho Org ID (optional)

    # ── Catalyst File Store folder IDs ────────────────────────────────────────
    # Create folders in Catalyst Console → File Store, copy IDs here.
    # TODO:CREDENTIALS — set all folder IDs
    CATALYST_FILE_STORE_FOLDER_EVIDENCE_IMAGES: str = ""
    CATALYST_FILE_STORE_FOLDER_EVIDENCE_VIDEOS: str = ""
    CATALYST_FILE_STORE_FOLDER_EVIDENCE_AUDIO: str = ""
    CATALYST_FILE_STORE_FOLDER_FIR: str = ""
    CATALYST_FILE_STORE_FOLDER_CHARGESHEETS: str = ""
    CATALYST_FILE_STORE_FOLDER_COURT_ORDERS: str = ""
    CATALYST_FILE_STORE_FOLDER_FORENSIC: str = ""
    CATALYST_FILE_STORE_FOLDER_FINGERPRINTS: str = ""
    CATALYST_FILE_STORE_FOLDER_DNA: str = ""
    CATALYST_FILE_STORE_FOLDER_CCTV: str = ""
    CATALYST_FILE_STORE_FOLDER_WITNESS: str = ""
    CATALYST_FILE_STORE_FOLDER_MISC: str = ""

    # ── Catalyst Cache segment IDs ────────────────────────────────────────────
    # Create segments in Catalyst Console → Cache, copy IDs here.
    # TODO:CREDENTIALS — set all segment IDs
    CATALYST_CACHE_SEGMENT_DASHBOARD: str = ""
    CATALYST_CACHE_SEGMENT_OFFICER: str = ""
    CATALYST_CACHE_SEGMENT_ANALYTICS: str = ""
    CATALYST_CACHE_SEGMENT_HEATMAP: str = ""
    CATALYST_CACHE_SEGMENT_AI: str = ""
    CATALYST_CACHE_SEGMENT_SESSION: str = ""
    CATALYST_CACHE_SEGMENT_CASES: str = ""

    # ── Catalyst Mail ─────────────────────────────────────────────────────────
    # TODO:CREDENTIALS — verify sender address in Catalyst Console → Mail
    CATALYST_MAIL_FROM_ADDRESS: str = ""
    CATALYST_MAIL_FROM_NAME: str = "KSP Crime Intelligence Platform"

    # ── Catalyst QuickML model IDs (future) ───────────────────────────────────
    # TODO:CREDENTIALS (future) — train models in Catalyst Console → QuickML
    CATALYST_QUICKML_MODEL_RECIDIVISM: str = ""
    CATALYST_QUICKML_MODEL_CASETIME: str = ""
    CATALYST_QUICKML_MODEL_HOTSPOT: str = ""

    # ── Frontend URL (used in email reset links) ──────────────────────────────
    FRONTEND_URL: str = "http://localhost:5173"

    # ── Legacy Catalyst fields (backward compat, kept to avoid breakage) ──────
    CATALYST_URL: str = ""
    CATALYST_TOKEN: str = ""
    CATALYST_ORG: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


# Singleton — import this everywhere
settings = get_settings()

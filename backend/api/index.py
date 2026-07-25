"""
Vercel serverless entry point for KSP Crime Intelligence Platform.
NOTE: This is kept for reference but the recommended deployment is Railway
      (see backend/railway.toml) because the app uses PostgreSQL and long-
      running AI inference that exceed Vercel's 10-second serverless timeout.

To use this on Vercel you MUST set:
  - DATABASE_URL   → Neon/Supabase/Vercel Postgres connection string
  - GOOGLE_API_KEY → Gemini API key
  - SECRET_KEY     → Random 32-byte hex string
"""
import sys
import os

# Make the backend package importable from the api/ directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app  # noqa: F401 — Vercel needs the `app` name

# Vercel calls the `app` object directly
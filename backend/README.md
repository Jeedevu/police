# KSP Crime Intelligence Platform — Backend

FastAPI backend for the KSP Crime Intelligence Platform.
Deploy to Railway: https://railway.app

## Quick Deploy to Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub Repo  
   (or use Railway CLI: `railway up`)
2. Add a **PostgreSQL** plugin in Railway dashboard
3. Set these environment variables in Railway:

| Variable | Value |
|----------|-------|
| `GOOGLE_API_KEY` | Your Gemini API key |
| `SECRET_KEY` | Random 64-char hex (`openssl rand -hex 32`) |
| `AI_PROVIDER` | `gemini` |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `EXTRA_CORS_ORIGINS` | Your Vercel URL (e.g. `https://ksp.vercel.app`) |

Railway auto-provides `DATABASE_URL` when PostgreSQL plugin is added.

## Local Development

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Environment Variables

See `.env.example` for all required variables.

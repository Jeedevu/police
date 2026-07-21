"""
KSP Crime Intelligence Platform — FastAPI Application Entry Point
Version 3.0 — Catalyst-First Architecture

New in v3.0:
- Zoho Catalyst integration (13 service wrappers)
- Direct Catalyst File Store uploads for evidence files
- Automatic OCR (Zia) for uploaded image and PDF evidence
- Automatic Speech-to-Text (Zia) for uploaded audio evidence
- Push notifications via Catalyst Signals
- Transactional email delivery via Catalyst Mail
- Session caching via Catalyst Cache
- Persistent AI conversation history via Catalyst NoSQL
- DataStore audit logging & investigation logs
- Catalyst service health monitoring endpoint (/api/catalyst/health)
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.settings import settings
from app.database.connection import create_tables

# ── Existing routers (preserved) ──────────────────────────────────────────────
from app.api import (
    ai,
    investigation,
    cases,
    analytics,
    dashboard,
    fir,
    search,
    network,
    livekit_router,
    profile,
)

# ── v2.0 routers (preserved) ──────────────────────────────────────────────────
from app.auth.router import router as auth_router
from app.officers.router import router as officers_router
from app.cases.router import router as cases_router
from app.evidence.router import router as evidence_router
from app.reports.router import router as reports_router

# ── v3.0 Catalyst routers (new) ───────────────────────────────────────────────
from app.api.files import router as files_router
from app.api.ocr import router as ocr_router
from app.api.audio import router as audio_router
from app.api.notifications import router as notifications_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── Application factory ───────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_TITLE,
    description="""
## KSP Crime Intelligence Platform — Catalyst-First Architecture

Powered by Google Gemini 2.5 Flash + Zoho Catalyst Services | Karnataka State Police

### Core Features
- 🔐 JWT Authentication + Catalyst Auth Bridge
- 🗺️ Row-Level Security (jurisdiction-based PostgreSQL filtering)
- 🤖 AI Chat Pipeline (Intent → SQL → Execute → Format) with NoSQL history
- 📊 Analytics Dashboard with Crime Heatmaps & Cache
- 📁 Evidence Management with Catalyst File Store
- 👁️ Zia OCR for document & image text extraction
- 🎙️ Zia Speech-to-Text & Text-to-Speech audio support
- 🔔 Push Notifications (Signals) & Mail Delivery
- 👮 Officers Hierarchy & Transfer Management
- 📄 AI-Generated Investigation Reports (SmartBrowz PDF)

### Active AI Provider
Gemini 2.5 Flash (google-genai SDK)
""",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "Authentication", "description": "Login, logout, token refresh, Catalyst auth bridge"},
        {"name": "Officers", "description": "Officer management, transfers, promotions"},
        {"name": "Cases", "description": "Case CRUD with jurisdiction filtering"},
        {"name": "Evidence", "description": "Evidence management, File Store upload, OCR/STT status"},
        {"name": "Files", "description": "Catalyst File Store direct download, metadata, deletion"},
        {"name": "OCR", "description": "Catalyst Zia OCR text extraction from images & PDFs"},
        {"name": "Audio", "description": "Catalyst Zia Speech-to-Text transcription & TTS synthesis"},
        {"name": "Notifications", "description": "Catalyst Signals push subscriptions & DataStore notifications"},
        {"name": "AI", "description": "AI chat, SQL query, investigation assistance"},
        {"name": "Analytics", "description": "Crime trends, heatmaps, performance"},
        {"name": "Reports", "description": "SmartBrowz PDF report generation"},
        {"name": "Dashboard", "description": "Platform statistics"},
        {"name": "Investigation", "description": "Deep case investigation"},
        {"name": "Criminal Profile", "description": "Suspect profile analysis"},
    ],
)

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.all_cors_origins,
    allow_origin_regex=r"https://.*\.ngrok-free\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    logger.info("Starting KSP Crime Intelligence Platform v3.0 (Catalyst Architecture)")
    create_tables()

    # Create default admin officer if none exists
    _seed_default_admin()

    # Validate / log Catalyst configuration
    from app.catalyst.config import validate_catalyst_config
    validate_catalyst_config()

    logger.info(f"AI Provider: {settings.AI_PROVIDER}")
    logger.info("Application ready ✓")


def _seed_default_admin():
    """Create a default admin account if no officers exist."""
    try:
        from app.database.connection import SessionLocal
        from app.auth.models import Officer
        from app.auth.service import hash_password

        db = SessionLocal()
        try:
            count = db.query(Officer).count()
            if count == 0:
                admin = Officer(
                    email="admin@ksp.gov.in",
                    hashed_password=hash_password("Admin@123"),
                    full_name="System Administrator",
                    badge_number="KSP-ADMIN-001",
                    role="ADMIN",
                    is_active=True,
                )
                db.add(admin)
                db.commit()
                logger.info("✓ Default admin created: admin@ksp.gov.in / Admin@123")
        finally:
            db.close()
    except Exception as exc:
        logger.warning(f"Could not seed default admin: {exc}")


# ── Route registration ────────────────────────────────────────────────────────

# Core application routers
app.include_router(auth_router)
app.include_router(officers_router)
app.include_router(cases_router)
app.include_router(evidence_router)
app.include_router(reports_router)

# v3.0 Catalyst API routers
app.include_router(files_router)
app.include_router(ocr_router)
app.include_router(audio_router)
app.include_router(notifications_router)

# Existing analytics & AI routers
app.include_router(ai.router)
app.include_router(investigation.router)
app.include_router(cases.router)         # legacy /cases routes
app.include_router(analytics.router)
app.include_router(dashboard.router)
app.include_router(fir.router)
app.include_router(search.router)
app.include_router(network.router)
app.include_router(livekit_router.router)
app.include_router(profile.router)


# ── System / Health routes ───────────────────────────────────────────────────

@app.get("/", tags=["System"])
def root():
    from app.catalyst.config import is_catalyst_available
    return {
        "message": "Welcome to KSP Crime Intelligence Platform",
        "version": settings.APP_VERSION,
        "ai_provider": settings.AI_PROVIDER,
        "catalyst_enabled": is_catalyst_available(),
        "status": "healthy",
        "docs": "/docs",
    }


@app.get("/health", tags=["System"])
def health():
    return {"status": "healthy", "version": settings.APP_VERSION}


@app.get("/api/catalyst/health", tags=["System"])
def catalyst_health():
    """
    Consolidated health check for all 13 Catalyst service wrappers.

    Returns the status and availability of:
    config, auth, datastore, nosql, filestore, cache, zia,
    quickml, smartbrowz, signals, mail, scheduler, connections.
    """
    from app.catalyst.config import catalyst_health_check
    return catalyst_health_check()
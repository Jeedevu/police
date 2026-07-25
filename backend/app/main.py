"""
KSP Crime Intelligence Platform — FastAPI Application Entry Point
Version 3.0 — Catalyst-First Architecture
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.settings import settings
from app.database.connection import create_tables

# ── Existing routers ──────────────────────────────────────────────────────────
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

# ── Auth & Domain routers ─────────────────────────────────────────────────────
from app.auth.router import router as auth_router
from app.officers.router import router as officers_router
from app.cases.router import router as cases_router
from app.evidence.router import router as evidence_router
from app.reports.router import router as reports_router

# ── Catalyst API routers ──────────────────────────────────────────────────────
from app.api.files import router as files_router
from app.api.ocr import router as ocr_router
from app.api.audio import router as audio_router
from app.api.notifications import router as notifications_router
from app.api.sarvam import router as sarvam_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── 1. Application Initialization ─────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_TITLE,
    description="KSP Crime Intelligence Platform — Production API",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── 2. CORS Middleware (Added immediately after app init, BEFORE any routers) ──

cors_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://police-zspzdnmz.onslate.in",
]

# Dynamically append any extra origins configured via environment variables
for origin in settings.all_cors_origins:
    if origin and origin not in cors_origins:
        cors_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.onslate\.in",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ── 3. Startup Event ───────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    logger.info("Starting KSP Crime Intelligence Platform v3.0 (Catalyst Architecture)")
    create_tables()

    # Create default admin officer if none exists
    _seed_default_admin()

    # Validate / log Catalyst configuration
    from app.catalyst.config import validate_catalyst_config
    validate_catalyst_config()

    logger.info(f"CORS Enabled for Origins: {cors_origins}")
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


# ── 4. Route Registration (Included AFTER CORSMiddleware) ─────────────────────

# Authentication & Officer Management
app.include_router(auth_router)
app.include_router(officers_router, prefix="/api/officers")
app.include_router(officers_router, prefix="/officers")

# Domain Routers
app.include_router(cases_router)
app.include_router(evidence_router)
app.include_router(reports_router)

# Catalyst & Sarvam Speech API Routers
app.include_router(files_router)
app.include_router(ocr_router)
app.include_router(audio_router)
app.include_router(notifications_router)
app.include_router(sarvam_router)

# Legacy Analytics & AI Routers
app.include_router(ai.router)
app.include_router(investigation.router)
app.include_router(cases.router)
app.include_router(analytics.router, prefix="/api/analytics")
app.include_router(analytics.router, prefix="/analytics")
app.include_router(dashboard.router)
app.include_router(fir.router)
app.include_router(search.router)
app.include_router(network.router)
app.include_router(livekit_router.router)
app.include_router(profile.router)


# ── 5. Health & Root Endpoints ────────────────────────────────────────────────

@app.get("/", tags=["System"])
def root():
    from app.catalyst.config import is_catalyst_available
    return {
        "message": "Welcome to KSP Crime Intelligence Platform",
        "version": settings.APP_VERSION,
        "ai_provider": settings.AI_PROVIDER,
        "catalyst_enabled": is_catalyst_available(),
        "status": "healthy",
        "cors": "enabled",
        "docs": "/docs",
    }


@app.get("/health", tags=["System"])
def health():
    """Health check endpoint requested by spec."""
    return {
        "status": "ok",
        "cors": "enabled"
    }


@app.get("/version", tags=["System"])
def version():
    return {
        "version": settings.APP_VERSION,
        "app": settings.APP_TITLE,
        "ai_provider": settings.AI_PROVIDER,
        "environment": "production" if not settings.DEBUG else "development",
    }


@app.get("/api/catalyst/health", tags=["System"])
def catalyst_health():
    """Consolidated health check for all 13 Catalyst service wrappers."""
    from app.catalyst.config import catalyst_health_check
    return catalyst_health_check()
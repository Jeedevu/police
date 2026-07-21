# ==============================================================================
# KSP Crime Intelligence Platform — Production Dockerfile
# Optimized for Zoho Catalyst AppSail and containerized deployments
# ==============================================================================

FROM python:3.11-slim as builder

# Prevent Python from writing .pyc files & buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install build tools and PostgreSQL client headers
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies list and install wheels
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ── Production Image ─────────────────────────────────────────────────────────
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install runtime dependencies (libpq for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed site-packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source code
COPY . .

# Create non-root user for security
RUN useradd -m kspuser && chown -R kspuser:kspuser /app
USER kspuser

EXPOSE 8000

# Health check for Catalyst AppSail / Container orchestrator
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Start Uvicorn server bound to 0.0.0.0:${PORT}
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]

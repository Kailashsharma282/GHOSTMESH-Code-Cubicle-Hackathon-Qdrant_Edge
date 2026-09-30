# ==============================================================================
# GHOSTMESH API BACKEND DOCKERFILE (Production Multi-Stage)
# ==============================================================================

FROM python:3.12-slim AS builder

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Pre-download FastEmbed model during build so container runs 100% air-gapped / offline
RUN python -c "from fastembed import TextEmbedding; print('Pre-downloading FastEmbed model...'); TextEmbedding(model_name='BAAI/bge-small-en-v1.5')"

# ------------------------------------------------------------------------------
# Production Runner Stage
# ------------------------------------------------------------------------------
FROM python:3.12-slim AS runner

WORKDIR /app

# Install runtime dependencies (curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 ghostmesh && \
    mkdir -p /app/data && \
    chown -R ghostmesh:ghostmesh /app

# Copy installed python packages from builder
COPY --from=builder /root/.local /home/ghostmesh/.local
# Copy pre-downloaded FastEmbed model cache
COPY --from=builder /root/.cache /home/ghostmesh/.cache

ENV PATH=/home/ghostmesh/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENVIRONMENT=production \
    HOST=0.0.0.0 \
    PORT=8088 \
    EDGE_DATA_DIR=/app/data

# Copy application source
COPY --chown=ghostmesh:ghostmesh apps /app/apps
COPY --chown=ghostmesh:ghostmesh scripts /app/scripts

USER ghostmesh

EXPOSE 8088

# Production Container Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1:8088/health || exit 1

# Start Uvicorn production server
CMD ["python", "-m", "uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8088", "--workers", "1"]

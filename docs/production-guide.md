# GhostMesh Production Deployment & Operations Guide

> **Target**: DevOps Engineers, SREs, Enterprise Architects & Security Auditors.  
> **Classification**: Production Deployment Manual for Distributed Semantic Memory.

---

## 1. Production Architecture Overview

In production, GhostMesh operates as a hybrid edge-cloud architecture:

```
                            [Internet / Field Clients]
                                       │
                               HTTPS (Port 443) / WSS
                                       ▼
                       ┌───────────────────────────────┐
                       │   FRONTEND REVERSE PROXY      │
                       │   (Nginx 1.27 + Static SPA)   │
                       └───────────────┬───────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
      /api/ REST Requests                        /ws/ WebSocket Stream
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       ▼
                       ┌───────────────────────────────┐
                       │    GHOSTMESH API RUNNER       │
                       │    (FastAPI + Python 3.12)    │
                       └───────────────┬───────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│  EDGE SHARD A    │          │  EDGE SHARD B    │          │  EDGE SHARD C    │
│ Persistent Vol   │          │ Persistent Vol   │          │ Persistent Vol   │
│ data/device-a/   │          │ data/device-b/   │          │ data/device-c/   │
└────────┬─────────┘          └────────┬─────────┘          └────────┬─────────┘
         │                             │                             │
         └─────────────────────────────┼─────────────────────────────┘
                                       │
                         Outbound Allowed Sync (HTTPS/TLS)
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │   QDRANT CLOUD / SERVER       │
                       │ Managed Cloud Cluster or Pod  │
                       │    `ghostmesh_memories`       │
                       └───────────────────────────────┘
```

---

## 2. Complete Environment Variable Reference

| Variable | Type | Default | Production Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | string | `development` | `production` | Enables production safeguards, strict logging, and disables debug endpoints. |
| `HOST` | string | `0.0.0.0` | `0.0.0.0` | Network interface to bind the API server. |
| `PORT` | integer | `8088` | `8088` | Port for the backend API runner. |
| `LOG_LEVEL` | string | `INFO` | `INFO` or `WARNING` | Structured logging verbosity level. |
| `CORS_ORIGINS` | string | `*` | `https://your-domain.com` | Comma-separated list of allowed origins. Never use `*` in public production. |
| `GHOSTMESH_API_KEY` | string | `None` | *Secure random string* | Optional Bearer token required for ingest/reset routes. |
| `QDRANT_URL` | string | `http://localhost:6333`| `https://xyz.cloud.qdrant.io:6333` | Endpoint of central Qdrant Server or managed Qdrant Cloud. |
| `QDRANT_API_KEY` | string | `None` | *Qdrant API Key* | API key for managed Qdrant Cloud cluster. |
| `CLOUD_COLLECTION` | string | `ghostmesh_memories` | `ghostmesh_memories` | Target collection name in the cloud vector store. |
| `EDGE_DATA_DIR` | string | `./data` | `/app/data` (persistent mount) | Physical disk path where isolated device shards and SQLite databases reside. |
| `EMBEDDING_MODEL` | string | `BAAI/bge-small-en-v1.5` | `BAAI/bge-small-en-v1.5` | FastEmbed ONNX embedding model name. |
| `FASTEMBED_CACHE_DIR`| string | `None` | `/home/ghostmesh/.cache` | Pre-populated ONNX model cache for air-gapped deployments. |
| `RECONCILIATION_THRESHOLD` | float | `0.78` | `0.78` | Cosine similarity threshold for candidate conflict clustering. |
| `DUPLICATE_THRESHOLD` | float | `0.93` | `0.93` | Cosine similarity threshold for automated canonical merge synthesis. |
| `VITE_API_BASE_URL` | string | `""` | `""` or `https://api.domain.com` | Client-side API root. Blank when proxied via Nginx. |
| `VITE_WS_URL` | string | `""` | `""` or `wss://api.domain.com/ws/events` | Client-side WebSocket URL. |

---

## 3. Deployment Options

### Option A: Production Docker Compose (Recommended for VMs / On-Prem)

GhostMesh includes a hardened production compose specification: [`docker-compose.prod.yml`](file:///c:/Users/kaila/OneDrive/Desktop/Projects/GHOSTMESH-Code-Cubicle-Hackathon-Qdrant_Edge/docker-compose.prod.yml).

#### Features:
1. **Resource Quotas**: Hard CPU limits (2.0 cores for API, 2.0 cores for Qdrant) and memory limits (3GB API, 4GB Qdrant) preventing OOM runaway.
2. **Security Controls**: Non-root user execution (`ghostmesh:1000`), `no-new-privileges:true`.
3. **Log Rotation**: Built-in JSON-file log rotation capped at 50MB $\times$ 5 files to protect disk space.
4. **Network Segregation**: Separate internal backend network (`mesh_backend`) for Qdrant and public ingress network (`mesh_frontend`) for Nginx.

#### Execution:
```bash
# 1. Configure production environment
cp .env.example .env
nano .env

# 2. Build and launch containers
docker compose -f docker-compose.prod.yml up -d --build

# 3. Verify health
docker compose -f docker-compose.prod.yml ps
curl -f http://127.0.0.1:8088/health
```

---

### Option B: Managed Qdrant Cloud + Cloud Run / ECS

When using [Qdrant Cloud](https://cloud.qdrant.io/):
1. Provision a Qdrant Cloud cluster in your preferred cloud provider and region (AWS, GCP, Azure).
2. Set `QDRANT_URL=https://<cluster-id>.<region>.<cloud>.cloud.qdrant.io:6333`.
3. Set `QDRANT_API_KEY=<your-secret-api-key>`.
4. Mount persistent storage (EFS or persistent volume) for `EDGE_DATA_DIR` so edge node shards survive container restarts.
5. Deploy `apps/api/Dockerfile` and `apps/frontend/Dockerfile` as container services.

---

### Option C: Air-Gapped / Offline Vehicle Deployment

GhostMesh is designed to run in environments with zero internet connectivity (mining, defense, naval, remote fieldwork):
1. **Pre-baked Models**: `apps/api/Dockerfile` automatically downloads the FastEmbed ONNX model (`BAAI/bge-small-en-v1.5`) during the build stage into `/home/ghostmesh/.cache`.
2. **Zero Runtime Callouts**: The container never makes outbound HTTP requests to HuggingFace or external vector providers at runtime.
3. **Local Shard Autonomy**: If the cloud is never available, the node retains 100% of its indexing, local search, and offline querying capabilities forever.

---

## 4. Healthcheck & Kubernetes Readiness Probes

GhostMesh exposes a production health probe at `GET /health`:

```json
{
  "status": "HEALTHY",
  "version": "1.0.0",
  "environment": "production",
  "uptime_seconds": 1284.5,
  "checks": {
    "edge_nodes": {
      "status": "HEALTHY",
      "nodes": {
        "device-a": { "status": "ONLINE", "memory_count": 117, "sync_queue_pending": 0, "storage_ok": true },
        "device-b": { "status": "ONLINE", "memory_count": 102, "sync_queue_pending": 0, "storage_ok": true },
        "device-c": { "status": "ONLINE", "memory_count": 98, "sync_queue_pending": 0, "storage_ok": true }
      }
    },
    "qdrant_cloud": {
      "status": "CONNECTED",
      "mode": "Qdrant Server (http://localhost:6333)",
      "url": "http://localhost:6333",
      "collection": "ghostmesh_memories",
      "points_count": 99
    },
    "embedding_engine": {
      "status": "READY",
      "model": "BAAI/bge-small-en-v1.5",
      "dimension": 384
    },
    "storage": {
      "status": "HEALTHY",
      "path": "/app/data",
      "writable": true
    }
  }
}
```

### Kubernetes Probe Spec:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8088
  initialDelaySeconds: 15
  periodSeconds: 20
  timeoutSeconds: 5
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /health
    port: 8088
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 2
```

---

## 5. Security & Privacy Hardening Checklist

- [x] **Zero Cloud Egress for `LOCAL_ONLY`**: Memory marked `LOCAL_ONLY` (passwords, PINs, biometrics) is filtered out before outbound queue processing and never sent to Qdrant Cloud or WebSockets.
- [x] **CORS Origin Whitelisting**: Configure `CORS_ORIGINS` to specify exact production domains.
- [x] **Single-Process Shard Locks**: `portalocker` ensures single-writer integrity for embedded Qdrant Edge directories.
- [x] **Idempotent Ingestion**: Deterministic UUIDv5 identifiers prevent duplicate cloud records during network retries.
- [x] **Security Headers**: Production Nginx configuration enforces `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`.

---

## 6. Pre-Flight Production Verification Script

Before promoting any release to production, run the automated auditor:
```bash
python scripts/prod_check.py
```
This script audits configuration, file permissions, ONNX embeddings, Qdrant connectivity, live healthchecks, and frontend artifacts, returning exit code `0` on success.

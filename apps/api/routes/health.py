import time
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from apps.api.config import settings
from apps.api.cloud.qdrant_cloud import cloud_client
from apps.api.edge.edge_manager import edge_manager
from apps.api.embeddings.provider import embedding_provider
from apps.api.db.database import central_db

router = APIRouter(tags=["Health & Diagnostics"])

START_TIME = time.time()

@router.get("/health")
@router.get("/api/health")
async def health_check():
    """
    Comprehensive Kubernetes / Docker production health check and readiness probe.
    Returns 200 OK when core edge engine and storage are healthy.
    """
    now = time.time()
    uptime_sec = round(now - START_TIME, 1)
    
    # 1. Check Edge Nodes
    edge_status = {}
    all_edge_healthy = True
    for dev_id, node in edge_manager.nodes.items():
        try:
            cnt = node.store.count_memories()
            q_depth = len(node.sync_queue.get_pending())
            edge_status[dev_id] = {
                "status": node.status.value,
                "memory_count": cnt,
                "sync_queue_pending": q_depth,
                "storage_ok": True
            }
        except Exception as e:
            all_edge_healthy = False
            edge_status[dev_id] = {
                "status": "ERROR",
                "error": str(e),
                "storage_ok": False
            }
            
    # 2. Check Cloud Client
    cloud_ok = cloud_client.is_connected
    cloud_points = 0
    if cloud_ok:
        try:
            cloud_points = cloud_client.count_memories()
        except Exception:
            cloud_ok = False
            
    # 3. Check Embedding Provider
    embedding_ok = embedding_provider.dimension == settings.VECTOR_DIM
    
    # 4. Storage check
    data_dir_writable = False
    try:
        settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
        test_file = settings.DATA_DIR / ".health_probe"
        test_file.write_text("ok")
        test_file.unlink()
        data_dir_writable = True
    except Exception:
        data_dir_writable = False
        
    is_healthy = all_edge_healthy and embedding_ok and data_dir_writable
    http_status = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(
        status_code=http_status,
        content={
            "status": "HEALTHY" if is_healthy else "DEGRADED",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "uptime_seconds": uptime_sec,
            "checks": {
                "edge_nodes": {
                    "status": "HEALTHY" if all_edge_healthy else "ERROR",
                    "nodes": edge_status
                },
                "qdrant_cloud": {
                    "status": "CONNECTED" if cloud_ok else "DISCONNECTED",
                    "mode": cloud_client.connection_mode,
                    "url": settings.QDRANT_URL,
                    "collection": settings.CLOUD_COLLECTION,
                    "points_count": cloud_points
                },
                "embedding_engine": {
                    "status": "READY" if embedding_ok else "ERROR",
                    "model": settings.EMBEDDING_MODEL,
                    "dimension": settings.VECTOR_DIM
                },
                "storage": {
                    "status": "HEALTHY" if data_dir_writable else "ERROR",
                    "path": str(settings.DATA_DIR),
                    "writable": data_dir_writable
                },
                "database": central_db.get_status()
            }
        }
    )

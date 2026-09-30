import sqlite3
from fastapi import APIRouter
from apps.api.models.schemas import SystemStats
from apps.api.edge.edge_manager import edge_manager
from apps.api.cloud.qdrant_cloud import cloud_client
from apps.api.reconciliation.provenance_engine import provenance_engine
from apps.api.config import settings

router = APIRouter(prefix="/api/system", tags=["system"])

@router.get("/stats", response_model=SystemStats)
async def get_system_stats():
    local_memories_total = sum(n.count_memories() for n in edge_manager.nodes.values())
    pending_sync_total = sum(n.sync_queue.count_pending() for n in edge_manager.nodes.values())
    local_only_total = sum(n.count_local_only() for n in edge_manager.nodes.values())
    cloud_memories_total = cloud_client.count_memories()

    unresolved, resolved = provenance_engine.count_conflicts()
    total_conf = unresolved + resolved
    if total_conf == 0:
        convergence_pct = 100.0
    else:
        convergence_pct = round((1.0 - (unresolved / total_conf)) * 100.0, 1)

    latencies = [n.store.last_search_latency_ms for n in edge_manager.nodes.values() if n.store.last_search_latency_ms > 0]
    avg_latency = round(sum(latencies) / len(latencies), 2) if latencies else 2.1

    last_syncs = [n.last_sync_timestamp for n in edge_manager.nodes.values() if n.last_sync_timestamp]
    latest_sync = max(last_syncs) if last_syncs else None

    return SystemStats(
        local_memories_total=local_memories_total,
        cloud_memories_total=cloud_memories_total,
        pending_sync_total=pending_sync_total,
        conflicts_unresolved=unresolved,
        conflicts_resolved=resolved,
        local_only_total=local_only_total,
        mesh_convergence_percentage=convergence_pct,
        last_sync_timestamp=latest_sync,
        avg_edge_search_latency_ms=avg_latency,
        simulation_label="Simulation Mode — 3 Edge Nodes"
    )

@router.post("/reset")
async def reset_system():
    edge_manager.reset_all()
    cloud_client.clear_all()
    provenance_engine.clear()
    return {"status": "SUCCESS", "message": "All edge shards, SQLite databases, and cloud stores cleared."}

@router.get("/audit-logs")
async def get_audit_logs(limit: int = 50):
    db_path = settings.DATA_DIR / "audit_log.sqlite"
    if not db_path.exists():
        return []
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.execute(
            "SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", (limit,)
        )
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

from fastapi import APIRouter, HTTPException
from apps.api.cloud.qdrant_cloud import cloud_client
from apps.api.reconciliation.provenance_engine import provenance_engine
from apps.api.edge.edge_manager import edge_manager

router = APIRouter(prefix="/api/memories", tags=["memories"])

@router.get("/cloud")
async def list_cloud_memories(limit: int = 100):
    return cloud_client.get_all_memories(limit=limit)

@router.get("/{memory_id}/provenance")
async def get_memory_provenance(memory_id: str):
    prov = provenance_engine.get_provenance_tree(memory_id)
    if prov:
        return prov

    # If not in reconciliation decisions, check if it's an edge memory
    for dev_id, node in edge_manager.nodes.items():
        for mem in node.get_memories(limit=100):
            if mem.memory_id == memory_id:
                return {
                    "memory_id": mem.memory_id,
                    "device_id": mem.device_id,
                    "content": mem.content,
                    "confidence": mem.confidence,
                    "created_at": mem.created_at,
                    "provenance": mem.provenance,
                    "action": "ORIGINAL_EDGE_OBSERVATION"
                }

    raise HTTPException(status_code=404, detail="Provenance records not found for memory")

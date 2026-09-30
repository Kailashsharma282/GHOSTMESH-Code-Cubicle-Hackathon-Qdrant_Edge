from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from apps.api.models.schemas import (
    DeviceState,
    DeviceStatus,
    MemoryCreate,
    MemoryRecord,
    SearchResultItem,
    SyncQueueItem,
)
from apps.api.edge.edge_manager import edge_manager
from apps.api.sync.sync_manager import sync_manager

router = APIRouter(prefix="/api/devices", tags=["devices"])

class SearchPayload(BaseModel):
    query: str
    limit: int = 10
    score_threshold: float = 0.0

@router.get("", response_model=list[DeviceState])
async def list_devices():
    return edge_manager.get_all_states()

@router.get("/{device_id}", response_model=DeviceState)
async def get_device(device_id: str):
    node = edge_manager.get_node(device_id)
    if not node:
        raise HTTPException(status_code=404, detail="Device not found")
    return node.get_state()

@router.post("/{device_id}/connect")
async def connect_device(device_id: str, background_tasks: BackgroundTasks):
    node = edge_manager.get_node(device_id)
    if not node:
        raise HTTPException(status_code=404, detail="Device not found")
    await edge_manager.set_connectivity(device_id, DeviceStatus.ONLINE)
    # Drain sync queue in background upon reconnection
    background_tasks.add_task(sync_manager.sync_device, device_id)
    return {"device_id": device_id, "status": "ONLINE", "message": "Device reconnected. Outbound sync triggered."}

@router.post("/{device_id}/disconnect")
async def disconnect_device(device_id: str):
    node = edge_manager.get_node(device_id)
    if not node:
        raise HTTPException(status_code=404, detail="Device not found")
    await edge_manager.set_connectivity(device_id, DeviceStatus.OFFLINE)
    return {"device_id": device_id, "status": "OFFLINE", "message": "Network link severed. Running in autonomous local mode."}

@router.get("/{device_id}/memories", response_model=list[MemoryRecord])
async def get_device_memories(device_id: str, limit: int = 100):
    node = edge_manager.get_node(device_id)
    if not node:
        raise HTTPException(status_code=404, detail="Device not found")
    return node.get_memories(limit=limit)

@router.post("/{device_id}/memories", response_model=MemoryRecord)
async def create_memory(device_id: str, req: MemoryCreate, background_tasks: BackgroundTasks):
    node = edge_manager.get_node(device_id)
    if not node:
        raise HTTPException(status_code=404, detail="Device not found")
    record = await node.ingest_memory(req)
    
    # If device is ONLINE and memory is syncable, trigger background sync
    if node.status == DeviceStatus.ONLINE and record.privacy_tier.value != "LOCAL_ONLY":
        background_tasks.add_task(sync_manager.sync_device, device_id)

    return record

@router.post("/{device_id}/search", response_model=list[SearchResultItem])
async def search_device_memories(device_id: str, payload: SearchPayload):
    node = edge_manager.get_node(device_id)
    if not node:
        raise HTTPException(status_code=404, detail="Device not found")
    return node.search_local(
        query=payload.query,
        limit=payload.limit,
        score_threshold=payload.score_threshold
    )

@router.get("/{device_id}/sync-queue", response_model=list[SyncQueueItem])
async def get_device_sync_queue(device_id: str, limit: int = 50):
    node = edge_manager.get_node(device_id)
    if not node:
        raise HTTPException(status_code=404, detail="Device not found")
    return node.sync_queue.get_all_items(limit=limit)

@router.post("/{device_id}/sync")
async def trigger_device_sync(device_id: str):
    synced, blocked, message = await sync_manager.sync_device(device_id)
    return {
        "device_id": device_id,
        "synced": synced,
        "blocked": blocked,
        "message": message
    }

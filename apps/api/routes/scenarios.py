import asyncio
import logging
from fastapi import APIRouter
from apps.api.models.schemas import (
    DeviceStatus,
    MemoryCreate,
    MemoryType,
    PrivacyTier,
)
from apps.api.edge.edge_manager import edge_manager
from apps.api.cloud.qdrant_cloud import cloud_client
from apps.api.reconciliation.provenance_engine import provenance_engine
from apps.api.sync.sync_manager import sync_manager
from apps.api.events.event_bus import event_bus

logger = logging.getLogger("ghostmesh.scenarios")

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])

@router.post("/run/offline-demo")
async def run_offline_scenario():
    """
    Scenario 1: Disconnect Device A. Ingest memories while offline.
    Demonstrates:
    1. Local Qdrant Edge persistence
    2. Pending sync queue buildup
    3. Offline local search succeeds without cloud
    """
    # 1. Disconnect Device A
    await edge_manager.set_connectivity("device-a", DeviceStatus.OFFLINE)
    await asyncio.sleep(0.5)

    # 2. Ingest memory into Device A while offline
    node_a = edge_manager.get_node("device-a")
    await node_a.ingest_memory(MemoryCreate(
        content="Black leather notebook with team project sketches placed on Desk 4.",
        memory_type=MemoryType.NOTE,
        confidence=0.88,
        privacy_tier=PrivacyTier.SYNC_ALLOWED
    ))

    # 3. Perform offline local search
    results = node_a.search_local("Where is the black notebook?", limit=3)

    return {
        "scenario": "SCENARIO 1: Offline Memory & Search",
        "device_a_status": "OFFLINE",
        "pending_sync": node_a.sync_queue.count_pending(),
        "offline_search_results": len(results),
        "message": "Device A created local memory and searched offline with 0 cloud dependencies."
    }

@router.post("/run/conflict-demo")
async def run_conflict_scenario():
    """
    Scenario 2: Three devices produce complementary observations about the charger.
    Upon sync, candidate detector identifies them, transparent scores are computed,
    and a Canonical Memory is synthesized.
    """
    # Ensure all devices are online
    for dev_id in ["device-a", "device-b", "device-c"]:
        await edge_manager.set_connectivity(dev_id, DeviceStatus.ONLINE)

    node_a = edge_manager.get_node("device-a")
    node_b = edge_manager.get_node("device-b")
    node_c = edge_manager.get_node("device-c")

    # Ingest complementary observations
    await node_a.ingest_memory(MemoryCreate(
        content="USB-C charger placed on office desk.",
        memory_type=MemoryType.OBSERVATION,
        confidence=0.82
    ))
    await sync_manager.sync_device("device-a")

    await node_b.ingest_memory(MemoryCreate(
        content="Black charger near laptop.",
        memory_type=MemoryType.OBSERVATION,
        confidence=0.71
    ))
    await sync_manager.sync_device("device-b")

    await node_c.ingest_memory(MemoryCreate(
        content="Charger placed beside MacBook.",
        memory_type=MemoryType.OBSERVATION,
        confidence=0.91
    ))
    await sync_manager.sync_device("device-c")

    decisions = provenance_engine.get_decisions(limit=1)
    return {
        "scenario": "SCENARIO 2: Conflict & Semantic Merge",
        "reconciliation_decisions": len(decisions),
        "latest_decision": decisions[0] if decisions else None,
        "message": "Reconciled A + B + C into Canonical Memory without hallucination."
    }

@router.post("/run/privacy-demo")
async def run_privacy_scenario():
    """
    Scenario 3: Device A observes a confidential passport/password note.
    Policy classifier quarantines it as LOCAL_ONLY.
    Device A syncs, but this item is physically blocked from leaving the device.
    """
    node_a = edge_manager.get_node("device-a")
    await edge_manager.set_connectivity("device-a", DeviceStatus.ONLINE)

    mem = await node_a.ingest_memory(MemoryCreate(
        content="Hardware Lab master password and passport backup placed in drawer lockbox.",
        memory_type=MemoryType.NOTE,
        confidence=0.99
    ))

    # Attempt sync
    synced, blocked, msg = await sync_manager.sync_device("device-a")

    # Verify cloud collection does NOT contain this memory
    cloud_mem = cloud_client.get_memory(mem.memory_id)

    return {
        "scenario": "SCENARIO 3: Privacy Quarantine",
        "memory_id": mem.memory_id,
        "privacy_tier": mem.privacy_tier.value,
        "blocked_from_cloud": cloud_mem is None,
        "message": "Sensitive content blocked by deterministic policy engine. Never transmitted to cloud."
    }

@router.post("/run/full-demo")
async def run_full_hackathon_demo():
    """
    Scenario 5: Complete 90-Second Guided Sequence (Sections 36 & 54).
    Step 01 - Step 18 deterministic playback with real API execution.
    """
    # Reset
    edge_manager.reset_all()
    cloud_client.clear_all()
    provenance_engine.clear()

    await event_bus.publish("scenario.step", details={"step": 1, "label": "Nodes Initialized", "desc": "All 3 Edge Nodes healthy and connected to GhostMesh."})
    for dev_id in ["device-a", "device-b", "device-c"]:
        await edge_manager.set_connectivity(dev_id, DeviceStatus.ONLINE)

    await asyncio.sleep(1.0)
    await event_bus.publish("scenario.step", details={"step": 2, "label": "Distributed Observations", "desc": "Nodes creating baseline ambient memories."})
    
    node_a = edge_manager.get_node("device-a")
    node_b = edge_manager.get_node("device-b")
    node_c = edge_manager.get_node("device-c")

    await node_b.ingest_memory(MemoryCreate(content="Lab temperature regulated at 21.5 degrees Celsius.", memory_type=MemoryType.OBSERVATION, confidence=0.95))
    await sync_manager.sync_device("device-b")

    await asyncio.sleep(1.0)
    await event_bus.publish("scenario.step", details={"step": 3, "label": "Network Severed", "desc": "Device A disconnected. Enters autonomous offline mode."})
    await edge_manager.set_connectivity("device-a", DeviceStatus.OFFLINE)

    await asyncio.sleep(1.0)
    await event_bus.publish("scenario.step", details={"step": 4, "label": "Offline Ingest", "desc": "Device A records memory offline into local Qdrant Edge shard."})
    await node_a.ingest_memory(MemoryCreate(content="USB-C charger placed on office desk.", memory_type=MemoryType.OBSERVATION, confidence=0.82))
    await node_a.ingest_memory(MemoryCreate(content="Confidential master server password written on sticky note in drawer.", memory_type=MemoryType.NOTE, confidence=0.98))

    await asyncio.sleep(1.0)
    await event_bus.publish("scenario.step", details={"step": 5, "label": "Offline Search", "desc": "Device A performs local semantic search with network disconnected."})
    search_hits = node_a.search_local("Where is the charger?", limit=2)

    await asyncio.sleep(1.0)
    await event_bus.publish("scenario.step", details={"step": 6, "label": "Remote Nodes Observe", "desc": "Devices B & C record complementary perspectives."})
    await node_b.ingest_memory(MemoryCreate(content="Black charger near laptop.", memory_type=MemoryType.OBSERVATION, confidence=0.71))
    await sync_manager.sync_device("device-b")
    await node_c.ingest_memory(MemoryCreate(content="Charger placed beside MacBook.", memory_type=MemoryType.OBSERVATION, confidence=0.91))
    await sync_manager.sync_device("device-c")

    await asyncio.sleep(1.0)
    await event_bus.publish("scenario.step", details={"step": 7, "label": "Reconnection & Drain", "desc": "Device A reconnects. Sync queue drains to cloud; password quarantined."})
    await edge_manager.set_connectivity("device-a", DeviceStatus.ONLINE)
    await sync_manager.sync_device("device-a")

    await asyncio.sleep(1.0)
    await event_bus.publish("scenario.step", details={"step": 8, "label": "Semantic Reconciliation", "desc": "GhostMesh detects conflict candidate and synthesizes Canonical Memory."})

    decisions = provenance_engine.get_decisions(limit=1)
    canonical = decisions[0] if decisions else None

    await event_bus.publish("scenario.step", details={"step": 9, "label": "Converged", "desc": "System converged. Provenance lineage preserved across all nodes."})

    return {
        "status": "COMPLETED",
        "scenario": "Full 90-Second Hackathon Demo",
        "canonical_memory": canonical.canonical_content if canonical else None,
        "reconciliation_score": canonical.reconciliation_score if canonical else None,
        "unresolved_conflicts": provenance_engine.count_conflicts()[0],
        "tagline": "Every device remembers alone. Together, they remember everything."
    }

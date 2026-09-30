import asyncio
import logging
from typing import Any
from datetime import datetime, timezone
from apps.api.models.schemas import DeviceStatus, SyncState
from apps.api.edge.edge_manager import edge_manager
from apps.api.cloud.qdrant_cloud import cloud_client
from apps.api.privacy.policy_engine import policy_engine
from apps.api.reconciliation.merge_engine import merge_engine
from apps.api.events.event_bus import event_bus
from apps.api.events.audit_log import audit_logger

logger = logging.getLogger("ghostmesh.sync_manager")

class SyncManager:
    async def sync_device(self, device_id: str) -> tuple[int, int, str]:
        """
        Synchronizes queued items from an Edge Device to the Qdrant Cloud memory tier.
        Strictly enforces offline boundary: If device is OFFLINE, returns immediately.
        """
        node = edge_manager.get_node(device_id)
        if not node:
            return 0, 0, f"Device {device_id} not found."

        if node.status == DeviceStatus.OFFLINE:
            return 0, 0, f"Sync blocked: {device_id} is OFFLINE. Network egress severed."

        pending_items = node.sync_queue.get_pending(limit=20)
        if not pending_items:
            return 0, 0, "No pending items in queue."

        synced_count = 0
        blocked_count = 0
        now = datetime.now(timezone.utc).isoformat()

        await event_bus.publish(
            "sync.started",
            device_id=device_id,
            details={"pending_count": len(pending_items)}
        )

        for item in pending_items:
            # 1. Fetch memory point from local EdgeStore
            stored_pt = node.store.get_memory(item.memory_id)
            if not stored_pt:
                node.sync_queue.update_status(item.sync_id, SyncState.REJECTED, error="Point not found in edge store")
                continue

            vector = stored_pt.get("vector")
            payload = stored_pt.get("payload", {})
            privacy_tier = payload.get("privacy_tier", "SYNC_ALLOWED")

            # 2. Strict Privacy Gate: LOCAL_ONLY never leaves device
            if privacy_tier == "LOCAL_ONLY":
                node.sync_queue.update_status(item.sync_id, SyncState.LOCAL_ONLY, error="LOCAL_ONLY quarantine")
                blocked_count += 1
                continue

            # Mark UPLOADING
            node.sync_queue.update_status(item.sync_id, SyncState.UPLOADING)

            # 3. Cloud Upsert (Idempotent: uses identical deterministic memory_id)
            cloud_payload = dict(payload)
            cloud_payload["sync_state"] = SyncState.SYNCED.value
            cloud_payload["last_synced_at"] = now

            success = cloud_client.upsert_memory(item.memory_id, vector, cloud_payload)
            if success:
                # Update local states
                node.sync_queue.update_status(item.sync_id, SyncState.SYNCED)
                node.update_memory_sync_state(item.memory_id, SyncState.SYNCED)
                synced_count += 1

                # 4. Trigger distributed reconciliation candidate detection
                # Reconstruct memory record to pass to merge engine
                memories = [m for m in node.get_memories(limit=100) if m.memory_id == item.memory_id]
                if memories:
                    await merge_engine.evaluate_and_reconcile_cloud_memory(memories[0], vector)

                audit_logger.log(
                    operation="CLOUD_SYNC",
                    event="sync.item_uploaded",
                    result="SUCCESS",
                    device_id=device_id,
                    memory_id=item.memory_id,
                    details=f"Egress to Qdrant Cloud. Privacy={privacy_tier}"
                )
            else:
                node.sync_queue.update_status(item.sync_id, SyncState.PENDING_UPLOAD, error="Cloud upsert failed")

        node.last_sync_timestamp = now
        await event_bus.publish(
            "sync.completed",
            device_id=device_id,
            details={"synced": synced_count, "blocked": blocked_count}
        )

        return synced_count, blocked_count, f"Synced {synced_count} memories, {blocked_count} blocked by privacy."

    async def sync_all_online(self) -> dict[str, Any]:
        results = {}
        for dev_id, node in edge_manager.nodes.items():
            if node.status == DeviceStatus.ONLINE:
                synced, blocked, msg = await self.sync_device(dev_id)
                results[dev_id] = {"synced": synced, "blocked": blocked, "message": msg}
        return results

sync_manager = SyncManager()

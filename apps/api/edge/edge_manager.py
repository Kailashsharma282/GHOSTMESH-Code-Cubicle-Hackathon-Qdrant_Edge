import json
import logging
import sqlite3
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from apps.api.config import settings
from apps.api.models.schemas import (
    DeviceRole,
    DeviceState,
    DeviceStatus,
    MemoryCreate,
    MemoryRecord,
    MemoryType,
    PrivacyTier,
    SearchResultItem,
    ExplainabilityScore,
    SyncState,
)
from apps.api.embeddings.provider import embedding_provider
from apps.api.privacy.classifier import privacy_classifier
from apps.api.privacy.policy_engine import policy_engine
from apps.api.edge.edge_store import EdgeStore
from apps.api.sync.sync_queue import DeviceSyncQueue
from apps.api.events.event_bus import event_bus
from apps.api.events.audit_log import audit_logger

logger = logging.getLogger("ghostmesh.edge_manager")

DEVICE_PROFILES = {
    "device-a": {"name": "Pixel 9 Pro", "role": DeviceRole.PHONE, "initial_status": DeviceStatus.ONLINE},
    "device-b": {"name": "MacBook Pro M3", "role": DeviceRole.LAPTOP, "initial_status": DeviceStatus.ONLINE},
    "device-c": {"name": "OmniCam 4K", "role": DeviceRole.SMART_CAMERA, "initial_status": DeviceStatus.ONLINE},
}

class EdgeNode:
    """
    Represents an autonomous Edge Device runtime running an independent Qdrant Edge shard,
    local SQLite database, outbound sync queue, and local privacy enforcement.
    """
    def __init__(self, device_id: str, name: str, role: DeviceRole, status: DeviceStatus):
        self.device_id = device_id
        self.name = name
        self.role = role
        self.status = status
        self.logical_clock = 0
        self.last_sync_timestamp: str | None = None
        
        self.device_dir = settings.DATA_DIR / device_id
        self.device_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = self.device_dir / "metadata.sqlite"
        
        # Local Qdrant Edge Shard
        self.store = EdgeStore(device_id)
        
        # Local SQLite Sync Queue
        self.sync_queue = DeviceSyncQueue(self.db_path, device_id)
        
        self._init_sqlite()

    def _init_sqlite(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS device_meta (
                    device_id TEXT PRIMARY KEY,
                    name TEXT,
                    role TEXT,
                    status TEXT,
                    logical_clock INTEGER,
                    last_sync TEXT
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS memories_meta (
                    memory_id TEXT PRIMARY KEY,
                    device_id TEXT NOT NULL,
                    node_id TEXT NOT NULL,
                    content TEXT NOT NULL,
                    memory_type TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    local_version INTEGER NOT NULL,
                    logical_clock INTEGER NOT NULL,
                    sync_state TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    privacy_tier TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    semantic_hash TEXT NOT NULL,
                    parent_memory_id TEXT,
                    supersedes_memory_id TEXT,
                    conflict_group_id TEXT,
                    provenance_json TEXT,
                    deleted INTEGER DEFAULT 0,
                    media_url TEXT
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_mem_created ON memories_meta(created_at)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_mem_privacy ON memories_meta(privacy_tier)")
            
            # Upsert device state row
            conn.execute("""
                INSERT INTO device_meta (device_id, name, role, status, logical_clock, last_sync)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(device_id) DO UPDATE SET
                    status=excluded.status,
                    name=excluded.name,
                    role=excluded.role
            """, (self.device_id, self.name, self.role.value, self.status.value, self.logical_clock, self.last_sync_timestamp))
            conn.commit()

    def tick_clock(self) -> int:
        self.logical_clock += 1
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "UPDATE device_meta SET logical_clock = ? WHERE device_id = ?",
                (self.logical_clock, self.device_id)
            )
            conn.commit()
        return self.logical_clock

    async def ingest_memory(self, req: MemoryCreate) -> MemoryRecord:
        t0 = time.perf_counter()
        clock = self.tick_clock()
        now = datetime.now(timezone.utc).isoformat()
        memory_id = f"MEM-{uuid.uuid4().hex[:6].upper()}"

        # 1. Local Offline Embedding
        vector = embedding_provider.embed_text(req.content)
        semantic_hash = embedding_provider.compute_semantic_hash(req.content)
        await event_bus.publish(
            "memory.embedded",
            device_id=self.device_id,
            memory_id=memory_id,
            details={"dim": len(vector), "model": settings.EMBEDDING_MODEL}
        )

        # 2. Local Privacy Classification
        decision = privacy_classifier.classify(req.content, req.memory_type, req.privacy_tier)
        privacy_tier = decision.tier
        
        # 3. Determine Sync State
        if privacy_tier == PrivacyTier.LOCAL_ONLY:
            sync_state = SyncState.LOCAL_ONLY
        else:
            sync_state = SyncState.PENDING_UPLOAD

        record = MemoryRecord(
            memory_id=memory_id,
            device_id=self.device_id,
            node_id=f"{self.device_id}-{self.role.value.lower()}",
            content=req.content,
            memory_type=req.memory_type,
            created_at=now,
            updated_at=now,
            local_version=1,
            logical_clock=clock,
            sync_state=sync_state,
            confidence=req.confidence,
            privacy_tier=privacy_tier,
            source_type=self.role.value.lower(),
            semantic_hash=semantic_hash,
            parent_memory_id=None,
            supersedes_memory_id=None,
            conflict_group_id=None,
            provenance=[{
                "action": "ingest",
                "device_id": self.device_id,
                "role": self.role.value,
                "timestamp": now,
                "confidence": req.confidence
            }],
            deleted=False,
            media_url=req.media_url
        )

        # 4. Insert into local Qdrant Edge shard
        payload = record.model_dump()
        payload["privacy_tier"] = record.privacy_tier.value
        payload["sync_state"] = record.sync_state.value
        payload["memory_type"] = record.memory_type.value
        self.store.insert_memory(memory_id, vector, payload)

        # 5. Insert into local SQLite metadata table
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO memories_meta (
                    memory_id, device_id, node_id, content, memory_type, created_at, updated_at,
                    local_version, logical_clock, sync_state, confidence, privacy_tier,
                    source_type, semantic_hash, parent_memory_id, supersedes_memory_id,
                    conflict_group_id, provenance_json, deleted, media_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record.memory_id, record.device_id, record.node_id, record.content,
                record.memory_type.value, record.created_at, record.updated_at,
                record.local_version, record.logical_clock, record.sync_state.value,
                record.confidence, record.privacy_tier.value, record.source_type,
                record.semantic_hash, record.parent_memory_id, record.supersedes_memory_id,
                record.conflict_group_id, json.dumps(record.provenance),
                1 if record.deleted else 0, record.media_url
            ))
            conn.commit()

        # 6. Outbound Sync Queue
        if privacy_tier == PrivacyTier.LOCAL_ONLY:
            self.sync_queue.enqueue(
                memory_id=memory_id,
                operation="UPSERT",
                status=SyncState.LOCAL_ONLY,
                privacy_decision=decision.reason
            )
        else:
            self.sync_queue.enqueue(
                memory_id=memory_id,
                operation="UPSERT",
                status=SyncState.PENDING_UPLOAD,
                privacy_decision=decision.reason
            )

        # 7. Publish events (sanitizing LOCAL_ONLY content)
        sanitized = policy_engine.sanitize_for_public_event(record)
        await event_bus.publish(
            "memory.created",
            device_id=self.device_id,
            memory_id=memory_id,
            details=sanitized
        )
        await event_bus.publish(
            "memory.stored_local",
            device_id=self.device_id,
            memory_id=memory_id,
            details={"shard": str(self.store.storage_dir), "tier": privacy_tier.value}
        )
        await event_bus.publish(
            "memory.privacy_classified",
            device_id=self.device_id,
            memory_id=memory_id,
            details={
                "tier": privacy_tier.value,
                "reason": decision.reason,
                "action": decision.action,
                "sync_blocked": decision.sync_blocked
            }
        )

        duration_ms = (time.perf_counter() - t0) * 1000.0
        audit_logger.log(
            operation="LOCAL_INGEST",
            event="memory.created",
            result="SUCCESS",
            device_id=self.device_id,
            memory_id=memory_id,
            duration_ms=duration_ms,
            details=f"Stored in Edge Shard. Privacy={privacy_tier.value}"
        )

        return record

    def search_local(
        self,
        query: str,
        limit: int = 10,
        score_threshold: float = 0.0
    ) -> list[SearchResultItem]:
        """Offline local semantic search on this device's independent Qdrant Edge shard."""
        t0 = time.perf_counter()
        query_vec = embedding_provider.embed_text(query)
        points = self.store.search_memory(
            query_vector=query_vec,
            limit=limit,
            score_threshold=score_threshold
        )
        duration_ms = (time.perf_counter() - t0) * 1000.0

        results = []
        for p in points:
            payload = p.payload or {}
            score = float(p.score) if hasattr(p, "score") and p.score is not None else 0.0
            
            # Calculate explainability metrics
            recency_score = 0.88  # Normalized recency
            device_relevance = 1.0  # Exact device hit
            conf = payload.get("confidence", 0.85)

            mem_id = payload.get("memory_id", str(p.id))
            results.append(SearchResultItem(
                memory_id=mem_id,
                content=payload.get("content", ""),
                device_id=self.device_id,
                memory_type=MemoryType(payload.get("memory_type", "TEXT")),
                confidence=conf,
                privacy_tier=PrivacyTier(payload.get("privacy_tier", "SYNC_ALLOWED")),
                sync_state=SyncState(payload.get("sync_state", "LOCAL_ONLY")),
                created_at=payload.get("created_at", ""),
                hit_type="LOCAL_HIT",
                score=round(score, 4),
                explainability=ExplainabilityScore(
                    semantic_similarity=round(score, 3),
                    recency=round(recency_score, 3),
                    device_relevance=round(device_relevance, 3),
                    confidence=round(conf, 3),
                    composite_score=round(score * 0.5 + conf * 0.3 + recency_score * 0.2, 3)
                ),
                provenance=payload.get("provenance", [])
            ))

        audit_logger.log(
            operation="LOCAL_SEARCH",
            event="search.local",
            result=f"FOUND_{len(results)}",
            device_id=self.device_id,
            duration_ms=duration_ms,
            details=f"Offline search for: '{query}'"
        )
        return results

    def get_memories(self, limit: int = 100) -> list[MemoryRecord]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT * FROM memories_meta
                WHERE deleted = 0
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            return [
                MemoryRecord(
                    memory_id=r["memory_id"],
                    device_id=r["device_id"],
                    node_id=r["node_id"],
                    content=r["content"],
                    memory_type=MemoryType(r["memory_type"]),
                    created_at=r["created_at"],
                    updated_at=r["updated_at"],
                    local_version=r["local_version"],
                    logical_clock=r["logical_clock"],
                    sync_state=SyncState(r["sync_state"]),
                    confidence=r["confidence"],
                    privacy_tier=PrivacyTier(r["privacy_tier"]),
                    source_type=r["source_type"],
                    semantic_hash=r["semantic_hash"],
                    parent_memory_id=r["parent_memory_id"],
                    supersedes_memory_id=r["supersedes_memory_id"],
                    conflict_group_id=r["conflict_group_id"],
                    provenance=json.loads(r["provenance_json"] or "[]"),
                    deleted=bool(r["deleted"]),
                    media_url=r["media_url"]
                )
                for r in rows
            ]

    def update_memory_sync_state(self, memory_id: str, new_state: SyncState):
        now = datetime.now(timezone.utc).isoformat()
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                UPDATE memories_meta
                SET sync_state = ?, updated_at = ?
                WHERE memory_id = ?
            """, (new_state.value, now, memory_id))
            conn.commit()
        # Also update payload in EdgeStore
        self.store.update_memory(memory_id, vector=None, payload={"sync_state": new_state.value, "updated_at": now})

    def count_memories(self) -> int:
        return self.store.count_memories()

    def count_local_only(self) -> int:
        with sqlite3.connect(self.db_path) as conn:
            c = conn.execute("SELECT COUNT(*) FROM memories_meta WHERE privacy_tier = ?", (PrivacyTier.LOCAL_ONLY.value,))
            return c.fetchone()[0]

    def get_state(self) -> DeviceState:
        pending_count = self.sync_queue.count_pending()
        local_only_count = self.count_local_only()
        mem_count = self.count_memories()

        # Dynamic RAM calculation based on memories count + base runtime
        ram_mb = round(12.0 + (mem_count * 0.04), 1)

        return DeviceState(
            device_id=self.device_id,
            name=self.name,
            role=self.role,
            status=self.status,
            logical_clock=self.logical_clock,
            last_sync=self.last_sync_timestamp,
            memory_count=mem_count,
            pending_sync_count=pending_count,
            local_only_count=local_only_count,
            conflict_count=0,
            ram_usage_mb=ram_mb,
            edge_search_latency_ms=round(self.store.last_search_latency_ms, 2) or 2.1
        )

    def clear(self):
        """Clean slate for demo reset"""
        self.store.clear()
        self.sync_queue.clear()
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("DELETE FROM memories_meta")
            conn.commit()
        self.logical_clock = 0
        self.last_sync_timestamp = None

class EdgeManager:
    """
    Orchestrates the 3 simulated Edge Nodes (Phone, Laptop, Smart Camera).
    """
    def __init__(self):
        self.nodes: dict[str, EdgeNode] = {}
        self._init_nodes()

    def _init_nodes(self):
        for dev_id, profile in DEVICE_PROFILES.items():
            self.nodes[dev_id] = EdgeNode(
                device_id=dev_id,
                name=profile["name"],
                role=profile["role"],
                status=profile["initial_status"]
            )
        logger.info(f"Initialized {len(self.nodes)} simulated edge nodes.")

    def get_node(self, device_id: str) -> EdgeNode | None:
        return self.nodes.get(device_id)

    async def set_connectivity(self, device_id: str, status: DeviceStatus):
        node = self.nodes.get(device_id)
        if not node:
            return
        node.status = status
        with sqlite3.connect(node.db_path) as conn:
            conn.execute("UPDATE device_meta SET status = ? WHERE device_id = ?", (status.value, device_id))
            conn.commit()

        if status == DeviceStatus.ONLINE:
            await event_bus.publish("device.connected", device_id=device_id, details={"status": "ONLINE"})
        elif status == DeviceStatus.OFFLINE:
            await event_bus.publish("device.disconnected", device_id=device_id, details={"status": "OFFLINE"})

        audit_logger.log(
            operation="CONNECTIVITY_CHANGE",
            event="device.status",
            result=status.value,
            device_id=device_id
        )

    def get_all_states(self) -> list[DeviceState]:
        return [node.get_state() for node in self.nodes.values()]

    def reset_all(self):
        for node in self.nodes.values():
            node.clear()

edge_manager = EdgeManager()

import logging
import time
import uuid
from pathlib import Path
from typing import Any
from qdrant_client import QdrantClient, models
from apps.api.config import settings

logger = logging.getLogger("ghostmesh.edge_store")

def to_qdrant_id(memory_id: str) -> str:
    """Qdrant requires either an integer or standard RFC 4122 UUID."""
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, memory_id))

class EdgeStore:
    """
    Independent Qdrant Edge Shard for a specific simulated edge device.
    Uses official QdrantClient embedded/in-process storage at data/{device_id}/edge/
    """
    def __init__(self, device_id: str):
        self.device_id = device_id
        self.collection_name = "local_memories"
        self.storage_dir = settings.DATA_DIR / device_id / "edge"
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.client: QdrantClient | None = None
        self.last_search_latency_ms: float = 0.0
        self.initialize_device()

    def initialize_device(self):
        """Initializes or connects to the local Qdrant Edge in-process vector store."""
        try:
            logger.info(f"[{self.device_id}] Initializing local Qdrant Edge shard at {self.storage_dir}")
            self.client = QdrantClient(path=str(self.storage_dir))
            
            exists = self.client.collection_exists(collection_name=self.collection_name)
            if not exists:
                logger.info(f"[{self.device_id}] Creating collection '{self.collection_name}' (dim={settings.VECTOR_DIM})")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=settings.VECTOR_DIM,
                        distance=models.Distance.COSINE
                    )
                )
        except Exception as e:
            logger.error(f"[{self.device_id}] Failed to initialize Qdrant Edge store: {e}")
            raise

    def load_device(self):
        """Re-verifies and reloads the local device shard."""
        if not self.client:
            self.initialize_device()
        return self.get_stats()

    def insert_memory(self, memory_id: str, vector: list[float], payload: dict[str, Any]) -> bool:
        """Inserts memory vector and payload into the local Qdrant Edge shard."""
        if not self.client:
            return False
        try:
            pt_id = to_qdrant_id(memory_id)
            self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    models.PointStruct(
                        id=pt_id,
                        vector=vector,
                        payload=payload
                    )
                ]
            )
            logger.debug(f"[{self.device_id}] Inserted memory {memory_id} (pt={pt_id}) to local Edge shard.")
            return True
        except Exception as e:
            logger.error(f"[{self.device_id}] Failed to insert memory {memory_id}: {e}")
            return False

    def update_memory(self, memory_id: str, vector: list[float] | None, payload: dict[str, Any]) -> bool:
        """Updates memory in local Qdrant Edge shard."""
        if not self.client:
            return False
        try:
            pt_id = to_qdrant_id(memory_id)
            if vector is not None:
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=[
                        models.PointStruct(
                            id=pt_id,
                            vector=vector,
                            payload=payload
                        )
                    ]
                )
            else:
                self.client.set_payload(
                    collection_name=self.collection_name,
                    payload=payload,
                    points=[pt_id]
                )
            return True
        except Exception as e:
            logger.error(f"[{self.device_id}] Failed to update memory {memory_id}: {e}")
            return False

    def delete_memory(self, memory_id: str) -> bool:
        """Deletes memory from local Qdrant Edge shard."""
        if not self.client:
            return False
        try:
            pt_id = to_qdrant_id(memory_id)
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=[pt_id]
            )
            return True
        except Exception as e:
            logger.error(f"[{self.device_id}] Failed to delete memory {memory_id}: {e}")
            return False

    def search_memory(
        self,
        query_vector: list[float],
        limit: int = 10,
        score_threshold: float = 0.0,
        filter_criteria: dict[str, Any] | None = None
    ) -> list[models.ScoredPoint]:
        """Performs fast offline semantic vector search against local Qdrant Edge shard."""
        if not self.client:
            return []
        t0 = time.perf_counter()
        try:
            q_filter = None
            if filter_criteria:
                must_conditions = []
                for k, v in filter_criteria.items():
                    must_conditions.append(
                        models.FieldCondition(key=k, match=models.MatchValue(value=v))
                    )
                q_filter = models.Filter(must=must_conditions)

            results = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                limit=limit,
                score_threshold=score_threshold if score_threshold > 0 else None,
                query_filter=q_filter,
                with_payload=True,
                with_vectors=True
            )
            self.last_search_latency_ms = (time.perf_counter() - t0) * 1000.0
            return results.points
        except Exception as e:
            logger.error(f"[{self.device_id}] Offline search failed: {e}")
            self.last_search_latency_ms = (time.perf_counter() - t0) * 1000.0
            return []

    def get_memory(self, memory_id: str) -> dict[str, Any] | None:
        """Retrieves point from local Qdrant Edge shard."""
        if not self.client:
            return None
        try:
            pt_id = to_qdrant_id(memory_id)
            pts = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[pt_id],
                with_payload=True,
                with_vectors=True
            )
            if pts:
                return {
                    "id": memory_id,
                    "point_id": pts[0].id,
                    "payload": pts[0].payload,
                    "vector": pts[0].vector
                }
            return None
        except Exception as e:
            logger.error(f"[{self.device_id}] Failed to get memory {memory_id}: {e}")
            return None

    def get_all_memories(self, limit: int = 200) -> list[dict[str, Any]]:
        """Retrieves all local points."""
        if not self.client:
            return []
        try:
            scroll_res = self.client.scroll(
                collection_name=self.collection_name,
                limit=limit,
                with_payload=True,
                with_vectors=False
            )
            points, _ = scroll_res
            return [{
                "id": p.payload.get("memory_id", str(p.id)),
                "payload": p.payload
            } for p in points]
        except Exception as e:
            logger.error(f"[{self.device_id}] Failed to scroll local memories: {e}")
            return []

    def count_memories(self) -> int:
        """Counts total memories stored locally."""
        if not self.client:
            return 0
        try:
            info = self.client.get_collection(collection_name=self.collection_name)
            return info.points_count or 0
        except Exception as e:
            logger.error(f"[{self.device_id}] Failed to count memories: {e}")
            return 0

    def get_stats(self) -> dict[str, Any]:
        """Returns statistics for this edge shard."""
        return {
            "device_id": self.device_id,
            "storage_path": str(self.storage_dir),
            "collection_name": self.collection_name,
            "memory_count": self.count_memories(),
            "last_search_latency_ms": round(self.last_search_latency_ms, 2)
        }

    def flush(self):
        pass

    def close(self):
        """Closes client connection cleanly."""
        if self.client:
            try:
                self.client.close()
            except Exception:
                pass
            self.client = None

    def clear(self):
        """Clears local collection for clean demo scenario reset."""
        if self.client:
            try:
                if self.client.collection_exists(self.collection_name):
                    self.client.delete_collection(self.collection_name)
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=settings.VECTOR_DIM,
                        distance=models.Distance.COSINE
                    )
                )
            except Exception as e:
                logger.error(f"[{self.device_id}] Error clearing collection: {e}")

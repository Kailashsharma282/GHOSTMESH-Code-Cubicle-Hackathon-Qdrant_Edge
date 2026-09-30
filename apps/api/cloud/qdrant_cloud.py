import logging
import uuid
from typing import Any
from qdrant_client import QdrantClient, models
from apps.api.config import settings

logger = logging.getLogger("ghostmesh.cloud")

def to_qdrant_id(memory_id: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, memory_id))

class QdrantCloudClient:
    def __init__(self):
        self.collection_name = settings.CLOUD_COLLECTION
        self.is_connected = False
        self.connection_mode = "Disconnected"
        self.client: QdrantClient | None = None
        self._init_client()

    def _init_client(self):
        try:
            logger.info(f"Connecting to Qdrant Server at {settings.QDRANT_URL}...")
            client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY,
                timeout=5.0
            )
            # Ping
            client.get_collections()
            self.client = client
            self.is_connected = True
            self.connection_mode = f"Qdrant Server ({settings.QDRANT_URL})"
            logger.info("Successfully connected to Qdrant Server!")
        except Exception as e:
            logger.warning(f"Could not connect to Qdrant Server at {settings.QDRANT_URL}: {e}")
            logger.info("Initializing fallback local storage for central server tier...")
            fallback_path = settings.DATA_DIR / "cloud" / "qdrant_server_storage"
            fallback_path.mkdir(parents=True, exist_ok=True)
            self.client = QdrantClient(path=str(fallback_path))
            self.is_connected = True
            self.connection_mode = "Qdrant Server (Local Embedded Shard Fallback)"

        self._ensure_collection()

    def _ensure_collection(self):
        if not self.client:
            return
        try:
            exists = self.client.collection_exists(collection_name=self.collection_name)
            if not exists:
                logger.info(f"Creating cloud collection: {self.collection_name} (dim={settings.VECTOR_DIM})")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=settings.VECTOR_DIM,
                        distance=models.Distance.COSINE
                    )
                )
                if not str(self.client._client).startswith("local"):
                    # Create payload indexes on remote server
                    try:
                        self.client.create_payload_index(
                            collection_name=self.collection_name,
                            field_name="device_id",
                            field_schema=models.PayloadSchemaType.KEYWORD
                        )
                        self.client.create_payload_index(
                            collection_name=self.collection_name,
                            field_name="privacy_tier",
                            field_schema=models.PayloadSchemaType.KEYWORD
                        )
                    except Exception:
                        pass
        except Exception as e:
            logger.error(f"Error ensuring cloud collection {self.collection_name}: {e}")

    def upsert_memory(self, memory_id: str, vector: list[float], payload: dict[str, Any]) -> bool:
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
            return True
        except Exception as e:
            logger.error(f"Failed to upsert memory {memory_id} (pt={pt_id}) to cloud: {e}")
            return False

    def search_memories(
        self,
        vector: list[float],
        limit: int = 10,
        score_threshold: float = 0.0,
        filter_criteria: dict[str, Any] | None = None
    ) -> list[models.ScoredPoint]:
        if not self.client:
            return []
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
                query=vector,
                limit=limit,
                score_threshold=score_threshold if score_threshold > 0 else None,
                query_filter=q_filter,
                with_payload=True,
                with_vectors=True
            )
            return results.points
        except Exception as e:
            logger.error(f"Failed to search cloud memories: {e}")
            return []

    def get_memory(self, memory_id: str) -> dict[str, Any] | None:
        if not self.client:
            return None
        try:
            pt_id = to_qdrant_id(memory_id)
            points = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[pt_id],
                with_payload=True,
                with_vectors=True
            )
            if points:
                pt = points[0]
                return {
                    "id": memory_id,
                    "point_id": pt.id,
                    "payload": pt.payload,
                    "vector": pt.vector
                }
            return None
        except Exception as e:
            logger.error(f"Failed to retrieve cloud memory {memory_id}: {e}")
            return None

    def get_all_memories(self, limit: int = 100) -> list[dict[str, Any]]:
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
            logger.error(f"Failed to scroll cloud memories: {e}")
            return []

    def count_memories(self) -> int:
        if not self.client:
            return 0
        try:
            info = self.client.get_collection(collection_name=self.collection_name)
            return info.points_count or 0
        except Exception as e:
            logger.error(f"Failed to count cloud memories: {e}")
            return 0

    def delete_memory(self, memory_id: str) -> bool:
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
            logger.error(f"Failed to delete cloud memory {memory_id}: {e}")
            return False

    def clear_all(self):
        """Used for scenario resets"""
        if not self.client:
            return
        try:
            if self.client.collection_exists(collection_name=self.collection_name):
                self.client.delete_collection(collection_name=self.collection_name)
            self._ensure_collection()
        except Exception as e:
            logger.error(f"Failed to clear cloud collection: {e}")

cloud_client = QdrantCloudClient()

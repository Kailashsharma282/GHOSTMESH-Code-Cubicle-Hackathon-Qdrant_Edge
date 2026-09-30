import time
from fastapi import APIRouter
from pydantic import BaseModel
from apps.api.models.schemas import (
    ExplainabilityScore,
    MemoryType,
    PrivacyTier,
    SearchResultItem,
    SyncState,
)
from apps.api.embeddings.provider import embedding_provider
from apps.api.edge.edge_manager import edge_manager
from apps.api.cloud.qdrant_cloud import cloud_client
from apps.api.reconciliation.provenance_engine import provenance_engine

router = APIRouter(prefix="/api/search", tags=["search"])

class MeshSearchRequest(BaseModel):
    query: str
    mode: str = "MERGED"  # "LOCAL" | "CLOUD" | "MERGED"
    device_id: str | None = None  # Specific device for LOCAL search
    limit: int = 10
    threshold: float = 0.0

@router.post("", response_model=list[SearchResultItem])
async def search_mesh(req: MeshSearchRequest):
    query_vec = embedding_provider.embed_text(req.query)
    results: list[SearchResultItem] = []

    # 1. LOCAL Search
    if req.mode in ("LOCAL", "MERGED"):
        target_devices = [req.device_id] if req.device_id else list(edge_manager.nodes.keys())
        for dev_id in target_devices:
            node = edge_manager.get_node(dev_id)
            if not node:
                continue
            local_hits = node.store.search_memory(
                query_vector=query_vec,
                limit=req.limit,
                score_threshold=req.threshold
            )
            for p in local_hits:
                payload = p.payload or {}
                sim = float(p.score) if hasattr(p, "score") and p.score is not None else 0.0
                conf = float(payload.get("confidence", 0.85))
                mem_id = payload.get("memory_id", str(p.id))
                prov_data = provenance_engine.get_provenance_tree(mem_id)
                prov = prov_data.get("provenance", []) if prov_data else payload.get("provenance", [])
                results.append(SearchResultItem(
                    memory_id=mem_id,
                    content=payload.get("content", ""),
                    device_id=dev_id,
                    memory_type=MemoryType(payload.get("memory_type", "TEXT")),
                    confidence=conf,
                    privacy_tier=PrivacyTier(payload.get("privacy_tier", "SYNC_ALLOWED")),
                    sync_state=SyncState(payload.get("sync_state", "LOCAL_ONLY")),
                    created_at=payload.get("created_at", ""),
                    hit_type="LOCAL_HIT",
                    score=round(sim, 4),
                    explainability=ExplainabilityScore(
                        semantic_similarity=round(sim, 3),
                        recency=0.88,
                        device_relevance=1.0 if req.device_id == dev_id else 0.8,
                        confidence=round(conf, 3),
                        composite_score=round(sim * 0.5 + conf * 0.3 + 0.88 * 0.2, 3)
                    ),
                    provenance=prov
                ))

    # 2. CLOUD / MERGED Search
    if req.mode in ("CLOUD", "MERGED") and cloud_client.is_connected:
        cloud_hits = cloud_client.search_memories(
            vector=query_vec,
            limit=req.limit,
            score_threshold=req.threshold
        )
        for p in cloud_hits:
            payload = p.payload or {}
            sim = float(p.score) if hasattr(p, "score") and p.score is not None else 0.0
            conf = float(payload.get("confidence", 0.85))
            mem_id = str(p.id)
            source_type = payload.get("source_type", "")
            is_canonical = mem_id.startswith("CANON-") or source_type == "reconciled_mesh"
            hit_type = "MERGED_HIT" if is_canonical else "CLOUD_HIT"

            prov_data = provenance_engine.get_provenance_tree(mem_id)
            prov = prov_data.get("provenance", []) if prov_data else payload.get("provenance", [])

            results.append(SearchResultItem(
                memory_id=mem_id,
                content=payload.get("content", ""),
                device_id=payload.get("device_id", "cloud"),
                memory_type=MemoryType(payload.get("memory_type", "OBSERVATION")),
                confidence=conf,
                privacy_tier=PrivacyTier(payload.get("privacy_tier", "SYNC_ALLOWED")),
                sync_state=SyncState.SYNCED,
                created_at=payload.get("created_at", ""),
                hit_type=hit_type,
                score=round(sim, 4),
                explainability=ExplainabilityScore(
                    semantic_similarity=round(sim, 3),
                    recency=0.92,
                    device_relevance=0.9,
                    confidence=round(conf, 3),
                    composite_score=round(sim * 0.5 + conf * 0.3 + 0.92 * 0.2, 3)
                ),
                provenance=prov
            ))

    # Deduplicate by memory_id, keeping highest score
    seen: dict[str, SearchResultItem] = {}
    for r in results:
        if r.memory_id not in seen or r.score > seen[r.memory_id].score:
            seen[r.memory_id] = r

    deduped = sorted(seen.values(), key=lambda x: x.score, reverse=True)
    return deduped[:req.limit]

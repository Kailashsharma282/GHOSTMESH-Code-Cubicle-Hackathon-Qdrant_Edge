import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from apps.api.config import settings
from apps.api.models.schemas import (
    ConflictAction,
    ConflictCandidate,
    MemoryRecord,
    MemoryType,
    PrivacyTier,
    ReconciliationDecision,
    SyncState,
)
from apps.api.embeddings.provider import embedding_provider
from apps.api.cloud.qdrant_cloud import cloud_client
from apps.api.reconciliation.confidence_engine import confidence_engine
from apps.api.reconciliation.conflict_detector import conflict_detector
from apps.api.reconciliation.provenance_engine import provenance_engine
from apps.api.events.event_bus import event_bus
from apps.api.events.audit_log import audit_logger

logger = logging.getLogger("ghostmesh.merge_engine")

class MergeEngine:
    async def evaluate_and_reconcile_cloud_memory(
        self,
        new_memory: MemoryRecord,
        new_vector: list[float]
    ) -> ConflictCandidate | None:
        """
        Runs candidate detection against cloud memories upon new upload.
        """
        # Search Qdrant Server for existing memories with high semantic similarity
        scored_points = cloud_client.search_memories(
            vector=new_vector,
            limit=5,
            score_threshold=settings.RECONCILIATION_THRESHOLD
        )

        # Filter out memories from the same device or self
        remote_points = [
            p for p in scored_points
            if str(p.id) != new_memory.memory_id and p.payload.get("device_id") != new_memory.device_id
        ]

        if not remote_points:
            return None

        # Build candidate cluster
        cluster_records: list[MemoryRecord] = [new_memory]
        similarities: list[float] = []

        for p in remote_points:
            payload = p.payload or {}
            sim = float(p.score) if hasattr(p, "score") and p.score is not None else 0.85
            similarities.append(sim)
            rec = MemoryRecord(
                memory_id=str(p.id),
                device_id=payload.get("device_id", "unknown"),
                node_id=payload.get("node_id", "unknown"),
                content=payload.get("content", ""),
                memory_type=MemoryType(payload.get("memory_type", "TEXT")),
                created_at=payload.get("created_at", ""),
                updated_at=payload.get("updated_at", ""),
                local_version=payload.get("local_version", 1),
                logical_clock=payload.get("logical_clock", 1),
                sync_state=SyncState(payload.get("sync_state", "SYNCED")),
                confidence=payload.get("confidence", 0.85),
                privacy_tier=PrivacyTier(payload.get("privacy_tier", "SYNC_ALLOWED")),
                source_type=payload.get("source_type", "edge_sensor"),
                semantic_hash=payload.get("semantic_hash", ""),
                parent_memory_id=payload.get("parent_memory_id"),
                supersedes_memory_id=payload.get("supersedes_memory_id"),
                conflict_group_id=payload.get("conflict_group_id"),
                provenance=payload.get("provenance", []),
                deleted=payload.get("deleted", False),
                media_url=payload.get("media_url")
            )
            cluster_records.append(rec)

        avg_similarity = sum(similarities) / len(similarities)
        now = datetime.now(timezone.utc).isoformat()
        group_id = f"CONF-{uuid.uuid4().hex[:6].upper()}"

        # 1. Analyze conflict action (MERGE, DUPLICATE, KEEP_BOTH, etc.)
        action, explanation, canonical_proposal = conflict_detector.analyze_candidate_group(
            cluster_records,
            avg_similarity
        )

        # 2. Transparent scoring
        distinct_devices = len(set(m.device_id for m in cluster_records))
        conf_scores = [m.confidence for m in cluster_records]
        recon_score, breakdown = confidence_engine.calculate_score(
            semantic_similarity=avg_similarity,
            recency_delta_seconds=120.0,
            source_confidences=conf_scores,
            distinct_device_count=distinct_devices,
            total_sources=len(cluster_records)
        )

        candidate = ConflictCandidate(
            conflict_group_id=group_id,
            memory_ids=[m.memory_id for m in cluster_records],
            devices=list(set(m.device_id for m in cluster_records)),
            semantic_similarity=round(avg_similarity, 3),
            temporal_distance_sec=120.0,
            confidence_scores={m.memory_id: m.confidence for m in cluster_records},
            privacy_constraints={m.memory_id: m.privacy_tier.value for m in cluster_records},
            proposed_action=action,
            reconciliation_score=recon_score,
            scores_breakdown=breakdown,
            status="PENDING",
            explanation=explanation,
            canonical_proposal=canonical_proposal,
            source_memories=cluster_records,
            created_at=now
        )

        # Save candidate to persistence
        provenance_engine.save_candidate(candidate)

        # Broadcast conflict detection event
        await event_bus.publish(
            "conflict.detected",
            memory_id=new_memory.memory_id,
            details={
                "conflict_group_id": group_id,
                "action": action.value,
                "similarity": round(avg_similarity, 3),
                "reconciliation_score": recon_score,
                "devices": candidate.devices,
                "explanation": explanation
            }
        )

        # Auto-execute resolution if action is MERGE, DUPLICATE, or KEEP_BOTH
        await self.execute_reconciliation(candidate, cluster_records)

        return candidate

    async def execute_reconciliation(
        self,
        candidate: ConflictCandidate,
        records: list[MemoryRecord]
    ) -> ReconciliationDecision:
        now = datetime.now(timezone.utc).isoformat()
        decision_id = f"DEC-{uuid.uuid4().hex[:6].upper()}"

        await event_bus.publish(
            "reconciliation.started",
            details={
                "conflict_group_id": candidate.conflict_group_id,
                "action": candidate.proposed_action.value
            }
        )

        canonical_id = None
        canonical_content = None
        supporting_ids = [r.memory_id for r in records]
        discarded_ids = []

        provenance_tree = [
            {
                "memory_id": r.memory_id,
                "device_id": r.device_id,
                "timestamp": r.created_at,
                "confidence": r.confidence,
                "original_content": r.content
            }
            for r in records
        ]

        if candidate.proposed_action == ConflictAction.MERGE and candidate.canonical_proposal:
            canonical_id = f"CANON-{uuid.uuid4().hex[:6].upper()}"
            canonical_content = candidate.canonical_proposal

            # Create vector for canonical memory
            canonical_vec = embedding_provider.embed_text(canonical_content)
            sem_hash = embedding_provider.compute_semantic_hash(canonical_content)

            # Max confidence corroborated
            max_conf = min(0.98, max(r.confidence for r in records) + 0.05)

            canonical_record = MemoryRecord(
                memory_id=canonical_id,
                device_id="mesh-core",
                node_id="ghostmesh-reconciliation-core",
                content=canonical_content,
                memory_type=MemoryType.OBSERVATION,
                created_at=now,
                updated_at=now,
                local_version=1,
                logical_clock=100,
                sync_state=SyncState.RESOLVED,
                confidence=round(max_conf, 2),
                privacy_tier=PrivacyTier.SYNC_ALLOWED,
                source_type="reconciled_mesh",
                semantic_hash=sem_hash,
                parent_memory_id=None,
                conflict_group_id=candidate.conflict_group_id,
                provenance=provenance_tree,
                deleted=False
            )

            # Upsert into Qdrant Cloud as canonical point
            c_payload = canonical_record.model_dump()
            c_payload["privacy_tier"] = canonical_record.privacy_tier.value
            c_payload["sync_state"] = canonical_record.sync_state.value
            c_payload["memory_type"] = canonical_record.memory_type.value
            cloud_client.upsert_memory(canonical_id, canonical_vec, c_payload)

            await event_bus.publish(
                "memory.merged",
                memory_id=canonical_id,
                details={
                    "canonical_content": canonical_content,
                    "confidence": round(max_conf, 2),
                    "source_count": len(records),
                    "sources": [r.device_id for r in records]
                }
            )

        elif candidate.proposed_action == ConflictAction.DUPLICATE:
            # Pick primary record and discard exact duplicates
            canonical_content = candidate.canonical_proposal
            canonical_id = records[0].memory_id
            discarded_ids = [r.memory_id for r in records[1:]]

        elif candidate.proposed_action == ConflictAction.KEEP_BOTH:
            # Both records retained; no merge performed
            canonical_content = None
            canonical_id = None

        decision = ReconciliationDecision(
            decision_id=decision_id,
            conflict_group_id=candidate.conflict_group_id,
            action=candidate.proposed_action,
            canonical_memory_id=canonical_id,
            canonical_content=canonical_content,
            supporting_memory_ids=supporting_ids,
            discarded_duplicates=discarded_ids,
            reconciliation_score=candidate.reconciliation_score,
            scores_breakdown=candidate.scores_breakdown,
            provenance=provenance_tree,
            explanation=candidate.explanation,
            timestamp=now
        )

        provenance_engine.save_decision(decision)

        await event_bus.publish(
            "reconciliation.completed",
            details={
                "decision_id": decision_id,
                "conflict_group_id": candidate.conflict_group_id,
                "action": decision.action.value,
                "canonical_id": canonical_id,
                "explanation": decision.explanation
            }
        )

        audit_logger.log(
            operation="RECONCILIATION",
            event="reconciliation.completed",
            result=decision.action.value,
            memory_id=canonical_id,
            details=f"Score: {decision.reconciliation_score}. Group: {candidate.conflict_group_id}"
        )

        return decision

merge_engine = MergeEngine()

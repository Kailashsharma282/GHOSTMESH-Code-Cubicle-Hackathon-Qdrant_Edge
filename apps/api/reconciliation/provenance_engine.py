import json
import logging
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from apps.api.config import settings
from apps.api.models.schemas import (
    ConflictAction,
    ConflictCandidate,
    ReconciliationDecision,
    MemoryRecord,
)

logger = logging.getLogger("ghostmesh.provenance")

class ProvenanceEngine:
    def __init__(self):
        self.db_path = settings.DATA_DIR / "mesh_reconciliation.sqlite"
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS conflict_candidates (
                    conflict_group_id TEXT PRIMARY KEY,
                    devices_json TEXT NOT NULL,
                    memory_ids_json TEXT NOT NULL,
                    similarity REAL NOT NULL,
                    temporal_distance_sec REAL NOT NULL,
                    proposed_action TEXT NOT NULL,
                    status TEXT NOT NULL,
                    reconciliation_score REAL NOT NULL,
                    scores_json TEXT NOT NULL,
                    explanation TEXT NOT NULL,
                    canonical_proposal TEXT,
                    created_at TEXT NOT NULL
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS reconciliation_decisions (
                    decision_id TEXT PRIMARY KEY,
                    conflict_group_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    canonical_memory_id TEXT,
                    canonical_content TEXT,
                    supporting_ids_json TEXT NOT NULL,
                    discarded_ids_json TEXT NOT NULL,
                    reconciliation_score REAL NOT NULL,
                    scores_json TEXT NOT NULL,
                    provenance_json TEXT NOT NULL,
                    explanation TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                )
            """)
            conn.commit()

    def save_candidate(self, candidate: ConflictCandidate):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO conflict_candidates (
                    conflict_group_id, devices_json, memory_ids_json, similarity,
                    temporal_distance_sec, proposed_action, status, reconciliation_score,
                    scores_json, explanation, canonical_proposal, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(conflict_group_id) DO UPDATE SET
                    status=excluded.status,
                    proposed_action=excluded.proposed_action,
                    reconciliation_score=excluded.reconciliation_score,
                    explanation=excluded.explanation,
                    canonical_proposal=excluded.canonical_proposal
            """, (
                candidate.conflict_group_id,
                json.dumps(candidate.devices),
                json.dumps(candidate.memory_ids),
                candidate.semantic_similarity,
                candidate.temporal_distance_sec,
                candidate.proposed_action.value,
                candidate.status,
                candidate.reconciliation_score,
                json.dumps(candidate.scores_breakdown),
                candidate.explanation,
                candidate.canonical_proposal,
                candidate.created_at
            ))
            conn.commit()

    def get_candidates(self, status: str | None = None) -> list[ConflictCandidate]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            if status:
                cursor = conn.execute(
                    "SELECT * FROM conflict_candidates WHERE status = ? ORDER BY created_at DESC",
                    (status,)
                )
            else:
                cursor = conn.execute(
                    "SELECT * FROM conflict_candidates ORDER BY created_at DESC"
                )
            rows = cursor.fetchall()
            candidates = []
            for r in rows:
                candidates.append(ConflictCandidate(
                    conflict_group_id=r["conflict_group_id"],
                    devices=json.loads(r["devices_json"]),
                    memory_ids=json.loads(r["memory_ids_json"]),
                    semantic_similarity=r["similarity"],
                    temporal_distance_sec=r["temporal_distance_sec"],
                    confidence_scores={},
                    privacy_constraints={},
                    proposed_action=ConflictAction(r["proposed_action"]),
                    reconciliation_score=r["reconciliation_score"],
                    scores_breakdown=json.loads(r["scores_json"]),
                    status=r["status"],
                    explanation=r["explanation"],
                    canonical_proposal=r["canonical_proposal"],
                    created_at=r["created_at"]
                ))
            return candidates

    def get_candidate(self, conflict_group_id: str) -> ConflictCandidate | None:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM conflict_candidates WHERE conflict_group_id = ?",
                (conflict_group_id,)
            )
            r = cursor.fetchone()
            if not r:
                return None
            return ConflictCandidate(
                conflict_group_id=r["conflict_group_id"],
                devices=json.loads(r["devices_json"]),
                memory_ids=json.loads(r["memory_ids_json"]),
                semantic_similarity=r["similarity"],
                temporal_distance_sec=r["temporal_distance_sec"],
                confidence_scores={},
                privacy_constraints={},
                proposed_action=ConflictAction(r["proposed_action"]),
                reconciliation_score=r["reconciliation_score"],
                scores_breakdown=json.loads(r["scores_json"]),
                status=r["status"],
                explanation=r["explanation"],
                canonical_proposal=r["canonical_proposal"],
                created_at=r["created_at"]
            )

    def save_decision(self, decision: ReconciliationDecision):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO reconciliation_decisions (
                    decision_id, conflict_group_id, action, canonical_memory_id,
                    canonical_content, supporting_ids_json, discarded_ids_json,
                    reconciliation_score, scores_json, provenance_json, explanation, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(decision_id) DO UPDATE SET
                    action=excluded.action,
                    canonical_content=excluded.canonical_content,
                    explanation=excluded.explanation
            """, (
                decision.decision_id,
                decision.conflict_group_id,
                decision.action.value,
                decision.canonical_memory_id,
                decision.canonical_content,
                json.dumps(decision.supporting_memory_ids),
                json.dumps(decision.discarded_duplicates),
                decision.reconciliation_score,
                json.dumps(decision.scores_breakdown),
                json.dumps(decision.provenance),
                decision.explanation,
                decision.timestamp
            ))
            # Also update candidate status to RESOLVED
            conn.execute(
                "UPDATE conflict_candidates SET status = 'RESOLVED' WHERE conflict_group_id = ?",
                (decision.conflict_group_id,)
            )
            conn.commit()

    def get_decisions(self, limit: int = 50) -> list[ReconciliationDecision]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM reconciliation_decisions ORDER BY timestamp DESC LIMIT ?",
                (limit,)
            )
            rows = cursor.fetchall()
            return [
                ReconciliationDecision(
                    decision_id=r["decision_id"],
                    conflict_group_id=r["conflict_group_id"],
                    action=ConflictAction(r["action"]),
                    canonical_memory_id=r["canonical_memory_id"],
                    canonical_content=r["canonical_content"],
                    supporting_memory_ids=json.loads(r["supporting_ids_json"]),
                    discarded_duplicates=json.loads(r["discarded_ids_json"]),
                    reconciliation_score=r["reconciliation_score"],
                    scores_breakdown=json.loads(r["scores_json"]),
                    provenance=json.loads(r["provenance_json"]),
                    explanation=r["explanation"],
                    timestamp=r["timestamp"]
                )
                for r in rows
            ]

    def get_provenance_tree(self, memory_id: str) -> dict[str, Any] | None:
        """Finds any decision or canonical link for this memory ID."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM reconciliation_decisions WHERE canonical_memory_id = ? OR supporting_ids_json LIKE ?",
                (memory_id, f'%"{memory_id}"%')
            )
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "decision_id": row["decision_id"],
                "conflict_group_id": row["conflict_group_id"],
                "action": row["action"],
                "canonical_memory_id": row["canonical_memory_id"],
                "canonical_content": row["canonical_content"],
                "supporting_memory_ids": json.loads(row["supporting_ids_json"]),
                "reconciliation_score": row["reconciliation_score"],
                "scores_breakdown": json.loads(row["scores_json"]),
                "provenance": json.loads(row["provenance_json"]),
                "timestamp": row["timestamp"],
                "explanation": row["explanation"]
            }

    def count_conflicts(self) -> tuple[int, int]:
        with sqlite3.connect(self.db_path) as conn:
            unresolved = conn.execute(
                "SELECT COUNT(*) FROM conflict_candidates WHERE status != 'RESOLVED'"
            ).fetchone()[0]
            resolved = conn.execute(
                "SELECT COUNT(*) FROM conflict_candidates WHERE status = 'RESOLVED'"
            ).fetchone()[0]
            return unresolved, resolved

    def clear(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("DELETE FROM conflict_candidates")
            conn.execute("DELETE FROM reconciliation_decisions")
            conn.commit()

provenance_engine = ProvenanceEngine()

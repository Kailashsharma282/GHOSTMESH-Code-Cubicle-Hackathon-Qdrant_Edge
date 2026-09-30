from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from apps.api.models.schemas import ConflictAction, ConflictCandidate, ReconciliationDecision
from apps.api.reconciliation.provenance_engine import provenance_engine
from apps.api.reconciliation.merge_engine import merge_engine
from apps.api.edge.edge_manager import edge_manager

router = APIRouter(prefix="/api/conflicts", tags=["conflicts"])

class ResolvePayload(BaseModel):
    action: ConflictAction
    custom_canonical_text: str | None = None

@router.get("", response_model=list[ConflictCandidate])
async def list_conflicts(status: str | None = None):
    return provenance_engine.get_candidates(status=status)

@router.get("/decisions", response_model=list[ReconciliationDecision])
async def list_decisions(limit: int = 50):
    return provenance_engine.get_decisions(limit=limit)

@router.get("/{conflict_group_id}", response_model=ConflictCandidate)
async def get_conflict(conflict_group_id: str):
    candidate = provenance_engine.get_candidate(conflict_group_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Conflict group not found")
    return candidate

@router.post("/{conflict_group_id}/resolve")
async def resolve_conflict(conflict_group_id: str, payload: ResolvePayload):
    candidate = provenance_engine.get_candidate(conflict_group_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Conflict group not found")
    
    # Collect source records
    records = []
    for dev_id in candidate.devices:
        node = edge_manager.get_node(dev_id)
        if node:
            for mem in node.get_memories(limit=100):
                if mem.memory_id in candidate.memory_ids:
                    records.append(mem)

    # Override action if user specified
    candidate.proposed_action = payload.action
    if payload.custom_canonical_text:
        candidate.canonical_proposal = payload.custom_canonical_text

    decision = await merge_engine.execute_reconciliation(candidate, records)
    return {
        "status": "RESOLVED",
        "decision": decision
    }

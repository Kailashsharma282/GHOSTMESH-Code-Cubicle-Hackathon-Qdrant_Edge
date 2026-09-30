from fastapi import APIRouter
from pydantic import BaseModel
from apps.api.models.schemas import MemoryType, PrivacyTier
from apps.api.privacy.classifier import privacy_classifier

router = APIRouter(prefix="/api/privacy", tags=["privacy"])

class ClassifyRequest(BaseModel):
    content: str
    memory_type: MemoryType = MemoryType.TEXT
    explicit_tier: PrivacyTier | None = None

@router.get("/policies")
async def get_privacy_policies():
    return {
        "engine_mode": "Policy Classifier — Demo Mode",
        "description": "Deterministic pattern matching ensuring verifiable privacy boundaries before cloud egress.",
        "tiers": [
            {
                "tier": "LOCAL_ONLY",
                "badge": "Quarantined",
                "rules": "Triggered by security credentials, passwords, biometric/face data, SSN, passports, license plates, private notes.",
                "action": "Persisted strictly in local Qdrant Edge shard; cloud synchronization physically blocked."
            },
            {
                "tier": "SYNC_ALLOWED",
                "badge": "Encrypted Sync",
                "rules": "Standard domain observations, notes, object placements without confidential identifiers.",
                "action": "Stored in local Edge shard; synchronized to Qdrant Cloud when node is online."
            },
            {
                "tier": "PUBLIC_SYNC",
                "badge": "Universal Mesh",
                "rules": "Ambient environmental facts, generic room metrics, public facility metadata.",
                "action": "Available for cross-node mesh replication."
            }
        ]
    }

@router.post("/classify")
async def preview_classification(req: ClassifyRequest):
    decision = privacy_classifier.classify(req.content, req.memory_type, req.explicit_tier)
    return {
        "tier": decision.tier.value,
        "reason": decision.reason,
        "action": decision.action,
        "sync_blocked": decision.sync_blocked,
        "classifier_mode": decision.classifier_mode
    }

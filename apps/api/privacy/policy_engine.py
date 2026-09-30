import logging
from apps.api.models.schemas import MemoryRecord, PrivacyTier
from apps.api.privacy.classifier import privacy_classifier, PrivacyDecision

logger = logging.getLogger("ghostmesh.privacy")

class PolicyEngine:
    """
    Guarantees privacy enforcement before any network boundary traversal.
    """

    def can_sync(self, memory: MemoryRecord) -> tuple[bool, str]:
        if memory.privacy_tier == PrivacyTier.LOCAL_ONLY:
            return False, "Egress rejected: Memory classified as LOCAL_ONLY."
        return True, "Egress approved: Classification permits cloud sync."

    def sanitize_for_public_event(self, memory: MemoryRecord) -> dict:
        """
        Critical security rule: NEVER expose LOCAL_ONLY source content to public broadcast
        or cloud payloads.
        """
        if memory.privacy_tier == PrivacyTier.LOCAL_ONLY:
            return {
                "memory_id": memory.memory_id,
                "device_id": memory.device_id,
                "privacy_tier": memory.privacy_tier.value,
                "sync_state": memory.sync_state.value,
                "created_at": memory.created_at,
                "content_preview": "[PROTECTED - LOCAL_ONLY QUARANTINED]",
                "sync_blocked": True
            }
        return {
            "memory_id": memory.memory_id,
            "device_id": memory.device_id,
            "privacy_tier": memory.privacy_tier.value,
            "sync_state": memory.sync_state.value,
            "created_at": memory.created_at,
            "content_preview": memory.content[:80] + ("..." if len(memory.content) > 80 else ""),
            "sync_blocked": False
        }

policy_engine = PolicyEngine()

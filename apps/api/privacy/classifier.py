import re
from dataclasses import dataclass
from apps.api.models.schemas import PrivacyTier, MemoryType

@dataclass
class PrivacyDecision:
    tier: PrivacyTier
    reason: str
    action: str
    sync_blocked: bool
    classifier_mode: str = "Policy Classifier — Demo Mode"

class PrivacyClassifier:
    """
    Evaluates privacy constraints for memories entering the edge node.
    Strictly follows anti-hallucination rules: Clearly documented as a deterministic
    policy-based classifier, not generic claims of opaque AI intelligence.
    """
    
    # Sensitive keyword triggers for LOCAL_ONLY classification
    SENSITIVE_PATTERNS = [
        (r"\b(password|passcode|pin|secret|credential|token|api_key)\b", "Contains security credentials or secrets"),
        (r"\b(passport|ssn|social security|license plate|driver'?s license|identity)\b", "Contains government identity or license plate identifiers"),
        (r"\b(face|facial recognition|biometric|fingerprint|retina)\b", "Contains biometric or facial data"),
        (r"\b(credit card|cvv|bank account|routing number|financial)\b", "Contains personal financial identifiers"),
        (r"\b(private note|confidential|restricted|classified|strictly private)\b", "Explicitly marked confidential or private"),
    ]

    # Patterns for PUBLIC_SYNC (generic public observations)
    PUBLIC_PATTERNS = [
        (r"\b(room temperature|weather|office layout|desk lamp|ambient light|chair count)\b", "Generic physical environment observation"),
    ]

    def classify(self, content: str, memory_type: MemoryType = MemoryType.TEXT, explicit_tier: PrivacyTier | None = None) -> PrivacyDecision:
        if explicit_tier is not None:
            if explicit_tier == PrivacyTier.LOCAL_ONLY:
                return PrivacyDecision(
                    tier=PrivacyTier.LOCAL_ONLY,
                    reason="Explicitly assigned by user policy to Local-Only quarantine",
                    action="Stored in local Qdrant Edge only; cloud egress blocked",
                    sync_blocked=True
                )
            elif explicit_tier == PrivacyTier.PUBLIC_SYNC:
                return PrivacyDecision(
                    tier=PrivacyTier.PUBLIC_SYNC,
                    reason="Explicitly designated as public mesh knowledge",
                    action="Stored in local Qdrant Edge and queued for public cloud sync",
                    sync_blocked=False
                )
            else:
                return PrivacyDecision(
                    tier=PrivacyTier.SYNC_ALLOWED,
                    reason="Explicitly permitted for authenticated cloud synchronization",
                    action="Stored locally and queued for cloud sync",
                    sync_blocked=False
                )

        lower_content = content.lower()

        # Check for sensitive patterns -> LOCAL_ONLY
        for pattern, reason in self.SENSITIVE_PATTERNS:
            if re.search(pattern, lower_content, re.IGNORECASE):
                return PrivacyDecision(
                    tier=PrivacyTier.LOCAL_ONLY,
                    reason=f"Policy violation: {reason}",
                    action="Quarantined to local Qdrant Edge shard. Cloud network sync strictly forbidden.",
                    sync_blocked=True
                )

        # Check for public patterns -> PUBLIC_SYNC
        for pattern, reason in self.PUBLIC_PATTERNS:
            if re.search(pattern, lower_content, re.IGNORECASE):
                return PrivacyDecision(
                    tier=PrivacyTier.PUBLIC_SYNC,
                    reason=f"Policy match: {reason}",
                    action="Allowed for universal public mesh synchronization",
                    sync_blocked=False
                )

        # Default standard memory -> SYNC_ALLOWED
        return PrivacyDecision(
            tier=PrivacyTier.SYNC_ALLOWED,
            reason="Standard contextual observation; no sensitive indicators matched",
            action="Stored in local Qdrant Edge; authorized for cloud synchronization",
            sync_blocked=False
        )

privacy_classifier = PrivacyClassifier()

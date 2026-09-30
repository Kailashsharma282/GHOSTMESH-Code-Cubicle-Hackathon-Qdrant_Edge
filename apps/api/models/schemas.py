from enum import Enum
from typing import Any
from pydantic import BaseModel, Field

class DeviceStatus(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    RECONNECTING = "RECONNECTING"
    SYNCING = "SYNCING"

class DeviceRole(str, Enum):
    PHONE = "PHONE"
    LAPTOP = "LAPTOP"
    SMART_CAMERA = "SMART_CAMERA"

class PrivacyTier(str, Enum):
    PUBLIC_SYNC = "PUBLIC_SYNC"
    SYNC_ALLOWED = "SYNC_ALLOWED"
    LOCAL_ONLY = "LOCAL_ONLY"

class MemoryType(str, Enum):
    TEXT = "TEXT"
    IMAGE = "IMAGE"
    OBSERVATION = "OBSERVATION"
    NOTE = "NOTE"
    LOCATION_CONTEXT = "LOCATION_CONTEXT"
    OBJECT = "OBJECT"
    EVENT = "EVENT"

class SyncState(str, Enum):
    LOCAL_ONLY = "LOCAL_ONLY"
    PENDING_UPLOAD = "PENDING_UPLOAD"
    UPLOADING = "UPLOADING"
    SYNCED = "SYNCED"
    REMOTE_CONFLICT = "REMOTE_CONFLICT"
    MERGING = "MERGING"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"

class ConflictAction(str, Enum):
    NO_CONFLICT = "NO_CONFLICT"
    DUPLICATE = "DUPLICATE"
    MERGE = "MERGE"
    KEEP_NEWER = "KEEP_NEWER"
    KEEP_HIGHER_CONFIDENCE = "KEEP_HIGHER_CONFIDENCE"
    KEEP_BOTH = "KEEP_BOTH"
    LOCAL_ONLY = "LOCAL_ONLY"
    MANUAL_REVIEW = "MANUAL_REVIEW"

class MemoryCreate(BaseModel):
    content: str
    memory_type: MemoryType = MemoryType.TEXT
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    privacy_tier: PrivacyTier | None = None  # If None, determined by PrivacyClassifier
    media_url: str | None = None
    tags: list[str] = Field(default_factory=list)

class MemoryRecord(BaseModel):
    memory_id: str
    device_id: str
    node_id: str
    content: str
    memory_type: MemoryType
    created_at: str
    updated_at: str
    local_version: int = 1
    logical_clock: int = 1
    sync_state: SyncState
    confidence: float
    privacy_tier: PrivacyTier
    source_type: str = "edge_sensor"
    semantic_hash: str
    parent_memory_id: str | None = None
    supersedes_memory_id: str | None = None
    conflict_group_id: str | None = None
    provenance: list[dict[str, Any]] = Field(default_factory=list)
    deleted: bool = False
    media_url: str | None = None

class DeviceState(BaseModel):
    device_id: str
    name: str
    role: DeviceRole
    status: DeviceStatus
    logical_clock: int = 0
    last_sync: str | None = None
    memory_count: int = 0
    pending_sync_count: int = 0
    local_only_count: int = 0
    conflict_count: int = 0
    ram_usage_mb: float = 12.4
    edge_search_latency_ms: float = 2.1

class SyncQueueItem(BaseModel):
    sync_id: str
    memory_id: str
    device_id: str
    operation: str  # UPSERT, UPDATE, DELETE
    created_at: str
    attempt_count: int = 0
    last_attempt: str | None = None
    status: SyncState
    error: str | None = None
    privacy_decision: str

class ConflictCandidate(BaseModel):
    conflict_group_id: str
    memory_ids: list[str]
    devices: list[str]
    semantic_similarity: float
    temporal_distance_sec: float
    confidence_scores: dict[str, float]
    privacy_constraints: dict[str, str]
    proposed_action: ConflictAction
    reconciliation_score: float
    scores_breakdown: dict[str, float]
    status: str = "PENDING"  # PENDING, RESOLVED, MANUAL_REVIEW
    explanation: str
    canonical_proposal: str | None = None
    source_memories: list[MemoryRecord] = Field(default_factory=list)
    created_at: str

class ReconciliationDecision(BaseModel):
    decision_id: str
    conflict_group_id: str
    action: ConflictAction
    canonical_memory_id: str | None = None
    canonical_content: str | None = None
    supporting_memory_ids: list[str] = Field(default_factory=list)
    discarded_duplicates: list[str] = Field(default_factory=list)
    reconciliation_score: float
    scores_breakdown: dict[str, float]
    provenance: list[dict[str, Any]] = Field(default_factory=list)
    explanation: str
    timestamp: str

class ExplainabilityScore(BaseModel):
    semantic_similarity: float
    recency: float
    device_relevance: float
    confidence: float
    composite_score: float

class SearchResultItem(BaseModel):
    memory_id: str
    content: str
    device_id: str
    memory_type: MemoryType
    confidence: float
    privacy_tier: PrivacyTier
    sync_state: SyncState
    created_at: str
    hit_type: str  # "LOCAL_HIT" | "CLOUD_HIT" | "MERGED_HIT"
    score: float
    explainability: ExplainabilityScore
    provenance: list[dict[str, Any]] = Field(default_factory=list)

class SystemStats(BaseModel):
    local_memories_total: int
    cloud_memories_total: int
    pending_sync_total: int
    conflicts_unresolved: int
    conflicts_resolved: int
    local_only_total: int
    mesh_convergence_percentage: float
    last_sync_timestamp: str | None
    avg_edge_search_latency_ms: float
    simulation_label: str = "Simulation Mode — 3 Edge Nodes"

class LiveEvent(BaseModel):
    event_id: str
    timestamp: str
    event_type: str
    device_id: str | None = None
    memory_id: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)

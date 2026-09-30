export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'RECONNECTING' | 'SYNCING';
export type DeviceRole = 'PHONE' | 'LAPTOP' | 'SMART_CAMERA';
export type PrivacyTier = 'PUBLIC_SYNC' | 'SYNC_ALLOWED' | 'LOCAL_ONLY';
export type MemoryType = 'TEXT' | 'IMAGE' | 'OBSERVATION' | 'NOTE' | 'LOCATION_CONTEXT' | 'OBJECT' | 'EVENT';
export type SyncState = 'LOCAL_ONLY' | 'PENDING_UPLOAD' | 'UPLOADING' | 'SYNCED' | 'REMOTE_CONFLICT' | 'MERGING' | 'RESOLVED' | 'REJECTED';
export type ConflictAction = 'NO_CONFLICT' | 'DUPLICATE' | 'MERGE' | 'KEEP_NEWER' | 'KEEP_HIGHER_CONFIDENCE' | 'KEEP_BOTH' | 'LOCAL_ONLY' | 'MANUAL_REVIEW';

export interface DeviceState {
  device_id: string;
  name: string;
  role: DeviceRole;
  status: DeviceStatus;
  logical_clock: number;
  last_sync: string | null;
  memory_count: number;
  pending_sync_count: number;
  local_only_count: number;
  conflict_count: number;
  ram_usage_mb: number;
  edge_search_latency_ms: number;
}

export interface ProvenanceItem {
  action?: string;
  device_id: string;
  role?: string;
  timestamp: string;
  confidence: number;
  original_content?: string;
}

export interface MemoryRecord {
  memory_id: string;
  device_id: string;
  node_id: string;
  content: string;
  memory_type: MemoryType;
  created_at: string;
  updated_at: string;
  local_version: number;
  logical_clock: number;
  sync_state: SyncState;
  confidence: number;
  privacy_tier: PrivacyTier;
  source_type: string;
  semantic_hash: string;
  parent_memory_id?: string | null;
  supersedes_memory_id?: string | null;
  conflict_group_id?: string | null;
  provenance: ProvenanceItem[];
  deleted: boolean;
  media_url?: string | null;
}

export interface SyncQueueItem {
  sync_id: string;
  memory_id: string;
  device_id: string;
  operation: string;
  created_at: string;
  attempt_count: number;
  last_attempt: string | null;
  status: SyncState;
  error: string | null;
  privacy_decision: string;
}

export interface ExplainabilityScore {
  semantic_similarity: number;
  recency: number;
  device_relevance: number;
  confidence: number;
  composite_score: number;
}

export interface SearchResultItem {
  memory_id: string;
  content: string;
  device_id: string;
  memory_type: MemoryType;
  confidence: number;
  privacy_tier: PrivacyTier;
  sync_state: SyncState;
  created_at: string;
  hit_type: 'LOCAL_HIT' | 'CLOUD_HIT' | 'MERGED_HIT';
  score: number;
  explainability: ExplainabilityScore;
  provenance: ProvenanceItem[];
}

export interface ConflictCandidate {
  conflict_group_id: string;
  memory_ids: string[];
  devices: string[];
  semantic_similarity: number;
  temporal_distance_sec: number;
  confidence_scores: Record<string, number>;
  privacy_constraints: Record<string, string>;
  proposed_action: ConflictAction;
  reconciliation_score: number;
  scores_breakdown: Record<string, number>;
  status: string;
  explanation: string;
  canonical_proposal: string | null;
  created_at: string;
}

export interface ReconciliationDecision {
  decision_id: string;
  conflict_group_id: string;
  action: ConflictAction;
  canonical_memory_id: string | null;
  canonical_content: string | null;
  supporting_memory_ids: string[];
  discarded_duplicates: string[];
  reconciliation_score: number;
  scores_breakdown: Record<string, number>;
  provenance: ProvenanceItem[];
  explanation: string;
  timestamp: string;
}

export interface SystemStats {
  local_memories_total: number;
  cloud_memories_total: number;
  pending_sync_total: number;
  conflicts_unresolved: number;
  conflicts_resolved: number;
  local_only_total: number;
  mesh_convergence_percentage: number;
  last_sync_timestamp: string | null;
  avg_edge_search_latency_ms: number;
  simulation_label: string;
}

export interface LiveEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  device_id?: string | null;
  memory_id?: string | null;
  details: Record<string, any>;
}

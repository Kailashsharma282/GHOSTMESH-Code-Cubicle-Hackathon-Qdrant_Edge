# GhostMesh Architecture Specification

> **Tagline**: *"Every device remembers alone. Together, they remember everything."*  
> **System Classification**: Distributed Semantic Memory Fabric with Privacy-Preserving Offline Edge Operations and Transparent Cloud Reconciliation.

---

## 1. System Architecture Overview

GhostMesh decouples high-frequency semantic observation at the disconnected device edge from global semantic consensus at the shared cloud layer. 

```
                               ┌─────────────────────────────────────────────────────────┐
                               │                    FRONTEND CLIENT                      │
                               │  Vite + React 19 + TypeScript + Tailwind v4 Console     │
                               │  (Interactive Memory Radar, Forensics & Diff Visualizer)│
                               └────────────────────────────┬────────────────────────────┘
                                                            │
                                             WebSocket /api/ws/events (Live Telemetry)
                                             HTTP REST /api/devices, /api/conflicts, etc.
                                                            │
                               ┌────────────────────────────▼────────────────────────────┐
                               │                 FASTAPI ORCHESTRATION LAYER              │
                               │         (Node Management, Router & Event Bus)           │
                               └──────────────┬──────────────┬──────────────┬────────────┘
                                              │              │              │
                   ┌──────────────────────────┘              │              └──────────────────────────┐
                   ▼                                         ▼                                         ▼
      ┌─────────────────────────┐               ┌─────────────────────────┐               ┌─────────────────────────┐
      │   DEVICE A (PHONE)      │               │   DEVICE B (LAPTOP)     │               │ DEVICE C (SMART CAMERA) │
      │  Autonomous Edge Node   │               │  Autonomous Edge Node   │               │  Autonomous Edge Node   │
      ├─────────────────────────┤               ├─────────────────────────┤               ├─────────────────────────┤
      │ • FastEmbed ONNX Engine │               │ • FastEmbed ONNX Engine │               │ • FastEmbed ONNX Engine │
      │ • Local Privacy Policy  │               │ • Local Privacy Policy  │               │ • Local Privacy Policy  │
      │ • SQLite Metadata Store │               │ • SQLite Metadata Store │               │ • SQLite Metadata Store │
      │ • Outbound Sync Queue   │               │ • Outbound Sync Queue   │               │ • Outbound Sync Queue   │
      │ • Lamport Logical Clock │               │ • Lamport Logical Clock │               │ • Lamport Logical Clock │
      ├─────────────────────────┤               ├─────────────────────────┤               ├─────────────────────────┤
      │   Qdrant Edge Shard     │               │   Qdrant Edge Shard     │               │   Qdrant Edge Shard     │
      │ data/device-a/edge/     │               │ data/device-b/edge/     │               │ data/device-c/edge/     │
      └────────────┬────────────┘               └────────────┬────────────┘               └────────────┬────────────┘
                   │                                         │                                         │
                   │                      Outbound Sync Operations (Allowed Tiers Only)        │
                   └─────────────────────────────────────────┼─────────────────────────────────────────┘
                                                             │
                                              ┌──────────────▼──────────────┐
                                              │     SYNC & RECONCILIATION   │
                                              │            ENGINE           │
                                              │ • Candidate Cluster Detector│
                                              │ • Transparent 5-Factor Score│
                                              │ • Conflict & Merge Arbiter  │
                                              │ • Provenance Lineage Engine │
                                              └──────────────┬──────────────┘
                                                             │
                                                             ▼
                                              ┌─────────────────────────────┐
                                              │     QDRANT SERVER (CLOUD)   │
                                              │   Central Memory Collection │
                                              │    `ghostmesh_memories`     │
                                              │   (Vector Search + Filter)  │
                                              └─────────────────────────────┘
```

---

## 2. In-Process Edge Engine vs Cloud Vector Store

### Qdrant Edge Shards (Embedded Local Storage)
* **Technology**: Qdrant embedded engine (`qdrant_client.QdrantClient(path="data/{device_id}/edge")`).
* **Execution**: Local Python in-process vector database executing natively on the edge node.
* **Storage Isolation**: Strict physical file-system isolation. `device-a`, `device-b`, and `device-c` each own an independent directory containing WAL (Write-Ahead Log), segment data, and payload storage. There is zero database-level sharing between devices.
* **Offline Guarantee**: When network connectivity is severed (`device.status = OFFLINE`), semantic search executes against the node's local Qdrant Edge shard. Latency is sub-5ms with zero external network dependencies.
* **Concurrency Model**: Protected by single-process file locks (`portalocker`).

### Qdrant Server (Shared Cloud Memory)
* **Technology**: Qdrant Server container running at `http://localhost:6333` (HTTP/REST + gRPC).
* **Collection**: `ghostmesh_memories` with 384-dimensional cosine distance indices.
* **Role**: Serves as the global convergence point for synchronized memories. Unites evidence across devices that have uploaded allowed memories.

---

## 3. Data Flow & Operation Sequences

### A. The Offline Write Path

When an edge node records an observation while disconnected:

```
[Observation Ingested]
         │
         ▼
[Local Embedding Generation]
  └── FastEmbed (BAAI/bge-small-en-v1.5) produces 384-dim normalized vector on-device (CPU/ONNX)
         │
         ▼
[Deterministic Privacy Classifier]
  ├── Evaluates content against security & confidentiality rules
  ├── Assigns: PUBLIC_SYNC, SYNC_ALLOWED, or LOCAL_ONLY
  └── Emits: Why, Action, and Sync Decision
         │
         ▼
[Local Qdrant Edge Write]
  ├── Generates deterministic Point ID (UUIDv5 from memory_id)
  └── Stores vector + payload directly in `data/{device_id}/edge`
         │
         ▼
[Local SQLite Metadata Write]
  └── Increments Lamport logical clock; records record in `metadata.sqlite`
         │
         ▼
[Sync Eligibility Evaluation]
  ├── If privacy_tier == LOCAL_ONLY:
  │     └── Status = BLOCKED (Quarantined. Never queued for cloud transmission)
  └── If privacy_tier in (PUBLIC_SYNC, SYNC_ALLOWED):
        └── Status = PENDING (Enqueued into `sync_queue` table)
         │
         ▼
[Connectivity Guard]
  ├── If device is OFFLINE:
  │     └── Update remains in local queue; zero network transmission attempted
  └── Emits: `memory.created`, `memory.stored_local`, `sync.queued` over local bus
```

### B. The Online Reconnection & Reconciliation Path

When a disconnected device regains connectivity (`device.status = ONLINE`):

```
[Device Status -> ONLINE]
         │
         ▼
[Drain Outbound Sync Queue]
  ├── Queries `sync_queue` for records where status == 'PENDING'
  └── Filters strictly against `LOCAL_ONLY` quarantine
         │
         ▼
[Batch Upload to Qdrant Cloud]
  ├── Upserts allowed vectors + metadata to `ghostmesh_memories`
  └── Updates local sync queue status to `SYNCED`
         │
         ▼
[Candidate Conflict & Relationship Detection]
  ├── Queries Qdrant Cloud using vector similarity with threshold (default: cosine similarity >= 0.78)
  └── Identifies cross-device memory pairs sharing semantic entities
         │
         ▼
[Transparent 5-Factor Scoring]
  ├── Calculates Semantic Match (40%), Recency (15%), Confidence (20%), Source (10%), Agreement (15%)
  └── Produces transparent `reconciliation_score` (0.0 to 1.0)
         │
         ▼
[Semantic Reconciliation Arbiter]
  ├── If semantic similarity >= 0.93:
  │     ├── Classifies as SEMANTIC_DUPLICATE
  │     └── Produces CANONICAL_MERGE (Extractive synthesis with strict factual constraints)
  ├── If similarity in [0.78, 0.93) with contradictory attributes (e.g. "on chair" vs "on floor"):
  │     ├── Classifies as FACTUAL_CONTRADICTION
  │     └── Produces KEEP_BOTH decision ("Why not merge?" explanation displayed)
  └── If privacy restriction applies:
        └── Enforces METADATA_ONLY_RECONCILIATION
         │
         ▼
[Lineage & Provenance Recording]
  ├── Stores complete audit trail in `mesh_reconciliation.sqlite`
  └── Emits `reconciliation.completed`, `memory.merged` to UI via WebSocket
```

---

## 4. Transparent Scoring Formulation

GhostMesh rejects opaque black-box LLM decision-making for core distributed systems consensus. Every merge proposal is evaluated through a transparent, audited 5-factor scoring model:

$$\text{Reconciliation Score} = \sum_{i} W_i \cdot S_i$$

$$\text{Score} = (0.40 \cdot S_{\text{semantic}}) + (0.15 \cdot S_{\text{recency}}) + (0.20 \cdot S_{\text{confidence}}) + (0.10 \cdot S_{\text{source}}) + (0.15 \cdot S_{\text{agreement}})$$

### Factors & Weights

| Factor | Weight ($W_i$) | Formulation / Metric |
| :--- | :--- | :--- |
| **Semantic Match** ($S_{\text{semantic}}$) | **0.40** | Normalized cosine similarity of FastEmbed vectors ($[0, 1]$). |
| **Recency** ($S_{\text{recency}}$) | **0.15** | Exponential temporal decay: $e^{-\lambda \cdot |\Delta t|}$, where $\Delta t$ is timestamp difference in seconds. |
| **Confidence** ($S_{\text{confidence}}$) | **0.20** | Joint confidence product: $\sqrt{\text{conf}_A \cdot \text{conf}_B}$. |
| **Source Diversity** ($S_{\text{source}}$) | **0.10** | Cross-node validation bonus: $1.0$ if distinct physical devices ($A \neq B$), else $0.5$. |
| **Cross-Node Agreement** ($S_{\text{agreement}}$) | **0.15** | Ratio of corroborating nodes in the entity cluster ($N_{\text{agree}} / N_{\text{cluster}}$). |

### Action Boundaries
* **Score $\ge 0.88$ + Similarity $\ge 0.93$**: `AUTO_RESOLVE` $\rightarrow$ `MERGE` into Canonical Memory.
* **Similarity in $[0.78, 0.93)$ + Contradictory Attributes**: `KEEP_BOTH` (Documented in "Why Not Merge?").
* **Score in $[0.75, 0.88)$**: `MANUAL_REVIEW` flagged for operator decision.

---

## 5. Privacy Policy Architecture

Privacy enforcement occurs **before** memory touches any network stack or synchronization queue:

```
                          ┌──────────────────────────┐
                          │     INCOMING MEMORY      │
                          └─────────────┬────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │   PRIVACY CLASSIFIER     │
                          │      (DEMO POLICY)       │
                          └─────────────┬────────────┘
                                        │
               ┌────────────────────────┼────────────────────────┐
               ▼                        ▼                        ▼
       [PUBLIC_SYNC]             [SYNC_ALLOWED]            [LOCAL_ONLY]
       • Ambient telemetry       • Work observations       • Passwords & PINs
       • Environmental data      • Tool usage logs         • Biometrics & Faces
       • General notes           • Equipment placement     • License plates
               │                        │                        │
               ▼                        ▼                        ▼
       [Allow Cloud Sync]        [Allow Cloud Sync]       [QUARANTINE ENFORCED]
       Uploads to central        Uploads to central       • Stored in Qdrant Edge
       Qdrant collection         Qdrant collection        • Stored in SQLite
                                                          • Sync Queue: BLOCKED
                                                          • ZERO Cloud Egress
```

### Verified Guarantees
1. **Zero Cloud Egress**: Memory marked `LOCAL_ONLY` is never serialized into network payloads, cloud vector points, or external telemetry.
2. **Local Search Retained**: The originating device retains 100% offline semantic retrieval capabilities for its own quarantined memories.

---

## 6. Distributed State & Versioning

* **Logical Clocks**: Every node increments a local Lamport clock on every ingestion and sync event to establish a strict partial ordering ($L(e)$).
* **Deterministic Identity**: Memory point identifiers are computed using UUIDv5 under the DNS namespace (`uuid5(NAMESPACE_DNS, memory_id)`), ensuring idempotency during repeated sync attempts.
* **Consistency Model**: Application-level eventual consistency. GhostMesh does not enforce synchronous Raft consensus; instead, it provides deterministic convergence via semantic diffing and provenance recording.

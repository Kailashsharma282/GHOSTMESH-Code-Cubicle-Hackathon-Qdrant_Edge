# GHOSTMESH — 3-Minute Product Demo Video Script
**Hackathon**: Code Cubicle 6.0  
**Track**: Qdrant Edge  
**Team**: infinitehacks  
**Participant**: Pochiraju Kailash Ram Markandeya Sharma (Solo Participant)  
**Target Runtime**: 03:00 (180 Seconds) | 1920x1080 30fps | H.264 / AAC 48kHz  

---

## Storyboard & Narration Breakdown

```
00:00 ─── 00:10 ─── 00:28 ─── 00:50 ─── 01:15 ─── 01:35 ─── 02:00 ─── 02:25 ─── 02:45 ─── 02:58 ── 03:00
 Title    Problem   Edge Mem  Kill Net   Privacy  Reconnect  Conflict  Canonical  Converged  End
 (10s)     (18s)     (22s)     (25s)      (20s)     (25s)     (25s)     (20s)      (13s)    (2s)
```

---

### Scene 1: Title Card (00:00 – 00:10 | 10 seconds)
* **Visual**: Clean black screen with fine technical grid lines. Monospace title typography.
  - Title: **GHOSTMESH**
  - Subtitle: *"Every device remembers alone. Together, they remember everything."*
  - Metadata: Code Cubicle 6.0 • Qdrant Edge Track
  - Team: `infinitehacks` • Pochiraju Kailash Ram Markandeya Sharma (Solo Participant)
* **Audio**: Subtle low-frequency synth swell and restrained cinematic chime.
* **Narration**: *(Silence for 2s, ambient intro)*

---

### Scene 2: The Problem (00:10 – 00:28 | 18 seconds)
* **Visual**: Zoom in to GhostMesh live Memory Radar interface.
  - Three simulated edge nodes: **Device A (Pixel 9 Pro Phone)**, **Device B (MacBook Pro Laptop)**, **Device C (OmniCam Smart Camera)**.
  - Status indicators show all nodes connected, local shard counters visible.
* **Audio**: Soft rhythmic background ambient pulse (subtle, below dialogue).
* **Narration** (Christopher Neural):
  > *"Modern devices create information even when the network disappears. But when connectivity returns, distributed memories can conflict, duplicate each other, or contain information that should never leave the device."*

---

### Scene 3: Edge Memory with Qdrant Edge (00:28 – 00:50 | 22 seconds)
* **Visual**: Live interactive demonstration on Device A.
  - Ingestion of local memory: *"USB-C charger on office desk."*
  - FastEmbed generates 384-dimensional dense vector in-process.
  - On-disk shard in `data/device-a/edge` updates immediately.
  - Local semantic search: *"Where is the charger?"* &rarr; instant match retrieved with similarity score.
* **Narration** (Christopher Neural):
  > *"GhostMesh gives every edge node its own semantic memory using Qdrant Edge, so local search does not depend on the cloud. Here, Device A stores observations directly in its local shard, with instant sub-millisecond retrieval."*

---

### Scene 4: Kill the Network — Offline Intelligence (00:50 – 01:15 | 25 seconds)
* **Visual**: High-impact action sequence.
  - Click **"DISCONNECT DEVICE A"** (Kill Network).
  - Device A status transitions to **OFFLINE** (red badge).
  - Ingest new observation: *"Micro-soldering tip replaced with 0.2mm chisel tip."*
  - Local search succeeds with zero HTTP calls.
  - SQLite queue increments: **PENDING EGRESS: 1**.
* **Audio**: Subtle network disconnect hum + keyboard accent sound.
* **Narration** (Christopher Neural):
  > *"Now we kill the network. Device A is offline, but its memory still works. New observations are indexed locally, while the outgoing sync queue holds them safely until connectivity returns."*

---

### Scene 5: Privacy as a Synchronization Policy (01:15 – 01:35 | 20 seconds)
* **Visual**: Switch to **Privacy View**.
  - Ingest sensitive memory: *"Hardware Lab master password and passport backup placed in drawer lockbox."*
  - Deterministic policy classifier triggers: **LOCAL_ONLY** quarantine.
  - Local storage: **ALLOWED (100% on-device)**. Cloud egress: **BLOCKED**.
* **Narration** (Christopher Neural):
  > *"GhostMesh also treats privacy as a synchronization policy. Sensitive memories remain on the edge instead of being blindly uploaded. Local storage is permitted, but cloud egress is strictly blocked."*

---

### Scene 6: Reconnection & Non-Destructive Sync (01:35 – 02:00 | 25 seconds)
* **Visual**:
  - Click **"RECONNECT DEVICE A"**.
  - Live WebSocket broadcast: `device.connected` &rarr; `sync.started` &rarr; `sync.completed`.
  - Queue drains from pending to synchronized.
  - Sensitive note remains securely quarantined on device.
* **Audio**: Rising harmonic chime indicating node synchronization.
* **Narration** (Christopher Neural):
  > *"When connectivity returns, queued data synchronizes cleanly to Qdrant Server instead of forcing applications to choose between online-only intelligence and offline operation."*

---

### Scene 7: Semantic Conflict — "Why Not Merge?" (02:00 – 02:25 | 25 seconds)
* **Visual**: Switch to **Reconciliation Center**.
  - Display contradictory observations:
    - Device A: *"Blue backpack is on the chair."*
    - Device B: *"Blue backpack is on the floor."*
  - Similarity is high (84%), but factual compatibility is contradictory.
  - Action taken: **KEEP_BOTH**.
  - UI displays explicit explanation: *"Location contradiction detected — preserved both observations without blind overwrite."*
* **Narration** (Christopher Neural):
  > *"The important part is that GhostMesh does not blindly merge similar vectors. Semantic similarity creates a candidate, but the reconciliation layer evaluates evidence, timestamps, confidence, and factual compatibility."*

---

### Scene 8: Semantic Merge & Evidence Provenance (02:25 – 02:45 | 20 seconds)
* **Visual**: Switch to **Forensics & Lineage Graph**.
  - Display charger observations from Device A, B, and C.
  - Mathematical 5-factor scoring breakdown (Semantic 40%, Recency 15%, Confidence 20%, Source 10%, Agreement 15%).
  - Canonical memory synthesized: *"Black USB-C charger beside MacBook on office desk."*
  - Provenance tree links back to all 3 original edge observations with cryptographic hashes.
* **Narration** (Christopher Neural):
  > *"For compatible observations, GhostMesh produces an evidence-backed canonical memory while preserving the complete multi-node provenance chain."*

---

### Scene 9: Final Convergence & System Radar (02:45 – 02:58 | 13 seconds)
* **Visual**: Return to Memory Radar.
  - System status: **100% CONVERGED**.
  - Real counters: 3 Active Edge Nodes, 327 Local Memories, 16 Cloud Reconciliations, 0 Unresolved Conflicts.
* **Narration** (Christopher Neural):
  > *"Every device remembers alone. Together, they remember everything. GhostMesh transforms disconnected edge devices into a unified, privacy-preserving semantic memory fabric."*

---

### Scene 10: End Card (02:58 – 03:00 | 2 seconds)
* **Visual**: Dark technical outro card.
  - **GHOSTMESH**
  - **Code Cubicle 6.0 • Qdrant Edge Track**
  - **infinitehacks** • **Pochiraju Kailash Ram Markandeya Sharma** (Solo Participant)
* **Audio**: Musical fade out to silence.

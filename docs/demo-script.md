# GhostMesh 90-Second Demonstration Script

> **Judge Pitch**: *"Every device remembers alone. Together, they remember everything."*  
> **Target Audience**: Technical Hackathon Judges (Distributed Systems, Edge AI, Vector Databases).  
> **Key Moment**: Disconnecting Device A, observing that it still remembers offline, reconnecting it, and watching the system reason about semantic evidence instead of blindly overwriting data.

---

## Pre-Flight Check (T-minus 10s)
1. Ensure Qdrant Server is running (`docker ps` shows `ghostmesh-qdrant` on port 6333).
2. FastAPI backend is running on `http://127.0.0.1:8088`.
3. Vite frontend is open at `http://localhost:5173`.
4. System Status in Top Bar reads **`CONVERGED`** with 3 nodes active.

---

## Chronological Presentation Flow

| Timeline | Visual Action in UI | Spoken Narrative & Technical Focus |
| :--- | :--- | :--- |
| **00:00 - 00:10** | Open **RADAR** view. Point to central Qdrant Core, surrounding Edge Nodes (A, B, C), and live telemetry ticker. | *"This is GhostMesh. We are demonstrating privacy-preserving, offline-first distributed semantic memory. Notice that each simulated device runs its own independent Qdrant Edge vector shard on local disk with isolated SQLite metadata. The browser is only the instrument console."* |
| **00:10 - 00:20** | Navigate to **MEMORIES** tab. Show evidence rows across Device A (Phone), Device B (Laptop), and Device C (Smart Camera). | *"Each device captures independent semantic observations in the field using local FastEmbed ONNX embeddings. Notice that every record has a Lamport logical clock, confidence score, and deterministic privacy classification."* |
| **00:20 - 00:35** | Click **"KILL NETWORK (DEVICE A)"** button in Top Bar or Radar. Device A changes to `OFFLINE` (amber/gray with severed link indicator). | *"Now, watch what happens when we disconnect Device A from the network. The connection line severs, and the event log immediately broadcasts `device.disconnected`. Device A is now operating completely cut off from the cloud."* |
| **00:35 - 00:45** | Click **"+ NEW MEMORY"** on Device A. Ingest: `"Master root terminal password is delta-mesh-9921"`. Then switch to **SEARCH** tab, select `LOCAL` mode, and search `"Where is the password?"`. | *"While offline, Device A ingests a new confidential credential. Notice two things: First, our local policy engine automatically classifies it as LOCAL_ONLY—quarantined on-device with zero cloud egress. Second, when we search offline, Device A performs sub-5ms local semantic search against its own Qdrant Edge shard. Cloud access was completely bypassed."* |
| **00:45 - 00:55** | Return to Radar. Click **"RECONNECT DEVICE A"**. | *"Now we restore connectivity. Watch the outbound sync queue and the orbital animation around Device A. The system immediately drains pending syncable records, uploads them to Qdrant Cloud, while strictly preserving the quarantine on the local-only credential."* |
| **00:55 - 00:70** | Navigate to **SYNC** view. Show queue draining in real time (`PENDING` $\rightarrow$ `SYNCED`). | *"In the Sync Queue, allowed observations stream to the shared Qdrant Server collection `ghostmesh_memories`, while our local-only secrets remain securely blocked."* |
| **00:70 - 00:80** | Switch to **RECONCILIATION** view. Highlight the active conflict candidate between Device A, B, and C. | *"Here is the core innovation: GhostMesh does NOT blindly overwrite one record with another or use a fragile last-write-wins timestamp. Device A saw 'USB-C charger on office desk', Device B saw 'black charger near laptop', and Device C saw 'charger beside MacBook'. The system detects these are semantically correlated observations of the same physical event."* |
| **00:80 - 00:88** | Click **"INSPECT DIFF & MERGE"**. Show the transparent 5-factor scoring breakdown (Semantic 40%, Recency 15%, Confidence 20%, Source 10%, Agreement 15%) and the Semantic Diff. | *"GhostMesh computes a transparent reconciliation score based on semantic similarity, recency decay, and cross-node agreement. For corroborated duplicates, it synthesizes an extractive Canonical Memory without inventing facts. For true contradictions—like Device A seeing a backpack on a chair while Device B saw it on the floor—it intelligently chooses KEEP_BOTH."* |
| **00:88 - 00:90** | Click **FORENSICS** view. Show the complete evidence graph from Canonical Memory down to source devices. Conclude with tagline. | *"In Forensics, every merged memory retains immutable cryptographic provenance. Nothing is lost. Every device remembers alone. Together, they remember everything."* |

---

## Preset Scenario Triggers

If running in automated/hands-off mode, use the **Scenario Selector** in the Top Bar:
1. **Scenario 1: Offline Memory**: Isolates Device A and executes local vector search.
2. **Scenario 2: Conflict Resolution**: Generates cross-node contradictory observations and triggers the reconciliation arbiter.
3. **Scenario 3: Privacy Quarantine**: Demonstrates deterministic blocking of confidential notes and passwords.
4. **Scenario 4: Three-Node Convergence**: Runs multi-device synchronization to reach 100% convergence.
5. **Scenario 5: Full Automated Demo**: Sequentially executes the full 90-second benchmark script end-to-end.

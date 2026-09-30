# GHOSTMESH — VIDEO PRODUCTION NOTES

**PROJECT:** GHOSTMESH  
**DELIVERABLE:** `GHOSTMESH_CodeCubicle6_Demo.mp4`  
**TARGET DURATION:** 180.0 Seconds (03:00)  
**FORMAT:** High-Definition H.264 / AAC MP4  
**RESOLUTION:** 1920 × 1080 (1080p Full HD)  
**FRAMERATE:** 30.0 fps  
**AUDIO:** 48,000 Hz, Stereo, 256 kbps AAC  

---

## 1. Production Philosophy & Anti-Hallucination Compliance

The demonstration video showcases **actual screen captures of the live running GhostMesh application** executing in a dedicated 1920x1080 Chromium browser session driven by Playwright. No mockups, simulated screenshots, or generic SaaS templates were used.

All metrics, database counts, vector queries, and synchronization events shown in the video correspond 1:1 with real operations in local Qdrant Edge storage and SQLite queue tables.

---

## 2. Audio Engineering & Master Sound Design

### A. Narration Voice
- **Model:** Microsoft Edge Speech Synthesis (`en-US-ChristopherNeural`)
- **Tone:** Authoritative, calm, technical, and precise (pace: ~140 words per minute).
- **Processing:** Normalized to -0.5 dB peak with subtle high-pass filtering (80 Hz cut).

### B. Ambient Musical Score
- **Composition:** Synthesized four-chord progression cycling across D minor, F major, C major, and B-flat major.
- **Harmonics:** Sub-bass sine (36-43 Hz) + fundamental (73-87 Hz) + fifth + gentle shimmering octave.
- **Modulation:** Slow 0.15 Hz stereo chorus with a subtle 2.0-second technical heartbeat pulse.
- **Audio Ducking:** Dynamically calculated using a moving uniform filter (`scipy.ndimage.uniform_filter1d`). Background score volume automatically attenuates to 35% during narration and returns to normal level during transitions.

### C. Technical Sound Effects (SFX)
1. **Network Severing Glitch (52.0s):** Downward frequency chirp (440 Hz -> 240 Hz) indicating connection loss.
2. **Mesh Reconnect Ping (97.0s):** Dual harmonic chime (E5 659 Hz + B5 988 Hz) with exponential decay.
3. **Conflict Alert (121.5s):** Dissonant minor second pulse (Eb4 311 Hz + E4 330 Hz).
4. **Canonical Resolution Chime (147.0s):** Major triad resolution (C5 523 Hz + E5 659 Hz + G5 784 Hz).

---

## 3. Scene-by-Scene Timeline (180.0 Seconds)

| Timestamp | Scene Name | Primary Visual Action | Audio / Narration Track |
| :--- | :--- | :--- | :--- |
| **00:00 – 00:10** | **Title Card** | Clean obsidian title with radar rings, Code Cubicle 6.0, Track, Team, Solo Participant metadata | Ambient synthesizer intro |
| **00:10 – 00:28** | **The Problem** | Memory Radar stage with 3 Edge Nodes (Phone, Laptop, Camera) and Core | Scene 02 Narration: "Modern devices create information even when the network disappears..." |
| **00:28 – 00:50** | **Edge Memory** | Search tab, query "Where is the USB-C charger?", local scope, Qdrant Edge result | Scene 03 Narration: "GhostMesh gives every edge node its own semantic memory using Qdrant Edge..." |
| **00:50 – 01:15** | **Kill Network** | Click ONLINE to sever network; Device A OFFLINE; local note saved to SQLite queue; offline search | Scene 04 Narration: "Now we kill the network. Device A is offline, but its memory still works..." |
| **01:15 – 01:35** | **Privacy Engine** | Privacy tab; input confidential credentials; test policy; LOCAL_ONLY quarantine; cloud blocked | Scene 05 Narration: "GhostMesh also treats privacy as a synchronization policy..." |
| **01:35 – 02:00** | **Reconnect & Drain** | Reconnect Device A; sync triggers; queue drops from 1 to 0; event ticker updates live | Scene 06 Narration: "When connectivity returns, queued data can synchronize..." |
| **02:00 – 02:25** | **Semantic Conflict** | Reconciliation tab; backpack conflict group; "Why Not Merge?" explainability panel | Scene 07 Narration: "The important part is that GhostMesh does not blindly merge similar vectors..." |
| **02:25 – 02:45** | **Semantic Merge** | Forensics tab; canonical charger memory; multi-node provenance tree (A + B + C) | Scene 08 Narration: "For compatible observations, GhostMesh can produce a canonical memory..." |
| **02:45 – 02:57** | **Converged Mesh** | System Info disclosures; Memory Radar showing 100% Convergence across all nodes | Scene 09 Narration: "Every device remembers alone. Together, they remember everything." |
| **02:57 – 03:00** | **Outro Card** | Hackathon credits, participant name, track identity, fade to black | Resolution chime & music fade out |

---

## 4. Video Assembly Pipeline

```
Playwright Screen Capture (Chromium 1920x1080 @ 30fps .webm)
                          │
                          ▼
            FFmpeg Video & Audio Composite
                          ▲
                          │
Master Sound Design Track (48kHz Stereo Ducked Audio .wav)
                          │
                          ▼
             GHOSTMESH_CodeCubicle6_Demo.mp4
```

---

## 5. Verification Checklist

- [x] Correct Hackathon: **Code Cubicle 6.0**
- [x] Correct Track: **Qdrant Edge**
- [x] Correct Team Name: **infinitehacks**
- [x] Correct Solo Participant: **Pochiraju Kailash Ram Markandeya Sharma**
- [x] Actual Live Software Shown (No fake mockups or static slide decks)
- [x] Total Runtime: Exactly **180.0 seconds (03:00)**
- [x] Resolution: **1920 × 1080**
- [x] Framerate: **30 fps**
- [x] Audio: **48 kHz Stereo High-Quality AAC**

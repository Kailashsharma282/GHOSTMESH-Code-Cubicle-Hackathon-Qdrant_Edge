import asyncio
import edge_tts
from pathlib import Path

VOICE = "en-US-ChristopherNeural"
OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "video_assets" / "narration"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SCRIPTS = {
    "scene02_problem": (
        "Modern devices create information even when the network disappears. "
        "But when connectivity returns, distributed memories can conflict, duplicate each other, "
        "or contain information that should never leave the device."
    ),
    "scene03_edge_memory": (
        "GhostMesh gives every edge node its own semantic memory using Qdrant Edge, "
        "so local search does not depend on the cloud. Here, Device A stores observations directly in its local shard, "
        "with instant sub-millisecond retrieval."
    ),
    "scene04_kill_network": (
        "Now we kill the network. Device A is offline, but its memory still works. "
        "New observations are indexed locally, while the outgoing sync queue holds them safely until connectivity returns."
    ),
    "scene05_privacy": (
        "GhostMesh also treats privacy as a synchronization policy. "
        "Sensitive memories remain on the edge instead of being blindly uploaded. "
        "Local storage is permitted, but cloud egress is strictly blocked."
    ),
    "scene06_reconnect": (
        "When connectivity returns, queued data synchronizes cleanly to Qdrant Server "
        "instead of forcing applications to choose between online-only intelligence and offline operation."
    ),
    "scene07_conflict": (
        "The important part is that GhostMesh does not blindly merge similar vectors. "
        "Semantic similarity creates a candidate, but the reconciliation layer evaluates evidence, timestamps, confidence, "
        "and factual compatibility."
    ),
    "scene08_canonical": (
        "For compatible observations, GhostMesh produces an evidence-backed canonical memory "
        "while preserving the complete multi-node provenance chain."
    ),
    "scene09_converged": (
        "Every device remembers alone. Together, they remember everything. "
        "GhostMesh transforms disconnected edge devices into a unified, privacy-preserving semantic memory fabric."
    )
}

async def generate_narration():
    print("Generating voice narration clips with edge_tts...")
    for key, text in SCRIPTS.items():
        out_file = OUT_DIR / f"{key}.mp3"
        print(f"Generating {out_file.name}...")
        communicate = edge_tts.Communicate(text, VOICE, rate="+0%")
        await communicate.save(str(out_file))
        print(f"[OK] Saved {out_file.name}")

if __name__ == "__main__":
    asyncio.run(generate_narration())

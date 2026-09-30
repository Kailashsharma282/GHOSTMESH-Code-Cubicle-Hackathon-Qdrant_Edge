import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8088/api"
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.seed_data import DEVICE_A_MEMORIES, DEVICE_B_MEMORIES, DEVICE_C_MEMORIES

def post_memory(device_id, content, mem_type, confidence, tier=None):
    url = f"{BASE_URL}/devices/{device_id}/memories"
    payload = {
        "content": content,
        "memory_type": mem_type.value if hasattr(mem_type, "value") else str(mem_type),
        "confidence": confidence,
    }
    if tier:
        payload["privacy_tier"] = tier.value if hasattr(tier, "value") else str(tier)
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def sync_device(device_id):
    url = f"{BASE_URL}/devices/{device_id}/sync"
    req = urllib.request.Request(url, data=b"{}", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    print("=" * 60)
    print(" SEEDING GHOSTMESH VIA LIVE API (90+ MEMORIES)")
    print("=" * 60)

    # Reset
    req = urllib.request.Request(f"{BASE_URL}/system/reset", data=b"{}", headers={"Content-Type": "application/json"})
    urllib.request.urlopen(req)
    time.sleep(1.0)
    print("[OK] Reset system to clean state.")

    # Device A
    print(f"Seeding {len(DEVICE_A_MEMORIES)} memories to Device A (Phone)...")
    for content, mem_type, conf, tier in DEVICE_A_MEMORIES:
        post_memory("device-a", content, mem_type, conf, tier)

    # Device B
    print(f"Seeding {len(DEVICE_B_MEMORIES)} memories to Device B (Laptop)...")
    for content, mem_type, conf, tier in DEVICE_B_MEMORIES:
        post_memory("device-b", content, mem_type, conf, tier)

    # Device C
    print(f"Seeding {len(DEVICE_C_MEMORIES)} memories to Device C (Smart Camera)...")
    for content, mem_type, conf, tier in DEVICE_C_MEMORIES:
        post_memory("device-c", content, mem_type, conf, tier)

    # Sync all online nodes
    print("Synchronizing online nodes to Qdrant Cloud...")
    res_a = sync_device("device-a")
    res_b = sync_device("device-b")
    res_c = sync_device("device-c")

    print(f"Sync Results: Device A={res_a['synced']}, Device B={res_b['synced']}, Device C={res_c['synced']}")

    # Check stats
    req = urllib.request.Request(f"{BASE_URL}/system/stats")
    with urllib.request.urlopen(req) as resp:
        stats = json.loads(resp.read().decode("utf-8"))

    print("\n" + "=" * 60)
    print(f" SEEDING COMPLETE!")
    print(f" Local Edge Memories:  {stats['local_memories_total']}")
    print(f" Cloud Memories:       {stats['cloud_memories_total']}")
    print(f" Quarantined Secrets:  {stats['local_only_total']}")
    print(f" Resolved Conflicts:   {stats['conflicts_resolved']}")
    print(f" Mesh Convergence:     {stats['mesh_convergence_percentage']}%")
    print("=" * 60)

if __name__ == "__main__":
    main()

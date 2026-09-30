import subprocess
import sys
import time
import os
import signal
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def main():
    print("=" * 60)
    print(" GHOSTMESH - DISTRIBUTED SEMANTIC MEMORY FABRIC")
    print(" 'Every device remembers alone. Together, they remember everything.'")
    print("=" * 60)

    # 1. Check or start Qdrant Server in Docker
    print("\n[1/3] Checking Qdrant Cloud Server tier (Docker :6333)...")
    try:
        res = subprocess.run(["docker", "ps", "--filter", "name=ghostmesh-qdrant", "--format", "{{.Names}}"], capture_output=True, text=True)
        if "ghostmesh-qdrant" not in res.stdout:
            print("Starting ghostmesh-qdrant Docker container...")
            subprocess.run(["docker", "start", "ghostmesh-qdrant"], check=False)
        print("✓ Qdrant Server container ready at http://localhost:6333")
    except Exception as e:
        print(f"! Docker check note: {e} (Backend will use local server fallback if needed)")

    # 2. Start FastAPI Backend
    print("\n[2/3] Starting GhostMesh FastAPI Backend on http://127.0.0.1:8088...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "apps.api.main:app", "--host", "127.0.0.1", "--port", "8088"],
        cwd=str(ROOT),
        env={**os.environ, "PYTHONPATH": str(ROOT)}
    )

    # Wait for backend
    time.sleep(2)

    # 3. Start Vite Frontend
    print("\n[3/3] Starting Vite Frontend on http://localhost:5173...")
    frontend_dir = ROOT / "apps" / "frontend"
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(frontend_dir)
    )

    print("\n" + "=" * 60)
    print(" GHOSTMESH SYSTEM OPERATIONAL")
    print(" Frontend UI: http://localhost:5173")
    print(" API Backend: http://127.0.0.1:8088")
    print(" API Docs:    http://127.0.0.1:8088/docs")
    print(" Qdrant Dash: http://localhost:6333/dashboard")
    print("=" * 60)
    print("Press Ctrl+C to stop all services.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down GhostMesh services...")
        frontend_proc.terminate()
        backend_proc.terminate()
        frontend_proc.wait()
        backend_proc.wait()
        print("All processes stopped cleanly.")

if __name__ == "__main__":
    main()

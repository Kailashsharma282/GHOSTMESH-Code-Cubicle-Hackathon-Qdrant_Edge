import sqlite3
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path
from apps.api.models.schemas import SyncState, SyncQueueItem

logger = logging.getLogger("ghostmesh.sync_queue")

class DeviceSyncQueue:
    """
    Local persistent SQLite sync queue for an individual edge device.
    Maintains outbound synchronization operations.
    """
    def __init__(self, db_path: Path, device_id: str):
        self.db_path = db_path
        self.device_id = device_id
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sync_queue (
                    sync_id TEXT PRIMARY KEY,
                    memory_id TEXT NOT NULL,
                    device_id TEXT NOT NULL,
                    operation TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    attempt_count INTEGER DEFAULT 0,
                    last_attempt TEXT,
                    status TEXT NOT NULL,
                    error TEXT,
                    privacy_decision TEXT NOT NULL
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_sync_status ON sync_queue(status)")
            conn.commit()

    def enqueue(self, memory_id: str, operation: str, status: SyncState, privacy_decision: str) -> SyncQueueItem:
        sync_id = f"sync-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc).isoformat()
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO sync_queue (sync_id, memory_id, device_id, operation, created_at, attempt_count, status, privacy_decision)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?)
            """, (sync_id, memory_id, self.device_id, operation, now, status.value, privacy_decision))
            conn.commit()
        return SyncQueueItem(
            sync_id=sync_id,
            memory_id=memory_id,
            device_id=self.device_id,
            operation=operation,
            created_at=now,
            attempt_count=0,
            last_attempt=None,
            status=status,
            error=None,
            privacy_decision=privacy_decision
        )

    def get_pending(self, limit: int = 50) -> list[SyncQueueItem]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT * FROM sync_queue
                WHERE status = ?
                ORDER BY created_at ASC
                LIMIT ?
            """, (SyncState.PENDING_UPLOAD.value, limit))
            rows = cursor.fetchall()
            return [
                SyncQueueItem(
                    sync_id=r["sync_id"],
                    memory_id=r["memory_id"],
                    device_id=r["device_id"],
                    operation=r["operation"],
                    created_at=r["created_at"],
                    attempt_count=r["attempt_count"],
                    last_attempt=r["last_attempt"],
                    status=SyncState(r["status"]),
                    error=r["error"],
                    privacy_decision=r["privacy_decision"]
                )
                for r in rows
            ]

    def update_status(self, sync_id: str, status: SyncState, error: str | None = None):
        now = datetime.now(timezone.utc).isoformat()
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                UPDATE sync_queue
                SET status = ?,
                    last_attempt = ?,
                    attempt_count = attempt_count + 1,
                    error = ?
                WHERE sync_id = ?
            """, (status.value, now, error, sync_id))
            conn.commit()

    def get_all_items(self, limit: int = 100) -> list[SyncQueueItem]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT * FROM sync_queue
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            return [
                SyncQueueItem(
                    sync_id=r["sync_id"],
                    memory_id=r["memory_id"],
                    device_id=r["device_id"],
                    operation=r["operation"],
                    created_at=r["created_at"],
                    attempt_count=r["attempt_count"],
                    last_attempt=r["last_attempt"],
                    status=SyncState(r["status"]),
                    error=r["error"],
                    privacy_decision=r["privacy_decision"]
                )
                for r in rows
            ]

    def count_pending(self) -> int:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM sync_queue WHERE status = ?", (SyncState.PENDING_UPLOAD.value,))
            return cursor.fetchone()[0]

    def clear(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("DELETE FROM sync_queue")
            conn.commit()

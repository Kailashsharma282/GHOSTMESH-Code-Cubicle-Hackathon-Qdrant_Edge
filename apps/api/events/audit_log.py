import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from apps.api.config import settings

logger = logging.getLogger("ghostmesh.audit")

class AuditLogger:
    def __init__(self):
        self.db_path = settings.DATA_DIR / "audit_log.sqlite"
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    device_id TEXT,
                    memory_id TEXT,
                    operation TEXT NOT NULL,
                    event TEXT NOT NULL,
                    duration_ms REAL,
                    result TEXT NOT NULL,
                    details TEXT
                )
            """)
            conn.commit()

    def log(
        self,
        operation: str,
        event: str,
        result: str,
        device_id: str | None = None,
        memory_id: str | None = None,
        duration_ms: float = 0.0,
        details: str = ""
    ):
        ts = datetime.now(timezone.utc).isoformat()
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    """
                    INSERT INTO audit_logs (timestamp, device_id, memory_id, operation, event, duration_ms, result, details)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (ts, device_id, memory_id, operation, event, duration_ms, result, details)
                )
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to record audit log: {e}")

audit_logger = AuditLogger()

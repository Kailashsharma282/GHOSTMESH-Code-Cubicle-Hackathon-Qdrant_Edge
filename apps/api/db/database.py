"""
GhostMesh Central Database Engine
Supports Neon Serverless PostgreSQL (Production) with SQLite Fallback (Local).
"""

import json
import logging
from typing import Any
from sqlalchemy import create_engine, text, Table, Column, Integer, String, Float, Text as SQLText, MetaData
from apps.api.config import settings

logger = logging.getLogger("ghostmesh.database")

class CentralDatabase:
    def __init__(self):
        self.engine = None
        self.is_connected = False
        self.db_type = "SQLite (Local)"
        self._init_db()

    def _init_db(self):
        db_url = settings.normalized_database_url
        if db_url and ("postgres" in db_url or "postgresql" in db_url):
            try:
                logger.info("Initializing Neon PostgreSQL connection pool...")
                # Connect with Neon serverless optimizations: pool_pre_ping & connection timeout
                self.engine = create_engine(
                    db_url,
                    pool_pre_ping=True,
                    pool_recycle=300,
                    connect_args={"connect_timeout": 10}
                )
                with self.engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                self.is_connected = True
                self.db_type = "Neon PostgreSQL (Cloud)"
                logger.info("Successfully connected to Neon Serverless PostgreSQL!")
                self._create_tables()
            except Exception as e:
                logger.warning(f"Could not connect to Neon PostgreSQL ({e}). Falling back to local SQLite.")
                self.is_connected = False
                self.db_type = "SQLite (Fallback)"
        else:
            logger.info("No DATABASE_URL configured. Using local SQLite for central persistence.")
            self.is_connected = False
            self.db_type = "SQLite (Local Edge)"

    def _create_tables(self):
        if not self.engine:
            return
        try:
            with self.engine.begin() as conn:
                # 1. Central Audit Logs table
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS ghostmesh_central_audit (
                        id SERIAL PRIMARY KEY,
                        timestamp TIMESTAMPTZ NOT NULL,
                        device_id VARCHAR(64) NOT NULL,
                        memory_id VARCHAR(128),
                        operation VARCHAR(64) NOT NULL,
                        event_name VARCHAR(128) NOT NULL,
                        duration_ms FLOAT,
                        details JSONB
                    );
                """))

                # 2. Central Reconciliation Decisions table
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS ghostmesh_central_decisions (
                        decision_id VARCHAR(64) PRIMARY KEY,
                        conflict_group_id VARCHAR(64) NOT NULL,
                        action VARCHAR(32) NOT NULL,
                        canonical_memory_id VARCHAR(128),
                        canonical_content TEXT,
                        reconciliation_score FLOAT,
                        scores_breakdown JSONB,
                        provenance JSONB,
                        explanation TEXT,
                        created_at TIMESTAMPTZ NOT NULL
                    );
                """))

                # 3. Central Conflicts table
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS ghostmesh_central_conflicts (
                        conflict_group_id VARCHAR(64) PRIMARY KEY,
                        memory_ids JSONB,
                        devices JSONB,
                        semantic_similarity FLOAT,
                        proposed_action VARCHAR(32),
                        reconciliation_score FLOAT,
                        status VARCHAR(32),
                        explanation TEXT,
                        canonical_proposal TEXT,
                        created_at TIMESTAMPTZ NOT NULL
                    );
                """))
            logger.info("Neon PostgreSQL central schema initialized successfully.")
        except Exception as e:
            logger.error(f"Error creating Neon PostgreSQL tables: {e}")

    def log_audit(self, device_id: str, operation: str, event_name: str, memory_id: str | None = None, duration_ms: float | None = None, details: dict | None = None):
        if not self.is_connected or not self.engine:
            return
        try:
            with self.engine.begin() as conn:
                conn.execute(
                    text("""
                        INSERT INTO ghostmesh_central_audit 
                        (timestamp, device_id, memory_id, operation, event_name, duration_ms, details)
                        VALUES (NOW(), :dev_id, :mem_id, :op, :event, :duration, :details)
                    """),
                    {
                        "dev_id": device_id,
                        "mem_id": memory_id,
                        "op": operation,
                        "event": event_name,
                        "duration": duration_ms,
                        "details": json.dumps(details or {})
                    }
                )
        except Exception as e:
            logger.debug(f"Neon audit insert failed: {e}")

    def save_reconciliation_decision(self, decision_dict: dict[str, Any]):
        if not self.is_connected or not self.engine:
            return
        try:
            with self.engine.begin() as conn:
                conn.execute(
                    text("""
                        INSERT INTO ghostmesh_central_decisions 
                        (decision_id, conflict_group_id, action, canonical_memory_id, canonical_content, 
                         reconciliation_score, scores_breakdown, provenance, explanation, created_at)
                        VALUES (:dec_id, :conf_id, :action, :canon_id, :canon_content, 
                                :score, :scores_json, :prov_json, :explanation, NOW())
                        ON CONFLICT (decision_id) DO UPDATE SET
                            action = EXCLUDED.action,
                            canonical_content = EXCLUDED.canonical_content,
                            reconciliation_score = EXCLUDED.reconciliation_score;
                    """),
                    {
                        "dec_id": decision_dict["decision_id"],
                        "conf_id": decision_dict["conflict_group_id"],
                        "action": decision_dict["action"],
                        "canon_id": decision_dict.get("canonical_memory_id"),
                        "canon_content": decision_dict.get("canonical_content"),
                        "score": decision_dict.get("reconciliation_score", 0.0),
                        "scores_json": json.dumps(decision_dict.get("scores_breakdown", {})),
                        "prov_json": json.dumps(decision_dict.get("provenance", [])),
                        "explanation": decision_dict.get("explanation", "")
                    }
                )
        except Exception as e:
            logger.debug(f"Neon decision insert failed: {e}")

    def get_status(self) -> dict[str, Any]:
        return {
            "type": self.db_type,
            "connected": self.is_connected,
            "neon_enabled": bool(settings.DATABASE_URL)
        }

central_db = CentralDatabase()

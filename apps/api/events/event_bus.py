import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from collections import deque
from typing import Any
from fastapi import WebSocket

logger = logging.getLogger("ghostmesh.events")

class EventBus:
    def __init__(self, max_history: int = 500):
        self.max_history = max_history
        self._history: deque[dict[str, Any]] = deque(maxlen=max_history)
        self._subscribers: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self._subscribers.add(websocket)
        logger.info(f"WebSocket client connected. Active subscribers: {len(self._subscribers)}")
        # Send recent events to catch up
        for event in list(self._history)[-30:]:
            try:
                await websocket.send_text(json.dumps(event))
            except Exception:
                break

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            self._subscribers.discard(websocket)
        logger.info(f"WebSocket client disconnected. Active subscribers: {len(self._subscribers)}")

    async def publish(
        self,
        event_type: str,
        device_id: str | None = None,
        memory_id: str | None = None,
        details: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        event = {
            "event_id": f"evt-{uuid.uuid4().hex[:8]}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "device_id": device_id,
            "memory_id": memory_id,
            "details": details or {}
        }
        
        self._history.append(event)
        
        # Non-blocking broadcast to all active websockets
        payload = json.dumps(event)
        dead_clients = []
        async with self._lock:
            subscribers_snapshot = list(self._subscribers)
            
        for ws in subscribers_snapshot:
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.warning(f"Failed to send event to client: {e}")
                dead_clients.append(ws)
                
        if dead_clients:
            async with self._lock:
                for ws in dead_clients:
                    self._subscribers.discard(ws)

        return event

    def get_recent_events(self, limit: int = 100) -> list[dict[str, Any]]:
        return list(self._history)[-limit:]

event_bus = EventBus()

import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from apps.api.config import settings
from apps.api.embeddings.provider import embedding_provider
from apps.api.cloud.qdrant_cloud import cloud_client
from apps.api.edge.edge_manager import edge_manager
from apps.api.events.event_bus import event_bus
from apps.api.routes.devices import router as devices_router
from apps.api.routes.conflicts import router as conflicts_router
from apps.api.routes.search import router as search_router
from apps.api.routes.memories import router as memories_router
from apps.api.routes.privacy import router as privacy_router
from apps.api.routes.system import router as system_router
from apps.api.routes.scenarios import router as scenarios_router
from apps.api.routes.health import router as health_router

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ghostmesh.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing GHOSTMESH Distributed Semantic Memory Fabric...")
    # 1. Warm up embedding provider
    _ = embedding_provider.dimension
    # 2. Check cloud client
    logger.info(f"Cloud tier status: {cloud_client.connection_mode}")
    # 3. Check edge nodes
    logger.info(f"Initialized {len(edge_manager.nodes)} Edge Nodes: {list(edge_manager.nodes.keys())}")
    
    yield
    
    logger.info("Shutting down GhostMesh...")
    for node in edge_manager.nodes.values():
        node.store.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Privacy-Preserving Offline-First Distributed Semantic Memory with Qdrant Edge + Qdrant Server",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(health_router)
app.include_router(devices_router)
app.include_router(conflicts_router)
app.include_router(search_router)
app.include_router(memories_router)
app.include_router(privacy_router)
app.include_router(system_router)
app.include_router(scenarios_router)

@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "status": "OPERATIONAL",
        "simulation_mode": "3 Edge Nodes",
        "cloud_tier": cloud_client.connection_mode,
        "embedding_model": settings.EMBEDDING_MODEL
    }

@app.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    await event_bus.connect(websocket)
    try:
        while True:
            # Keep alive and receive any incoming control pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await event_bus.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        await event_bus.disconnect(websocket)

import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "GHOSTMESH"
    TAGLINE: str = "Every device remembers alone. Together, they remember everything."
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Server Binding
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8088"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Security & CORS
    CORS_ORIGINS_RAW: str = os.getenv("CORS_ORIGINS", "*")
    GHOSTMESH_API_KEY: str | None = os.getenv("GHOSTMESH_API_KEY", None)
    
    @property
    def cors_origins(self) -> list[str]:
        if self.CORS_ORIGINS_RAW == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS_RAW.split(",") if origin.strip()]
    
    # Central Database (Neon PostgreSQL / Serverless Postgres)
    DATABASE_URL: str | None = os.getenv("DATABASE_URL", None)
    
    @property
    def normalized_database_url(self) -> str | None:
        if not self.DATABASE_URL:
            return None
        url = self.DATABASE_URL
        # SQLAlchemy requires postgresql:// instead of postgres://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    # Qdrant Cloud / Server Configuration
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    QDRANT_API_KEY: str | None = os.getenv("QDRANT_API_KEY", None)
    CLOUD_COLLECTION: str = os.getenv("CLOUD_COLLECTION", "ghostmesh_memories")
    
    # Local Persistence Base Directory
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = Path(os.getenv("EDGE_DATA_DIR", str(BASE_DIR / "data")))
    
    # Local In-Process Embedding Model (FastEmbed)
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
    VECTOR_DIM: int = 384
    FASTEMBED_CACHE_DIR: str | None = os.getenv("FASTEMBED_CACHE_DIR", None)
    
    # Edge Devices in Simulation Mode
    DEVICES: list[str] = ["device-a", "device-b", "device-c"]
    
    # Reconciliation Engine Configuration
    RECONCILIATION_THRESHOLD: float = float(os.getenv("RECONCILIATION_THRESHOLD", "0.78"))
    DUPLICATE_THRESHOLD: float = float(os.getenv("DUPLICATE_THRESHOLD", "0.93"))
    
    # Transparent Reconciliation Weights
    W_SEMANTIC: float = 0.40
    W_RECENCY: float = 0.15
    W_CONFIDENCE: float = 0.20
    W_SOURCE: float = 0.10
    W_AGREEMENT: float = 0.15
    
    # Sync Configuration
    AUTO_SYNC_INTERVAL: float = 5.0  # seconds
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

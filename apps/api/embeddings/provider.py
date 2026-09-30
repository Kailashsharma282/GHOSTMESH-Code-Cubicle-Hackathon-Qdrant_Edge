import hashlib
import time
import logging
from fastembed import TextEmbedding
from apps.api.config import settings

logger = logging.getLogger("ghostmesh.embeddings")

class EmbeddingProvider:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingProvider, cls).__new__(cls)
            logger.info(f"Initializing local FastEmbed TextEmbedding model: {settings.EMBEDDING_MODEL}")
            cls._model = TextEmbedding(model_name=settings.EMBEDDING_MODEL)
            logger.info("FastEmbed model loaded successfully in-process.")
        return cls._instance

    @property
    def is_ready(self) -> bool:
        return self._model is not None

    @property
    def dimension(self) -> int:
        return settings.VECTOR_DIM

    def embed_text(self, text: str) -> list[float]:
        t0 = time.perf_counter()
        embeddings = list(self._model.embed([text]))
        duration_ms = (time.perf_counter() - t0) * 1000.0
        vec = embeddings[0].tolist() if hasattr(embeddings[0], "tolist") else list(embeddings[0])
        logger.debug(f"Embedded text ({len(text)} chars) -> dim {len(vec)} in {duration_ms:.2f}ms")
        return vec

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        t0 = time.perf_counter()
        embeddings = list(self._model.embed(texts))
        duration_ms = (time.perf_counter() - t0) * 1000.0
        result = [
            (e.tolist() if hasattr(e, "tolist") else list(e))
            for e in embeddings
        ]
        logger.debug(f"Embedded batch of {len(texts)} texts in {duration_ms:.2f}ms")
        return result

    @staticmethod
    def compute_semantic_hash(text: str) -> str:
        # Normalized text hash
        normalized = " ".join(text.lower().strip().split())
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]

embedding_provider = EmbeddingProvider()

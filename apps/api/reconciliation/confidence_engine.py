from apps.api.config import settings

class ConfidenceEngine:
    """
    Computes transparent, weighted reconciliation scores.
    Formula:
    reconciliation_score =
        W_SEMANTIC * semantic_score
      + W_RECENCY * recency_score
      + W_CONFIDENCE * confidence_score
      + W_SOURCE * source_score
      + W_AGREEMENT * agreement_score
    """
    def calculate_score(
        self,
        semantic_similarity: float,
        recency_delta_seconds: float,
        source_confidences: list[float],
        distinct_device_count: int,
        total_sources: int
    ) -> tuple[float, dict[str, float]]:
        # 1. Semantic score [0.0 - 1.0]
        semantic_score = max(0.0, min(1.0, semantic_similarity))

        # 2. Recency score (decay with time difference, within 1 hour = high)
        # 3600 sec = 1 hr half-life decay
        recency_score = max(0.0, min(1.0, 1.0 / (1.0 + (recency_delta_seconds / 3600.0))))

        # 3. Average source confidence [0.0 - 1.0]
        confidence_score = sum(source_confidences) / max(1, len(source_confidences))

        # 4. Source diversity score (reward corroboration across devices)
        # 3 devices = 1.0, 2 devices = 0.8, 1 device = 0.5
        source_score = 1.0 if distinct_device_count >= 3 else (0.8 if distinct_device_count == 2 else 0.5)

        # 5. Agreement score (higher when multiple nodes agree)
        agreement_score = min(1.0, 0.70 + (0.10 * distinct_device_count))

        composite = (
            settings.W_SEMANTIC * semantic_score
          + settings.W_RECENCY * recency_score
          + settings.W_CONFIDENCE * confidence_score
          + settings.W_SOURCE * source_score
          + settings.W_AGREEMENT * agreement_score
        )

        breakdown = {
            "semantic_score": round(semantic_score, 3),
            "recency_score": round(recency_score, 3),
            "confidence_score": round(confidence_score, 3),
            "source_score": round(source_score, 3),
            "agreement_score": round(agreement_score, 3),
        }

        return round(composite, 3), breakdown

confidence_engine = ConfidenceEngine()

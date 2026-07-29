from typing import List, Dict
from dataclasses import dataclass
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SearchResult:
    """
    Represents a search result with id, score, and payload.
    """
    id: str
    score: float
    payload: Dict[str, any]

class ReciprocalRankFusion:
    """
    Implements Reciprocal Rank Fusion (RRF) for combining results from multiple retrieval methods.
    """

    def __init__(self, k: int = 60):
        """
        Initialize the Reciprocal Rank Fusion instance.

        Args:
            k (int): The rank normalization factor for RRF. Default is 60.
        """
        self.k = k

    def fuse(self, dense_results: List[SearchResult], sparse_results: List[SearchResult]) -> List[SearchResult]:
        """
        Fuse results from Dense and Sparse Retrieval using Reciprocal Rank Fusion.

        Args:
            dense_results (List[SearchResult]): Results from Dense Retrieval.
            sparse_results (List[SearchResult]): Results from Sparse Retrieval.

        Returns:
            List[SearchResult]: Combined and ranked results.
        """
        try:
            logger.info("Starting Reciprocal Rank Fusion with k=%d.", self.k)

            # Create a dictionary to store cumulative scores
            fused_scores: Dict[str, float] = {}
            result_payloads: Dict[str, Dict[str, any]] = {}

            # Process dense results
            self._update_scores(fused_scores, result_payloads, dense_results, "dense")

            # Process sparse results
            self._update_scores(fused_scores, result_payloads, sparse_results, "sparse")

            # Remove duplicates based on chunk_id
            unique_results = self._remove_duplicates(fused_scores, result_payloads)

            # Sort results by cumulative score in descending order
            ranked_results = sorted(
                unique_results,
                key=lambda x: x.score,
                reverse=True,
            )

            logger.info("Reciprocal Rank Fusion completed. Total fused results: %d.", len(ranked_results))
            return ranked_results

        except Exception as e:
            logger.error("Reciprocal Rank Fusion failed: %s", str(e))
            raise

    def _update_scores(
        self,
        fused_scores: Dict[str, float],
        result_payloads: Dict[str, Dict[str, any]],
        results: List[SearchResult],
        source: str,
    ) -> None:
        """
        Update cumulative scores for results from a specific retrieval source.

        Args:
            fused_scores (Dict[str, float]): Dictionary to store cumulative scores.
            result_payloads (Dict[str, Dict[str, any]]): Dictionary to store result payloads.
            results (List[SearchResult]): Results from a retrieval source.
            source (str): Source of the results (e.g., "dense" or "sparse").
        """
        for rank, result in enumerate(results, start=1):
            # RRF score calculation: 1 / (rank + k)
            score_contribution = 1 / (rank + self.k)

            if result.id not in fused_scores:
                fused_scores[result.id] = 0.0
                result_payloads[result.id] = result.payload

            fused_scores[result.id] += score_contribution

            logger.debug(
                "Updated score for result ID '%s' from %s retrieval: +%.6f (Rank: %d)",
                result.id,
                source,
                score_contribution,
                rank,
            )

    def _remove_duplicates(
        self, 
        fused_scores: Dict[str, float], 
        result_payloads: Dict[str, Dict[str, any]]
    ) -> List[SearchResult]:
        """
        Remove duplicate results based on chunk_id while preserving the highest score.

        Args:
            fused_scores (Dict[str, float]): Dictionary of cumulative scores.
            result_payloads (Dict[str, Dict[str, any]]): Dictionary of result payloads.

        Returns:
            List[SearchResult]: Deduplicated list of SearchResult objects.
        """
        seen_chunk_ids = set()
        unique_results = []

        for result_id, score in fused_scores.items():
            payload = result_payloads[result_id]
            chunk_id = payload.get("chunk_id")

            # Skip results with missing chunk_id
            if not chunk_id:
                logger.warning("Result ID '%s' is missing 'chunk_id'. Skipping.", result_id)
                continue

            # Ensure payload contains required fields for citation support
            if not all(key in payload for key in ["chunk_id", "document_name", "text"]):
                logger.warning("Result ID '%s' has an incomplete payload. Skipping.", result_id)
                continue

            # Add result if chunk_id is unique
            if chunk_id not in seen_chunk_ids:
                seen_chunk_ids.add(chunk_id)
                unique_results.append(SearchResult(id=result_id, score=score, payload=payload))

        logger.info("Removed duplicates. Unique results count: %d.", len(unique_results))
        return unique_results


if __name__ == "__main__":
    # Example dense and sparse results
    dense_results = [
        SearchResult(id="1", score=0.9, payload={"chunk_id": "c1", "document_name": "doc1", "text": "Dense text 1", "domain": "HR"}),
        SearchResult(id="2", score=0.8, payload={"chunk_id": "c2", "document_name": "doc2", "text": "Dense text 2", "domain": "IT"})
    ]

    sparse_results = [
        SearchResult(id="2", score=0.85, payload={"chunk_id": "c2", "document_name": "doc2", "text": "Sparse text 2", "domain": "IT"}),
        SearchResult(id="3", score=0.7, payload={"chunk_id": "c3", "document_name": "doc3", "text": "Sparse text 3", "domain": "Finance"})
    ]

    # Perform Reciprocal Rank Fusion
    rrf = ReciprocalRankFusion(k=60)
    fused_results = rrf.fuse(dense_results, sparse_results)

    # Print fused results
    for result in fused_results:
        print(result)
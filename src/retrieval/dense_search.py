from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from src.ingestion.embedding import EmbeddingGenerator
from qdrant_client import QdrantClient
from qdrant_client.http.models import ScoredPoint, Filter, FieldCondition, MatchValue
import logging
import os

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
    payload: Dict[str, Any]

class DenseSearch:
    """
    A class to perform dense vector search using Qdrant and SentenceTransformer.
    """

    def __init__(self, qdrant_url: str = "http://localhost:6333", collection_name: Optional[str] = None, top_k: int = 10):
        """
        Initialize the DenseSearch instance.

        Args:
            qdrant_url (str): The URL of the Qdrant instance.
            collection_name (str): The name of the Qdrant collection to search.
            top_k (int): Number of top results to retrieve.
        """
        self.qdrant_url = qdrant_url or os.getenv("QDRANT_URL", "http://localhost:6333")
        self.collection_name = (
            collection_name
            or os.getenv("QDRANT_COLLECTION")
            or os.getenv("QDRANT_COLLECTION_NAME")
            or "documents"
        )
        self.top_k = top_k

        if not self.collection_name:
            raise ValueError("Collection name must be provided or set in the environment variable 'QDRANT_COLLECTION'.")

        try:
            self.qdrant_client = QdrantClient(url=self.qdrant_url)
            logger.info("Successfully connected to Qdrant at %s", self.qdrant_url)
        except Exception as e:
            logger.error("Failed to connect to Qdrant: %s", str(e))
            raise

        try:
            self.model = EmbeddingGenerator().model
            logger.info("Loaded embedding model: intfloat/multilingual-e5-base via EmbeddingGenerator")
        except Exception as e:
            logger.error("Failed to load embedding model: %s", str(e))
            raise

    def _format_query(self, query: str) -> str:
        """
        Format the user query according to E5 rules.

        Args:
            query (str): The user query.

        Returns:
            str: Formatted query.
        """
        formatted_query = f"query: {query}"
        logger.debug("Formatted query: %s", formatted_query)
        return formatted_query

    def _build_filter(self, domain: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> Optional[Filter]:
        """
        Build a Qdrant filter for domain and metadata-based filtering.

        Args:
            domain (str): The domain to filter by.
            metadata (Dict[str, Any]): Additional metadata filters.

        Returns:
            Filter: Qdrant filter object.
        """
        conditions = []

        if domain:
            conditions.append(FieldCondition(key="domain", match=MatchValue(value=domain)))
            logger.debug("Added domain filter: %s", domain)

        if metadata:
            for key, value in metadata.items():
                conditions.append(FieldCondition(key=key, match=MatchValue(value=value)))
                logger.debug("Added metadata filter: %s = %s", key, value)

        filter_object = Filter(must=conditions) if conditions else None
        logger.debug("Built filter: %s", filter_object)
        return filter_object

    def search(self, query: str, domain: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None, top_k: Optional[int] = None) -> List[SearchResult]:
        """
        Perform a dense vector search.

        Args:
            query (str): The user query.
            domain (str): The domain to filter by.
            metadata (Dict[str, Any]): Additional metadata filters.
            top_k (int): Number of top results to retrieve.

        Returns:
            List[SearchResult]: List of search results.
        """
        try:
            formatted_query = self._format_query(query)
            query_vector = self.model.encode(formatted_query, normalize_embeddings=True)
            logger.info("Query vector generated successfully.")

            search_filter = self._build_filter(domain, metadata)
            top_k = top_k or self.top_k

            results = self.qdrant_client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                query_filter=search_filter,
                limit=top_k,
            ).points

            logger.info("Search completed successfully with %d results.", len(results))
            return [
                SearchResult(
                    id=result.id,
                    score=result.score,
                    payload={
                        "chunk_id": result.payload.get("chunk_id"),
                        "document_name": result.payload.get("document_name"),
                        "text": result.payload.get("text"),
                        "domain": result.payload.get("domain"),
                        "page": result.payload.get("page"),
                    },
                )
                for result in results
            ]

        except Exception as e:
            logger.error("Search failed: %s", str(e))
            raise


if __name__ == "__main__":
    try:
        # Initialize DenseSearch
        dense_search = DenseSearch(qdrant_url="http://localhost:6333", collection_name="my_collection", top_k=5)

        # Perform a search
        results = dense_search.search(
            query="What are the HR policies for remote work?",
            domain="HR",
            metadata={"policy_type": "remote_work"},
            top_k=3
        )

        # Print results
        for result in results:
            print(result)

    except Exception as e:
        logger.error("An error occurred during the dense search: %s", str(e))
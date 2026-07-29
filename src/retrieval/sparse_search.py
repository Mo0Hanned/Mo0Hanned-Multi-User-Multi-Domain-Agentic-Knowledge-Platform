from typing import List, Dict, Any
from dataclasses import dataclass
from rank_bm25 import BM25Okapi
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Document:
    """
    Represents a document with text and metadata.
    """
    id: str
    text: str
    metadata: Dict[str, Any]

@dataclass
class SearchResult:
    """
    Represents a search result with id, score, and payload.
    """
    id: str
    score: float
    payload: Dict[str, Any]

class SparseSearch:
    """
    A class to perform sparse retrieval using BM25.
    """

    def __init__(self) -> None:
        """
        Initializes the SparseSearch instance.
        """
        self.bm25 = None
        self.documents: List[Document] = []
        self.tokenized_corpus: List[List[str]] = []

    def index_documents(self, documents: List[Document]) -> None:
        """
        Indexes the given documents for BM25 retrieval.

        Args:
            documents (List[Document]): A list of documents to index.
        """
        try:
            self.documents = documents
            self.tokenized_corpus = self._tokenize_documents(documents)
            self.bm25 = BM25Okapi(self.tokenized_corpus)
            logger.info("Successfully indexed %d documents.", len(documents))
        except Exception as e:
            logger.error("Failed to index documents: %s", str(e))
            raise

    def _tokenize_documents(self, documents: List[Document]) -> List[List[str]]:
        """
        Tokenizes the text of each document.

        Args:
            documents (List[Document]): A list of documents to tokenize.

        Returns:
            List[List[str]]: A list of tokenized documents.
        """
        try:
            tokenized = [doc.text.split() for doc in documents]
            logger.info("Successfully tokenized %d documents.", len(documents))
            return tokenized
        except Exception as e:
            logger.error("Failed to tokenize documents: %s", str(e))
            raise

    def search(self, query: str, top_k: int = 10) -> List[SearchResult]:
        """
        Performs a sparse retrieval search using BM25.

        Args:
            query (str): The user query.
            top_k (int): The number of top results to retrieve.

        Returns:
            List[SearchResult]: A list of search results.
        """
        if not self.bm25:
            raise ValueError("BM25 index is not initialized. Please index documents first.")

        try:
            tokenized_query = query.split()
            scores = self.bm25.get_scores(tokenized_query)
            top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

            results = []
            for idx in top_indices:
                document = self.documents[idx]
                results.append(
                    SearchResult(
                        id=document.id,
                        score=scores[idx],
                        payload={
                            "chunk_id": document.id,
                            "document_name": document.metadata.get("document_name"),
                            "text": document.text,
                            "domain": document.metadata.get("domain"),
                            "page": document.metadata.get("page"),
                        },
                    )
                )

            logger.info("Search completed successfully with %d results.", len(results))
            return results
        except Exception as e:
            logger.error("Search failed: %s", str(e))
            raise

if __name__ == "__main__":
    # Example documents
    documents = [
        Document(id="1", text="This is the first document.", metadata={"document_name": "doc1", "domain": "HR"}),
        Document(id="2", text="This is the second document.", metadata={"document_name": "doc2", "domain": "IT"}),
        Document(id="3", text="This is the third document.", metadata={"document_name": "doc3", "domain": "Finance"}),
    ]

    # Initialize SparseSearch
    sparse_search = SparseSearch()

    # Index documents
    sparse_search.index_documents(documents)

    # Perform a search
    query = "first document"
    results = sparse_search.search(query, top_k=2)

    # Print results
    for result in results:
        logger.info("Search result: %s", result)
    
import os

from dotenv import load_dotenv
from langchain_core.documents import Document
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    PointStruct,
    VectorParams,
)

load_dotenv()


class QdrantConnector:
    """
    Handles all Qdrant operations.
    """

    def __init__(self):
        self.collection_name = os.getenv(
            "QDRANT_COLLECTION",
            "documents",
        )

        qdrant_url = os.getenv(
            "QDRANT_URL",
            "http://localhost:6333",
        )

        api_key = os.getenv("QDRANT_API_KEY")

        # Only use the API key if it is actually provided
        if api_key:
            self.client = QdrantClient(
                url=qdrant_url,
                api_key=api_key,
            )
        else:
            self.client = QdrantClient(
                url=qdrant_url,
            )

    def create_collection(
        self,
        vector_size: int,
    ) -> None:
        """
        Create the collection if it does not already exist.
        """

        collections = self.client.get_collections()

        collection_names = [
            collection.name
            for collection in collections.collections
        ]

        if self.collection_name not in collection_names:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE,
                ),
            )

    def upload_documents(
        self,
        vectors: list[list[float]],
        documents: list[Document],
    ) -> None:
        """
        Upload document embeddings to Qdrant.
        """

        if not vectors:
            return

        points = []

        for vector, document in zip(vectors, documents):
            points.append(
                PointStruct(
                    id=document.metadata["chunk_id"],
                    vector=vector,
                    payload={
                        "text": document.page_content,
                        **document.metadata,
                    },
                )
            )

        self.client.upsert(
            collection_name=self.collection_name,
            points=points,
        )

    def search(
        self,
        query_vector: list[float],
        limit: int = 5,
    ):
        """
        Search similar documents.
        """

        return self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=limit,
        )

    def delete_collection(self):
        """
        Delete the collection if it exists.
        """

        collections = self.client.get_collections()

        collection_names = [
            collection.name
            for collection in collections.collections
        ]

        if self.collection_name in collection_names:
            self.client.delete_collection(
                collection_name=self.collection_name,
            )

    def collection_exists(self) -> bool:
        """
        Check whether the collection exists.
        """

        collections = self.client.get_collections()

        collection_names = [
            collection.name
            for collection in collections.collections
        ]

        return self.collection_name in collection_names

    def file_exists(self, file_name: str) -> bool:
        """
        Check if a file with the given name already exists in the collection.
        """
        if not self.collection_exists():
            return False

        from qdrant_client.models import Filter, FieldCondition, MatchValue

        points, _ = self.client.scroll(
            collection_name=self.collection_name,
            scroll_filter=Filter(
                must=[
                    FieldCondition(
                        key="document_name",
                        match=MatchValue(value=file_name)
                    )
                ]
            ),
            limit=1
        )
        return len(points) > 0
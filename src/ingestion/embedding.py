from langchain_core.documents import Document
from sentence_transformers import SentenceTransformer


class EmbeddingGenerator:
    """
    Generates embeddings for documents and queries using
    the multilingual E5 model.

    The embedding model is loaded only once (Singleton pattern)
    and shared across all instances.
    """

    _model = None

    def __init__(
        self,
        model_name: str = "intfloat/multilingual-e5-base",
    ):
        if EmbeddingGenerator._model is None:
            print("Loading embedding model...")
            try:
                EmbeddingGenerator._model = SentenceTransformer(model_name)
            except Exception as e:
                if "out of memory" in str(e).lower():
                    print("CUDA OutOfMemory: Falling back to CPU for embeddings...")
                    import torch
                    import gc
                    torch.cuda.empty_cache()
                    gc.collect()
                    EmbeddingGenerator._model = SentenceTransformer(model_name, device="cpu")
                else:
                    raise e
            print("Embedding model loaded successfully.")

        self.model = EmbeddingGenerator._model

    def embed_documents(
        self,
        documents: list[Document],
    ) -> list[list[float]]:
        """
        Generate embeddings for LangChain documents.
        """

        if not documents:
            return []

        texts = [
            f"passage: {document.page_content}"
            for document in documents
        ]

        embeddings = self.model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

        return embeddings.tolist()

    def embed_query(
        self,
        query: str,
    ) -> list[float]:
        """
        Generate an embedding for a user query.
        """

        embedding = self.model.encode(
            f"query: {query}",
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

        return embedding.tolist()
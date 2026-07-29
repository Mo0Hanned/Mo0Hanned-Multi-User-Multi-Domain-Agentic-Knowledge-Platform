import uuid

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


DEFAULT_CHUNK_SIZE = 1000
DEFAULT_CHUNK_OVERLAP = 200


class DocumentChunker:
    """
    Splits LangChain documents into smaller chunks and enriches each
    chunk with metadata required for retrieval and embedding.
    """

    def __init__(
        self,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    ):
        if chunk_size <= 0:
            raise ValueError("chunk_size must be greater than 0.")

        if chunk_overlap < 0:
            raise ValueError("chunk_overlap cannot be negative.")

        if chunk_overlap >= chunk_size:
            raise ValueError(
                "chunk_overlap must be smaller than chunk_size."
            )

        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=[
                "\n\n",
                "\n",
                ". ",
                " ",
                "",
            ],
        )

    def chunk(
        self,
        documents: list[Document],
        *,
        document_id: str,
        domain: str,
        file_name: str,
    ) -> list[Document]:
        """
        Split documents into chunks and attach metadata to each chunk.
        """

        if not documents:
            return []

        chunks = self.splitter.split_documents(documents)

        for index, chunk in enumerate(chunks):
            metadata = dict(chunk.metadata)

            metadata.update(
                {
                    "chunk_id": str(uuid.uuid4()),
                    "document_id": document_id,
                    "domain": domain,
                    "file_name": file_name,
                    "chunk_index": index,
                }
            )

            chunk.metadata = metadata

        return chunks
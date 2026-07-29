from pathlib import Path

from langchain_core.documents import Document
from langchain_docling import DoclingLoader


class DocumentLoader:
    """Load supported documents into LangChain Document objects."""

    SUPPORTED_EXTENSIONS = {
        ".pdf",
        ".txt",
        ".docx",
    }

    @staticmethod
    def load(file_path: str) -> list[Document]:
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        if not path.is_file():
            raise ValueError(f"{file_path} is not a file.")

        extension = path.suffix.lower()

        if extension not in DocumentLoader.SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Unsupported file type: {extension}. "
                f"Supported: {DocumentLoader.SUPPORTED_EXTENSIONS}"
            )

        loader = DoclingLoader(file_path=str(path))

        documents = loader.load()

        if not documents:
            raise ValueError("No content could be extracted from the document.")

        return documents
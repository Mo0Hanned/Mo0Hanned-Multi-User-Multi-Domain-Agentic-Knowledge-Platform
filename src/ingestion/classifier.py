from src.generation.generator import get_llm
from langchain_core.messages import HumanMessage

class DocumentClassifier:
    """
    Classifies a document's domain based on its content using an LLM.
    """
    
    @staticmethod
    def classify(document_text: str) -> str:
        """
        Reads a sample of the document text and returns exactly 'IT', 'HR', or 'OTHER'.
        """
        if not document_text:
            return "OTHER"
            
        # Take the first 3000 characters as a representative sample
        sample_text = document_text[:3000]
        
        llm = get_llm(use_local=False, temperature=0.0)
        prompt = (
            "Analyze the following document text and classify it into one of these domains: "
            "'IT', 'HR', or 'OTHER'. Output EXACTLY one of these three words and nothing else.\n\n"
            f"Document Text:\n{sample_text}"
        )
        
        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content.strip().upper()

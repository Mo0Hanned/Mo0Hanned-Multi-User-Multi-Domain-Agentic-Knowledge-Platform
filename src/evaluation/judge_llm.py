from typing import List, Optional

from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

from src.generation.generator import api_llm



class JudgeResult(BaseModel):
    faithfulness: float = Field(
        description="Score between 0 and 1 indicating whether the generated answer aligns factually with the golden answer."
    )

    relevance: float = Field(
        description="Score between 0 and 1 indicating whether the answer addresses the user's question."
    )

    citation_accuracy: float = Field(
        description="Score between 0 and 1 indicating accuracy compared to golden answer."
    )

    completeness: float = Field(
        description="Score between 0 and 1 indicating whether important information from the golden answer is missing."
    )

    hallucination_risk: float = Field(
        description="Score between 0 and 1 where 0 means no hallucination or deviation from the golden answer."
    )

    overall_score: float = Field(
        description="Overall quality score."
    )

    reasoning: str = Field(
        description="Short explanation describing the assigned scores."
    )


class LLMJudge:

    def __init__(self):

        self.system_prompt = """
You are an Enterprise RAG Evaluation Judge.

Your ONLY responsibility is to evaluate the generated answer by comparing it against the provided Golden Answer.

Never rewrite the answer.

Evaluate ONLY.

Evaluation Criteria:

1. Faithfulness
Does the generated answer align factually with the golden answer?

2. Relevance
Does the answer address the user's question?

3. Citation Accuracy
Is the generated answer as accurate as the golden answer?

4. Completeness
Is important information from the golden answer missing?

5. Hallucination Risk
Estimate hallucination probability based on deviation from the golden answer.

Return ONLY the requested JSON.
"""

    def evaluate(
        self,
        question: str,
        answer: str,
        golden_answer: str,
        citations: Optional[List] = None,
    ) -> JudgeResult:

        structured_llm = api_llm.with_structured_output(JudgeResult)

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", self.system_prompt),
                (
                    "user",
                    """
Question:

{question}

Generated Answer:

{answer}

Golden Answer:

{golden}

Citations:

{citations}
""",
                ),
            ]
        )

        chain = prompt | structured_llm

        citation_text = ""

        if citations:
            citation_text = "\n".join(
                [
                    f"{c.source_file} | page={c.page}"
                    for c in citations
                ]
            )

        result: JudgeResult = chain.invoke(
            {
                "question": question,
                "answer": answer,
                "golden": golden_answer,
                "citations": citation_text,
            }
        )

        return result


judge = LLMJudge()
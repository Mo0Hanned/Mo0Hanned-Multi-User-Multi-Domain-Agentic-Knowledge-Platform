import logging
from typing import List

from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

from src.agents.state import AgentState, RetrievedChunk
from src.generation.router import get_routed_llm

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VerificationOutput(BaseModel):
    is_valid: bool = Field(description="True if the retrieved context sufficiently answers the task description.")
    feedback: str = Field(description="Brief critique explaining why the context is or isn't sufficient.")


class VerificationAgent:
    """
    The Verification Agent evaluates whether the retrieved context satisfies the
    current task, using the project's routed LLM for the judgement call.
    """

    def _combine_chunks(self, chunks: List[RetrievedChunk]) -> str:
        return " ".join(chunk.text for chunk in chunks)

    def verify(self, state: AgentState) -> dict:
        active_task = next((t for t in state.tasks if t.task_id == state.current_task_id), None)

        if not active_task:
            logger.info("No active task found. Passing verification through.")
            return {"is_context_valid": True, "next_agent": "Supervisor"}

        logger.info("Verifying task: %s", active_task.task_id)

        # Only the chunks produced for this specific task (tagged by retrieval_node
        # with a "{task_id}_" chunk_id prefix) are relevant to this verification pass.
        task_chunks = [c for c in state.retrieved_context if c.chunk_id.startswith(f"{active_task.task_id}_")]

        if active_task.status == "completed" and active_task.result_summary and (
            "ACCESS DENIED" in active_task.result_summary
            or "Skipped" in active_task.result_summary
            or "Task Skipped" in active_task.result_summary
        ):
            logger.info("Task was skipped/access-denied upstream. Marking context as valid.")
            return {"is_context_valid": True, "next_agent": "Supervisor"}

        if not task_chunks:
            logger.warning("No records found for task: %s", active_task.task_id)
            return {
                "is_context_valid": False,
                "verification_feedback": "No relevant data was retrieved for this task.",
                "next_agent": "Supervisor",
            }

        context_text = self._combine_chunks(task_chunks)

        try:
            llm = get_routed_llm(state)
            structured_llm = llm.with_structured_output(VerificationOutput)

            prompt = ChatPromptTemplate.from_messages([
                (
                    "system",
                    "You are a strict Verification Agent for an Enterprise RAG system. "
                    "Given a task description and the retrieved context, decide whether the "
                    "context actually contains enough information to answer the task. "
                    "Be strict: if the context is empty, off-topic, or only tangentially related, mark it invalid.",
                ),
                (
                    "user",
                    "Task Description: {task}\n\nRetrieved Context:\n{context}",
                ),
            ])

            response: VerificationOutput = (prompt | structured_llm).invoke({
                "task": active_task.description,
                "context": context_text,
            })

            logger.info("Verification result for task %s: is_valid=%s", active_task.task_id, response.is_valid)

            return {
                "is_context_valid": response.is_valid,
                "verification_feedback": response.feedback,
                "next_agent": "Supervisor",
            }

        except Exception as e:
            logger.error("Verification process failed: %s", str(e))
            # Fail open on infra/LLM errors so a transient failure doesn't
            # permanently block the task; Supervisor still owns retry/skip logic.
            return {
                "is_context_valid": True,
                "verification_feedback": f"Verification could not be completed due to an error: {str(e)}",
                "next_agent": "Supervisor",
            }


_verification_agent = VerificationAgent()


def verification_node(state: AgentState) -> dict:
    """LangGraph node wrapper around VerificationAgent.verify()."""
    print("\n[Verification Agent] Evaluating retrieved context...")
    return _verification_agent.verify(state)

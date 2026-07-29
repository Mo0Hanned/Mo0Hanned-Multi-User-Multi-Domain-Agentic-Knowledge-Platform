import os
import logging
from typing import List, Optional

from src.agents.state import AgentState, RetrievedChunk, Task
from src.retrieval.dense_search import DenseSearch
from src.retrieval.sparse_search import SparseSearch, Document as SparseDocument
from src.retrieval.fusion import ReciprocalRankFusion

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_TOP_K = int(os.getenv("RETRIEVAL_TOP_K", 5))
MAX_SUMMARY_CHARS = 500


class RetrievalAgent:
    """
    The Retrieval Agent handles the retrieval process for a given task: dense retrieval,
    sparse (BM25) retrieval, Reciprocal Rank Fusion, domain filtering and context
    preparation for the downstream Verification/Synthesis agents.
    """

    def __init__(self, dense_search: DenseSearch, sparse_search: SparseSearch, rrf: ReciprocalRankFusion):
        self.dense_search = dense_search
        self.sparse_search = sparse_search
        self.rrf = rrf
        self._sparse_index_ready = False

    def _ensure_sparse_index(self) -> None:
        """
        The BM25 SparseSearch index lives in memory and must be populated before use.
        Build it once, lazily, from the same Qdrant collection the DenseSearch module
        reads from, so both retrieval paths operate over the same corpus.
        """
        if self._sparse_index_ready:
            return

        try:
            client = self.dense_search.qdrant_client
            collection_name = self.dense_search.collection_name

            points, _ = client.scroll(
                collection_name=collection_name,
                limit=10000,
                with_payload=True,
                with_vectors=False,
            )

            documents = [
                SparseDocument(
                    id=str(point.payload.get("chunk_id", point.id)),
                    text=point.payload.get("text", "") or "",
                    metadata=point.payload,
                )
                for point in points
                if point.payload
            ]

            self.sparse_search.index_documents(documents)
            self._sparse_index_ready = True
            logger.info("Sparse (BM25) index built with %d documents.", len(documents))
        except Exception as e:
            logger.error("Failed to build sparse index from Qdrant: %s", str(e))

    def _generate_query(self, state: AgentState, task: Task) -> str:
        if task.retry_count > 0 and state.verification_feedback and task.previous_query:
            logger.info(f"Refining search query based on feedback for retry {task.retry_count}")
            try:
                from src.generation.router import get_routed_llm
                from langchain_core.prompts import ChatPromptTemplate
                
                llm = get_routed_llm(state)
                prompt = ChatPromptTemplate.from_messages([
                    ("system", "You are an expert search query generator. Provide ONLY the new search query text without quotes or explanation."),
                    ("user", f"Original Task: {task.description}\nPrevious Query: {task.previous_query}\nVerification Feedback: {state.verification_feedback}\n\nBased on this feedback, write a new, improved search query to find the required information.")
                ])
                result = prompt.pipe(llm).invoke({})
                new_query = result.content.strip()
                logger.info(f"Refined query: {new_query}")
                return new_query
            except Exception as e:
                logger.error(f"Failed to refine query using LLM: {e}")
                
        return task.description

    def _filter_results_by_domain(self, results: List, domain: Optional[str]) -> List:
        if not domain:
            return results
        return [result for result in results if result.payload.get("domain") == domain]

    def _convert_to_retrieved_chunks(self, results: List, task_id: str) -> List[RetrievedChunk]:
        chunks = []
        for result in results:
            payload = result.payload or {}
            page = payload.get("page")

            chunks.append(
                RetrievedChunk(
                    chunk_id=f"{task_id}_{payload.get('chunk_id', result.id)}",
                    file_name=payload.get("document_name") or "unknown",
                    text=payload.get("text") or "",
                    page=page,
                )
            )
        return chunks

    def execute(self, state: AgentState, task: Task) -> List[RetrievedChunk]:
        """
        Run dense + sparse retrieval for a single task and return the fused,
        domain-filtered RetrievedChunk list (already in AgentState's schema).
        """
        query = self._generate_query(state, task)
        task.previous_query = query

        dense_results = self.dense_search.search(
            query=query, domain=task.target_domain, top_k=DEFAULT_TOP_K
        )
        logger.info("Dense search completed with %d results.", len(dense_results))

        self._ensure_sparse_index()
        sparse_results = self.sparse_search.search(query=query, top_k=DEFAULT_TOP_K) if self._sparse_index_ready else []
        logger.info("Sparse search completed with %d results.", len(sparse_results))

        fused_results = self.rrf.fuse(dense_results, sparse_results)
        logger.info("Reciprocal Rank Fusion completed with %d fused results.", len(fused_results))

        filtered_results = self._filter_results_by_domain(fused_results, task.target_domain)
        top_results = filtered_results[:DEFAULT_TOP_K]

        return self._convert_to_retrieved_chunks(top_results, task.task_id)


# ---------------------------------------------------------------------------
# Singleton wiring (Dense/Sparse/RRF components are relatively expensive to
# construct - e.g. they load the mE5 embedding model - so they are built once
# and reused across graph invocations).
# ---------------------------------------------------------------------------
_retrieval_agent: Optional[RetrievalAgent] = None


def _get_retrieval_agent() -> RetrievalAgent:
    global _retrieval_agent
    if _retrieval_agent is None:
        _retrieval_agent = RetrievalAgent(
            dense_search=DenseSearch(),
            sparse_search=SparseSearch(),
            rrf=ReciprocalRankFusion(),
        )
    return _retrieval_agent


def retrieval_node(state: AgentState) -> dict:
    """
    LangGraph node wrapper around RetrievalAgent.execute(). Performs hybrid
    (dense + sparse + RRF) retrieval for the currently active task and updates
    the task status / result summary and the shared retrieved_context list.
    """
    print("\n[Retrieval Agent] Running hybrid dense + sparse retrieval...")

    active_task = next((t for t in state.tasks if t.task_id == state.current_task_id), None)
    if not active_task:
        logger.warning("No active task found in AgentState for Retrieval_Agent.")
        return {"next_agent": "Verification_Agent"}

    try:
        agent = _get_retrieval_agent()
        new_chunks = agent.execute(state, active_task)
    except Exception as e:
        logger.error("Retrieval task execution failed: %s", str(e))
        updated_tasks = list(state.tasks)
        for t in updated_tasks:
            if t.task_id == active_task.task_id:
                t.status = "completed"
                t.result_summary = f"Retrieval failed due to an error: {str(e)}"
        return {
            "tasks": updated_tasks,
            "next_agent": "Verification_Agent",
        }

    updated_tasks = list(state.tasks)
    for t in updated_tasks:
        if t.task_id == active_task.task_id:
            t.status = "completed"
            t.previous_query = active_task.previous_query
            if new_chunks:
                combined_text = " ".join(chunk.text for chunk in new_chunks)
                summary = combined_text[:MAX_SUMMARY_CHARS]
                t.result_summary = f"Retrieved {len(new_chunks)} chunk(s): {summary}"
            else:
                t.result_summary = "No records found for this task."

    updated_context = list(state.retrieved_context) + new_chunks

    return {
        "tasks": updated_tasks,
        "retrieved_context": updated_context,
        "next_agent": "Verification_Agent",
    }

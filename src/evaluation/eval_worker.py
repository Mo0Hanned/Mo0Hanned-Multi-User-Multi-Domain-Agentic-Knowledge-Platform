from src.workers.celery_app import celery_app
from src.evaluation.judge_llm import judge


@celery_app.task(
    name="workers.evaluate_answer",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def evaluate_answer_task(
    question: str,
    answer: str,
    retrieved_context: str,
    citations=None,
    golden_answer=None,
):

    result = judge.evaluate(
        question=question,
        answer=answer,
        retrieved_context=retrieved_context,
        citations=citations,
        golden_answer=golden_answer,
    )

    return result.model_dump()
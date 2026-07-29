from prometheus_client import Counter, Histogram, Gauge

# Number of evaluations
judge_requests_total = Counter(
    "judge_requests_total",
    "Total number of LLM judge evaluations",
)

# Average latency
judge_latency_seconds = Histogram(
    "judge_latency_seconds",
    "Time spent evaluating answers",
)

# Last evaluation score
judge_last_score = Gauge(
    "judge_last_score",
    "Overall score of the latest evaluation",
)

# Running averages
judge_faithfulness = Gauge(
    "judge_faithfulness",
    "Faithfulness score",
)

judge_relevance = Gauge(
    "judge_relevance",
    "Relevance score",
)

judge_completeness = Gauge(
    "judge_completeness",
    "Completeness score",
)

judge_citation_accuracy = Gauge(
    "judge_citation_accuracy",
    "Citation accuracy score",
)

judge_hallucination_risk = Gauge(
    "judge_hallucination_risk",
    "Hallucination risk",
)
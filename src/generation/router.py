import logging

from src.agents.state import AgentState
from src.generation.generator import get_llm

logger = logging.getLogger(__name__)

SENSITIVE_DOMAINS = ["HR"]


def is_domain_sensitive(domain: str) -> bool:
    if not domain:
        return False
    return domain.upper() in SENSITIVE_DOMAINS


def get_routed_llm(state: AgentState):
    """
    Select the appropriate LLM based on agent role and domain sensitivity.

    Routing rules (evaluated in order):
      1. Supervisor / Planning Agent  → Groq + Ollama fallback (reasoning-heavy)
      2. Domain-sensitive (HR)         → Ollama only (data stays local)
      3. Domain non-sensitive (IT)     → Groq + Ollama fallback
      4. Default                       → Groq + Ollama fallback
    """
    agent = state.next_agent or "unknown"
    domain = state.target_domain

    # Rule 1: orchestration agents always use cloud with fallback
    if agent in ("Supervisor", "Query-Planning_Agent"):
        logger.info("Router: agent=%s → Groq + Ollama fallback", agent)
        return get_llm(use_local=False, temperature=0.0)

    # Rule 2: domain-sensitive routing
    if domain:
        sensitive = is_domain_sensitive(domain)
        if sensitive:
            logger.info("Router: agent=%s, domain=%s (sensitive) → Ollama only", agent, domain)
        else:
            logger.info("Router: agent=%s, domain=%s → Groq + Ollama fallback", agent, domain)
        return get_llm(use_local=sensitive, temperature=0.0)

    # Rule 3: no domain context → cloud with fallback
    logger.info("Router: agent=%s, no domain → Groq + Ollama fallback", agent)
    return get_llm(use_local=False, temperature=0.0)

import os
import logging
from typing import Any, Dict, List, Optional

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatResult, ChatGeneration
from langchain_core.callbacks import CallbackManagerForLLMRun, AsyncCallbackManagerForLLMRun
from langchain_core.runnables import Runnable
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

def get_llm(use_local: bool = False, temperature: float = 0.0):
    """
    Build an LLM instance.

    use_local=False  → Groq (primary) with Ollama fallback
    use_local=True   → Ollama only (no fallback, no cloud call)
    """
    if use_local:
        model = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
        return ChatOllama(
            model=model,
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            temperature=temperature,
        )
    else:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in the environment variables.")
            
        return ChatGroq(
            model_name="llama-3.3-70b-versatile", 
            groq_api_key=api_key,
            temperature=temperature,
        )

api_llm = get_llm(use_local=False)  
local_llm = get_llm(use_local=True) 

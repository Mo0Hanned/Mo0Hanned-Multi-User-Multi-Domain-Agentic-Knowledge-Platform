from src.agents.state import AgentState
from langchain_core.prompts import ChatPromptTemplate
from src.generation.generator import get_llm

async def memory_summarization_node(state: AgentState) -> dict:
    messages = state.messages
    current_summary = getattr(state, 'conversation_summary', "")
    
    if not messages or len(messages) <= 5:
        return {} 
        
    print("\n[Memory Agent] Compressing conversation context using LOCAL model...")
    
    local_llm = get_llm(use_local=True, temperature=0.0) 
    
    messages_to_summarize = messages[:-2]
    messages_text = "\n".join([f"{m.role}: {m.content}" for m in messages_to_summarize])
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a memory optimization assistant for an Enterprise system. 
        Update the current conversation summary by incorporating the new messages.
        Keep the summary concise but DO NOT lose important facts, entities (like specific names, usernames, ticket IDs, domains), or user requests/corrections.
        
        Current Summary:
        {current_summary}
        """),
        ("user", "New messages to incorporate into the summary:\n{new_messages}")
    ])
    
    chain = prompt | local_llm
    
    try:
        response = await chain.ainvoke({
            "current_summary": current_summary if current_summary else "No previous summary.",
            "new_messages": messages_text
        })
        
        new_summary = response.content
        print(f"   -> [Memory Updated]: {new_summary[:100]}...")
        
        return {
            "conversation_summary": new_summary,
            "messages": messages[-2:] 
        }
        
    except Exception as e:
        print(f"[Memory Agent] Error during summarization: {e}")
        return {}
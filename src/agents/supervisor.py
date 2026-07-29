import os
from src.agents.state import AgentState

def supervisor_node(state: AgentState) -> dict:
    print("\n--- Supervisor ---")
    
    # 1. Dynamic Budget Calculation
    base_steps = 3  # (1 Planner + 1 Synthesis + 1 Buffer)
    if not state.tasks:
        budget = int(os.getenv("MAX_STEPS_BUDGET", 12))
    else:
        budget = base_steps + (len(state.tasks) * 4)
        
    current_step = state.step_count
    
    # 2. Check Budget (Prevent Infinite Loops)
    if current_step >= budget:
        print(f"Supervisor: Dynamic Budget exceeded ({current_step}/{budget} steps). Routing to Synthesis.")
        return {"next_agent": "Synthesis_Agent", "step_count": current_step + 1}
        
    # Honor explicit requests to Synthesis
    if state.next_agent == "Synthesis_Agent":
        print("Supervisor: Honoring explicit route to Synthesis.")
        return {"next_agent": "Synthesis_Agent", "step_count": current_step + 1}
        
    # 3. Check for Final Intent from Planner
    if state.query_intent in ["casual_chat", "out_of_scope", "ready_for_synthesis"]:
        print(f"Supervisor: Intent is {state.query_intent}. Routing to Synthesis.")
        return {"next_agent": "Synthesis_Agent", "step_count": current_step + 1}
        
    # 4. Handle Verification Failures (Domino Effect & Dynamic Replanning)
    active_task = None
    if state.current_task_id:
        active_task = next((t for t in state.tasks if t.task_id == state.current_task_id), None)
        
    if state.is_context_valid is False and active_task:
        print(f"Supervisor: Task [{active_task.task_id}] failed validation or returned empty.")
        
        updated_tasks = list(state.tasks)
        for t in updated_tasks:
            if t.task_id == active_task.task_id:
                if t.retry_count < 3:
                    t.retry_count += 1
                    t.status = "pending"
                    print(f"Supervisor: Retrying Task [{t.task_id}]. Attempt {t.retry_count + 1}/4.")
                    # Remove old retrieved chunks for this task so next verification evaluates fresh data
                    state.retrieved_context = [
                        c for c in state.retrieved_context 
                        if not c.chunk_id.startswith(f"{t.task_id}_")
                    ]
                else:
                    t.status = "failed"
                    print(f"Supervisor: Max retries reached for Task [{t.task_id}]. Marking as failed.")
                    
        # Skip dependent tasks only if the active task definitively failed (i.e., not retrying)
        active_task_failed = any(t.task_id == active_task.task_id and t.status == "failed" for t in updated_tasks)
        if active_task_failed:
            for t in updated_tasks:
                if t.status == "pending" and getattr(t, "is_dependent", False):
                    print(f"Supervisor: Skipping dependent Task [{t.task_id}] due to previous failure.")
                    t.status = "skipped"
                    t.result_summary = "Skipped due to dependency failure."
                
        state.tasks = updated_tasks

    # 5. Plan Execution Logic
    if not state.tasks:
        print("Supervisor: No active plan. Routing to Planner.")
        return {"next_agent": "Query-Planning_Agent", "step_count": current_step + 1}
        
    pending_tasks = [t for t in state.tasks if t.status == "pending"]
    
    if not pending_tasks:
        print("Supervisor: All planned tasks completed successfully! Routing to Synthesis.")
        return {
            "tasks": state.tasks,
            "next_agent": "Synthesis_Agent", 
            "current_task_id": None,
            "step_count": current_step + 1
        }
        
    next_task = pending_tasks[0]
    
    # 6. Strict RBAC (Role-Based Access Control) Check 
    target_domain = next_task.target_domain
    if target_domain and target_domain not in state.allowed_domains:
        print(f"Supervisor: Access Denied for domain {target_domain}. Skipping task [{next_task.task_id}] and its dependents.")
        
        updated_tasks = list(state.tasks)
        # أ. تحويل حالة المهمة المرفوضة إلى فشل بدلاً من اكتساب
        for t in updated_tasks:
            if t.task_id == next_task.task_id:
                t.status = "failed"
                t.result_summary = f"ACCESS DENIED: User does not have permission to access the {target_domain} domain."
        
        # ب. تأثير الدومينو: تخطي المهام المعتمدة فوراً
        for t in updated_tasks:
            if t.status == "pending" and getattr(t, "is_dependent", False):
                print(f"Supervisor: Skipping dependent Task [{t.task_id}] due to RBAC failure.")
                t.status = "skipped"
                t.result_summary = "Skipped due to dependency failure (Access Denied on parent task)."
        
        return {
            "tasks": updated_tasks,
            "next_agent": "Supervisor",
            "current_task_id": None,
            "step_count": current_step + 1
        }
        
    # 7. Dynamic Routing to Specialists based on task_type
    next_node = "Retrieval_Agent" if next_task.task_type == "vector_search" else "Structured_Data_Agent"
    print(f"Supervisor: Routing to {next_node} for Task [{next_task.task_id}] (Domain: {target_domain}).")
    
    return {
        "tasks": state.tasks,
        "current_task_id": next_task.task_id,
        "next_agent": next_node,
        "target_domain": target_domain,
        "step_count": current_step + 1,
        "is_context_valid": None 
    }
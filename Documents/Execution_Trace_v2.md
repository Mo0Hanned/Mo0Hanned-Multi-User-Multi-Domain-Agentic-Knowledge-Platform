# Execution Trace Document v2.0: Plan-and-Execute Architecture

## 1. Introduction & Architecture Upgrade
The RAG system has been successfully upgraded from a legacy "ReAct" architecture to a robust **Plan-and-Execute** framework using LangGraph. This architectural shift enhances predictability, performance, and scalability. Key innovations include:

1. **Upfront Planning:** The `Query-Planning_Agent` generates ALL necessary tasks at Step 1, eliminating ReAct's infinite loops and providing deterministic execution paths.
2. **Conditional Smart Skip:** Workers evaluate historical context before execution. If a precondition fails (e.g., "If ticket is OPEN..."), they output `CONDITION_NOT_MET` to skip the task efficiently without unnecessary API calls.
3. **Smart Summarization:** Large SQL/JSON payloads are intercepted and dynamically summarized to < 300 characters to prevent Context Window Overflow.
4. **Dynamic Budgeting:** The Supervisor calculates the maximum number of allowed steps dynamically based on the initial task count.
5. **Tech Stack:** Upgraded to use **Groq** for high-speed LLM inference and **Redis** for robust caching of structured database queries.

---

## 2. Execution Scenario

**User Prompt:**
> "Check the status of my IT ticket for 'Access to Production DB'. If it is 'RESOLVED', retrieve my leave balance. If it is 'OPEN', search the HR policy for rules on applying for a system access extension."

---

## 3. Step-by-Step Execution Trace

### Step 0: Initialization
The system initializes the state with the user prompt. No tasks have been generated yet. The system identifies the relevant domains based on the query.

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Check the status of my IT ticket for 'Access to Production DB'. If it is 'RESOLVED', retrieve my leave balance. If it is 'OPEN', search the HR policy for rules on applying for a system access extension."
    }
  ],
  "tasks": [],
  "current_task_idx": 0,
  "domains": ["HR", "IT"],
  "budget": 0
}
```

### Step 1: Upfront Planning
The `Query-Planning_Agent` analyzes the prompt and decomposes it into an execution plan containing 3 distinct tasks. The dynamic budgeting mechanism calculates and allocates a step budget.

```json
{
  "tasks": [
    {
      "id": "t1",
      "agent": "Structured_Agent",
      "domain": "IT",
      "instruction": "Lookup the status of the IT ticket regarding 'Access to Production DB'.",
      "condition": null
    },
    {
      "id": "t2",
      "agent": "Structured_Agent",
      "domain": "HR",
      "instruction": "Retrieve the user's leave balance.",
      "condition": "Task t1 result is 'RESOLVED'"
    },
    {
      "id": "t3",
      "agent": "Retrieval_Agent",
      "domain": "HR",
      "instruction": "Search HR policy for rules on applying for a system access extension.",
      "condition": "Task t1 result is 'OPEN'"
    }
  ],
  "current_task_idx": 0,
  "budget": 5
}
```

### Steps 2 & 3: Executing Task 1 (IT Database Lookup)
The `Structured_Agent` executes the first task, running a structured database query to check the ticket status. The ticket is found to be resolved. The Verification step evaluates and approves the output.

```json
{
  "current_task_idx": 1,
  "messages": [
    {
      "role": "system",
      "name": "Structured_Agent",
      "content": "Executed SQL query on IT DB. Result: Ticket 'Access to Production DB' status is RESOLVED."
    },
    {
      "role": "system",
      "name": "Verification",
      "content": "Task t1 output approved."
    }
  ]
}
```

### Steps 4 & 5: Executing Task 2 (HR Database Lookup)
The `Structured_Agent` evaluates the condition for Task 2. Since Task 1 returned 'RESOLVED', the condition is met. The agent retrieves the leave balance. The Smart Summarization module compresses the JSON response to prevent overflow. Verification approves.

```json
{
  "current_task_idx": 2,
  "messages": [
    {
      "role": "system",
      "name": "Structured_Agent",
      "content": "Condition MET. Retrieved leave balance. [Smart Summary]: User has 14 days annual leave, 5 days sick leave."
    },
    {
      "role": "system",
      "name": "Verification",
      "content": "Task t2 output approved."
    }
  ]
}
```

### Steps 6 & 7: Executing Task 3 (HR Policy Retrieval)
The `Retrieval_Agent` evaluates the condition for Task 3. Since the ticket status from Task 1 was 'RESOLVED' and not 'OPEN', the condition is not met. The agent returns a skip signal. Verification approves the skip.

```json
{
  "current_task_idx": 3,
  "messages": [
    {
      "role": "system",
      "name": "Retrieval_Agent",
      "content": "CONDITION_NOT_MET: Task Skipped."
    },
    {
      "role": "system",
      "name": "Verification",
      "content": "Task t3 skip approved."
    }
  ]
}
```

### Step 8: Synthesis
The Synthesis Agent processes the execution history and compiles the final response, synthesizing the retrieved information and skipping the condition that wasn't met. Citations are included.

```json
{
  "messages": [
    {
      "role": "assistant",
      "content": "Your IT ticket for 'Access to Production DB' has been RESOLVED [1]. As requested, I have also checked your leave balance: you currently have 14 days of annual leave and 5 days of sick leave [2].\n\n**Citations:**\n[1] IT Service Management Database\n[2] HR Leave Management System"
    }
  ],
  "status": "COMPLETED"
}
```

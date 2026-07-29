from pydantic import BaseModel
from typing import List, Optional

class QueryRequest(BaseModel):
    query: str

class DebugInfo(BaseModel):
    tasks_count: int = 0
    retrieved_chunks: int = 0
    verification_status: str = "N/A"
    web_search_status: str = "Skipped"
    sources_count: str = "None"
    timing: float = 0.0

class QueryResponse(BaseModel):
    next_agent: str
    target_domain: Optional[str] = None
    step_count: int
    answer: Optional[str] = None
    debug_info: Optional[DebugInfo] = None

class IngestRequest(BaseModel):
    domain: str
    content: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    system_role: str = "User"
    job_role: str
    allowed_domains: str = ""

class UserResponse(BaseModel):
    id: int
    full_name: str
    username: str
    role: str
    allowed_domains: str
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class JudgeRequest(BaseModel):
    question: str
    answer: str
    golden_answer: str

class JudgeResponse(BaseModel):
    faithfulness: float
    relevance: float
    citation_accuracy: float
    completeness: float
    hallucination_risk: float
    overall_score: float
    reasoning: str

class UserBasicResponse(BaseModel):
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True

class ITTicketCreate(BaseModel):
    user_id: int
    title: str
    description: Optional[str] = None
    priority: str = "MEDIUM"

class HRLeaveBalanceCreate(BaseModel):
    user_id: int
    leave_type: str
    available_days: int
    used_days: int = 0

class ITTicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class HRLeaveBalanceUpdate(BaseModel):
    leave_type: Optional[str] = None
    available_days: Optional[int] = None
    used_days: Optional[int] = None

class ITTicketResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    priority: str
    status: str
    
    class Config:
        from_attributes = True

class HRLeaveBalanceResponse(BaseModel):
    id: int
    user_id: int
    leave_type: str
    available_days: int
    used_days: int
    
    class Config:
        from_attributes = True

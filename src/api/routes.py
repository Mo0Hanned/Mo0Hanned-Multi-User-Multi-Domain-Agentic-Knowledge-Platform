from fastapi import APIRouter, Depends, HTTPException, status, Request, File, Form, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
import tempfile
import os
import shutil
import uuid
from src.ingestion.doc_loader import DocumentLoader
from src.ingestion.classifier import DocumentClassifier
from src.ingestion.chunker import DocumentChunker
from src.ingestion.embedding import EmbeddingGenerator
from src.ingestion.db_connector import QdrantConnector
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from .schemas import QueryRequest, QueryResponse, UserCreate, UserResponse, TokenResponse, IngestRequest, JudgeRequest, JudgeResponse, UserBasicResponse, ITTicketCreate, HRLeaveBalanceCreate, ITTicketUpdate, HRLeaveBalanceUpdate, ITTicketResponse, HRLeaveBalanceResponse
from .database import get_db, User
from src.database.connection import get_db_session
from src.database.models import User as PostgresUser, ITTicket, HRLeaveBalance
from .services import AuthService
from .rbac import get_current_user_context
from src.generation.generator import get_llm
from langchain_core.messages import HumanMessage
from typing import Optional, List
from src.evaluation.judge_llm import judge
from prometheus_client import Counter, Gauge, Histogram
import logging

# Configure basic logging with FileHandler
logger = logging.getLogger("api_routes")
logger.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Console handler
ch = logging.StreamHandler()
ch.setFormatter(formatter)
logger.addHandler(ch)

# File handler
fh = logging.FileHandler('app.log')
fh.setFormatter(formatter)
logger.addHandler(fh)

# Define Prometheus metrics for LLM Judge
JUDGE_REQUESTS_TOTAL = Counter('judge_requests_total', 'Total number of judge evaluation requests')
JUDGE_LAST_SCORE = Gauge('judge_last_score', 'Overall quality score of the last evaluation')
JUDGE_FAITHFULNESS = Gauge('judge_faithfulness', 'Faithfulness score of the last evaluation')
JUDGE_RELEVANCE = Gauge('judge_relevance', 'Relevance score of the last evaluation')
JUDGE_COMPLETENESS = Gauge('judge_completeness', 'Completeness score of the last evaluation')
JUDGE_CITATION_ACCURACY = Gauge('judge_citation_accuracy', 'Citation accuracy score of the last evaluation')
JUDGE_HALLUCINATION_RISK = Gauge('judge_hallucination_risk', 'Hallucination risk score of the last evaluation')

# Define Prometheus metrics for Normal Chat / Graph
CHAT_REQUESTS_TOTAL = Counter('chat_requests_total', 'Total number of chat query requests')
CHAT_ERRORS_TOTAL = Counter('chat_errors_total', 'Total number of chat query errors')
CHAT_EXECUTION_TIME = Histogram('chat_execution_time_seconds', 'Execution time for chat queries')
CHAT_STEP_COUNT = Gauge('chat_step_count', 'Number of steps taken in the last graph execution')
CHAT_RETRIEVED_CHUNKS = Gauge('chat_retrieved_chunks', 'Number of chunks retrieved in the last graph execution')


router = APIRouter()

auth_service = AuthService()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate, 
    db: Session = Depends(get_db),
    pg_db: AsyncSession = Depends(get_db_session)
):
    new_user = await auth_service.register_user(db, pg_db, user_in)
    if not new_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered."
        )
    return new_user

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    token = auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"access_token": token, "token_type": "bearer"}


@router.post("/query", response_model=QueryResponse)
async def run_query(payload: QueryRequest, request: Request, user_context: dict = Depends(get_current_user_context)):
    """
    Task 3: Intercepts query, determines allowed domains, and injects them 
    into the initial state context to avoid cross-domain RAG data leakage.
    """
    allowed_domains = user_context.get("domains", [])
    username = user_context.get("username")
    
    if not allowed_domains:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Your account is not bound to any accessible namespaces."
        )

    graph_app = request.app.state.graph_app

    initial_agent_state = {
        "messages": [{"role": "user", "content": payload.query}],
        "allowed_domains": allowed_domains,
        "username": username,
        "step_count": 0,
        "tasks": [],
        "query_intent": None,
        "next_agent": None,
        "current_task_id": None
    }
    
    session_id = user_context.get("session_id")
    if not session_id:
        import uuid
        session_id = f"api_session_{uuid.uuid4().hex[:8]}"
        
    config = {"configurable": {"thread_id": session_id}}
    
    import time
    start_time = time.time()
    CHAT_REQUESTS_TOTAL.inc()
    
    logger.info(f"Starting chat query for user '{username}' with session '{session_id}'. Query: '{payload.query}'")
    
    try:
        final_state = await graph_app.ainvoke(initial_agent_state, config=config)
    except Exception as e:
        CHAT_ERRORS_TOTAL.inc()
        logger.error(f"Graph execution failed for user '{username}': {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Graph execution failed: {str(e)}"
        )
        
    execution_time = round(time.time() - start_time, 2)
    CHAT_EXECUTION_TIME.observe(execution_time)
    
    answer = final_state.get("answer", "No answer generated.")
    step_count = final_state.get("step_count", 0)
    target_domain = final_state.get("target_domain", None)
    
    CHAT_STEP_COUNT.set(step_count)
    
    logger.info(f"Query completed for user '{username}' in {execution_time}s. Domain: {target_domain}, Steps: {step_count}")
    
    # Extract Debug Information
    tasks_count = len(final_state.get("tasks", []))
    retrieved_chunks = len(final_state.get("retrieved_context", []))
    
    CHAT_RETRIEVED_CHUNKS.set(retrieved_chunks)
    
    is_context_valid = final_state.get("is_context_valid")
    if is_context_valid is True:
        verification_status = "PASS"
    elif is_context_valid is False:
        verification_status = "FAIL"
    else:
        verification_status = "PARTIAL" if retrieved_chunks > 0 else "N/A"
        
    web_search_executed = final_state.get("web_search_executed", False)
    web_search_status = "Executed" if web_search_executed else "Skipped"
    
    citations = final_state.get("citations")
    if web_search_executed:
        sources_count = "Tavily Web Search"
    elif citations:
        unique_sources = set(c.source_file for c in citations)
        sources_count = f"{len(unique_sources)} files"
    else:
        sources_count = "None"
        
    debug_info = {
        "tasks_count": tasks_count,
        "retrieved_chunks": retrieved_chunks,
        "verification_status": verification_status,
        "web_search_status": web_search_status,
        "sources_count": sources_count,
        "timing": execution_time
    }
    
    logger.debug(f"Query Debug Info for '{username}': {debug_info}")
    
    return QueryResponse(
        next_agent="END",
        target_domain=target_domain,
        step_count=step_count,
        answer=answer,
        debug_info=debug_info
    )


@router.post("/ingest")
def ingest_data(
    file: UploadFile = File(...),
    user_context: dict = Depends(get_current_user_context),
    domain: Optional[str] = Form(None)
):
    """
    Task 4 boundary applied to data uploading/ingestion.
    Ensures an HR employee cannot upload documents into the IT namespace.
    Restricts data ingestion strictly to Admin users.

    Pipeline: load -> classify -> chunk -> embed -> upload to Qdrant -> verify.
    """
    role = user_context.get("role")
    if role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only Administrators can perform Data Ingestion."
        )

    allowed_extensions = {".pdf", ".txt", ".docx"}
    suffix = os.path.splitext(file.filename)[1].lower()
    if suffix not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: '{suffix}'. Only .pdf, .txt, and .docx are allowed."
        )

    allowed_domains = user_context.get("domains", [])

    connector = QdrantConnector()
    if connector.file_exists(file.filename):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"File '{file.filename}' has already been ingested."
        )

    # 1. Save uploaded file temporarily
    try:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name

        # 2. Load document
        docs = DocumentLoader.load(temp_file_path)
        os.remove(temp_file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load file: {str(e)}"
        )

    if not docs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No content extracted from {file.filename}."
        )

    # Automatically classify domain using LLM (via new dedicated ingestion module)
    try:
        full_text = " ".join([d.page_content for d in docs])
        detected_domain = DocumentClassifier.classify(full_text)
        
        if detected_domain not in ["IT", "HR"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document content is out of bounds (neither IT nor HR)."
            )
            
        if detected_domain not in allowed_domains:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Write Access Denied: Document classified as {detected_domain}, which is not in your allowed domains."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LLM Classification failed: {str(e)}"
        )


    # 3. Chunk documents
    document_id = str(uuid.uuid4())
    chunker = DocumentChunker()
    chunks = chunker.chunk(
        docs,
        document_id=document_id,
        domain=detected_domain,
        file_name=file.filename,
    )

    # 4. Map metadata for retrieval layer compatibility
    for chunk in chunks:
        chunk.metadata["document_name"] = chunk.metadata.pop("file_name", file.filename)
        chunk.metadata["source"] = "ingestion_api"
        chunk.metadata["document_type"] = os.path.splitext(file.filename)[1].lower()
        if "page" in chunk.metadata and isinstance(chunk.metadata["page"], int):
            chunk.metadata["page"] += 1

    # 5. Generate embeddings
    embedder = EmbeddingGenerator()
    vectors = embedder.embed_documents(chunks)

    # 6. Upload to Qdrant
    if not connector.collection_exists():
        connector.create_collection(vector_size=len(vectors[0]))
    connector.upload_documents(vectors, chunks)

    # 7. Verify upload by checking points_count
    collection_info = connector.client.get_collection(connector.collection_name)
    points_count = collection_info.points_count

    return {
        "status": "success",
        "message": f"Automatically classified and ingested {file.filename} into namespace: {detected_domain}",
        "chunks_uploaded": len(chunks),
        "qdrant_points_count": points_count,
    }

@router.post("/evaluate", response_model=JudgeResponse)
def evaluate_answer(payload: JudgeRequest, user_context: dict = Depends(get_current_user_context)):
    """
    Evaluates an answer using the LLMJudge. Only accessible by Admins.
    """
    role = user_context.get("role")
    if role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only Administrators can perform evaluations."
        )

    try:
        result = judge.evaluate(
            question=payload.question,
            answer=payload.answer,
            golden_answer=payload.golden_answer,
        )
        
        # Update Prometheus metrics
        JUDGE_REQUESTS_TOTAL.inc()
        JUDGE_LAST_SCORE.set(result.overall_score * 100)
        JUDGE_FAITHFULNESS.set(result.faithfulness * 100)
        JUDGE_RELEVANCE.set(result.relevance * 100)
        JUDGE_COMPLETENESS.set(result.completeness * 100)
        JUDGE_CITATION_ACCURACY.set(result.citation_accuracy * 100)
        JUDGE_HALLUCINATION_RISK.set(result.hallucination_risk * 100)
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {str(e)}"
        )

@router.get("/admin/users", response_model=List[UserBasicResponse])
async def get_all_users(
    user_context: dict = Depends(get_current_user_context),
    pg_db: AsyncSession = Depends(get_db_session)
):
    if user_context.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Access Denied")
    result = await pg_db.execute(select(PostgresUser))
    users = result.scalars().all()
    return users

@router.post("/admin/it-tickets")
async def create_it_ticket(
    payload: ITTicketCreate,
    user_context: dict = Depends(get_current_user_context),
    pg_db: AsyncSession = Depends(get_db_session)
):
    if user_context.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Access Denied")
    
    ticket = ITTicket(
        user_id=payload.user_id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority
    )
    pg_db.add(ticket)
    await pg_db.commit()
    return {"status": "success", "message": "IT Ticket created successfully"}

@router.post("/admin/hr-leaves")
async def create_hr_leave(
    payload: HRLeaveBalanceCreate,
    user_context: dict = Depends(get_current_user_context),
    pg_db: AsyncSession = Depends(get_db_session)
):
    if user_context.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Access Denied")
    
    leave = HRLeaveBalance(
        user_id=payload.user_id,
        leave_type=payload.leave_type,
        available_days=payload.available_days,
        used_days=payload.used_days
    )
    pg_db.add(leave)
    await pg_db.commit()
    return {"status": "success", "message": "HR Leave Record created successfully"}

@router.get("/admin/it-tickets/{user_id}", response_model=List[ITTicketResponse])
async def get_user_it_tickets(
    user_id: int,
    user_context: dict = Depends(get_current_user_context),
    pg_db: AsyncSession = Depends(get_db_session)
):
    if user_context.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Access Denied")
    result = await pg_db.execute(select(ITTicket).where(ITTicket.user_id == user_id))
    return result.scalars().all()

@router.get("/admin/hr-leaves/{user_id}", response_model=List[HRLeaveBalanceResponse])
async def get_user_hr_leaves(
    user_id: int,
    user_context: dict = Depends(get_current_user_context),
    pg_db: AsyncSession = Depends(get_db_session)
):
    if user_context.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Access Denied")
    result = await pg_db.execute(select(HRLeaveBalance).where(HRLeaveBalance.user_id == user_id))
    return result.scalars().all()

@router.put("/admin/it-tickets/{ticket_id}")
async def update_it_ticket(
    ticket_id: int,
    payload: ITTicketUpdate,
    user_context: dict = Depends(get_current_user_context),
    pg_db: AsyncSession = Depends(get_db_session)
):
    if user_context.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Access Denied")
    
    result = await pg_db.execute(select(ITTicket).where(ITTicket.id == ticket_id))
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    if payload.title is not None: ticket.title = payload.title
    if payload.description is not None: ticket.description = payload.description
    if payload.priority is not None: ticket.priority = payload.priority
    if payload.status is not None: ticket.status = payload.status
    
    await pg_db.commit()
    return {"status": "success", "message": "IT Ticket updated successfully"}

@router.put("/admin/hr-leaves/{record_id}")
async def update_hr_leave(
    record_id: int,
    payload: HRLeaveBalanceUpdate,
    user_context: dict = Depends(get_current_user_context),
    pg_db: AsyncSession = Depends(get_db_session)
):
    if user_context.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Access Denied")
        
    result = await pg_db.execute(select(HRLeaveBalance).where(HRLeaveBalance.id == record_id))
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="HR Record not found")
        
    if payload.leave_type is not None: record.leave_type = payload.leave_type
    if payload.available_days is not None: record.available_days = payload.available_days
    if payload.used_days is not None: record.used_days = payload.used_days
    
    await pg_db.commit()
    return {"status": "success", "message": "HR Record updated successfully"}
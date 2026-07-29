import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.api.routes import router as api_router
from src.agents.graph import build_graph
from prometheus_client import start_http_server


start_http_server(8001)

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Initializing LangGraph Application...")
    graph_app = await build_graph()
    app.state.graph_app = graph_app
    print("LangGraph Application initialized successfully.")
    yield
    # Shutdown
    print("Shutting down...")

app = FastAPI(title="Multi-User Multi-Domain Agentic RAG System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "ok"}


# Advanced Agentic Rag: Multi-User, Multi-Domain Agentic Knowledge Platform

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/LangChain-121212?style=for-the-badge&logo=chainlink&logoColor=white" alt="LangChain" />
  <img src="https://img.shields.io/badge/LangGraph-121212?style=for-the-badge&logoColor=white" alt="LangGraph" />
  <img src="https://img.shields.io/badge/LangSmith-121212?style=for-the-badge&logoColor=white" alt="LangSmith" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Qdrant-D32F2F?style=for-the-badge&logo=qdrant&logoColor=white" alt="Qdrant" />
  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" alt="Prometheus" />
  <img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white" alt="Grafana" />
  <img src="https://img.shields.io/badge/CUDA-76B900?style=for-the-badge&logo=nvidia&logoColor=white" alt="CUDA" />
  <img src="https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama" />
  <img src="https://img.shields.io/badge/Tavily-4285F4?style=for-the-badge&logoColor=white" alt="Tavily" />
  <img src="https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white" alt="Celery" />
</p>

## Overview

A comprehensive, production-ready **Retrieval-Augmented Generation (RAG)** system built to handle complex enterprise document processing, semantic search, and AI-driven question answering. It leverages LangChain and LangGraph for advanced agentic workflows, orchestrating LLM interactions across various providers (OpenAI, Google GenAI, Groq, Ollama). 

The system relies on a robust architecture featuring FastAPI for high-performance backend routing, React for a dynamic frontend, and a multi-database setup including PostgreSQL (for structured data and RBAC), Redis (for caching and session management), and Qdrant (for scalable vector search). 

## ✨ Key Features

- **Advanced RAG Workflows:** Utilizes LangGraph to power multi-agent reasoning, dynamic retrieval, and context synthesis.
- **Multi-LLM Support:** Seamlessly integrates with OpenAI, Gemini, Groq, and local open-source models via Ollama.
- **Robust Storage Layer:** Combines Qdrant for vector embeddings, PostgreSQL for structured relational data, and Redis for fast caching.
- **Scalable Architecture:** Fully containerized using Docker and Docker Compose for isolated and reproducible environments.
- **Comprehensive Monitoring:** Built-in observability with Prometheus and Grafana for tracking LLM judge metrics and system performance.
- **Interactive UI:** A modern, responsive React frontend built with Framer Motion and Lucide Icons.

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI, Python (>=3.12)
- **AI & LLM Orchestration:** LangChain, LangGraph, Sentence Transformers, Tavily (for web search)
- **Data Processing:** Docling, PyPDF, Python-docx
- **Task Queue & Background Jobs:** Celery

### Frontend
- **Framework:** React (create-react-app)
- **Styling & UI:** Framer Motion (Animations), Lucide React (Icons)
- **API Communication:** Axios

### Infrastructure & Databases
- **Vector Database:** Qdrant
- **Relational Database:** PostgreSQL (Managed via SQLAlchemy & Alembic)
- **Caching & KV Store:** Redis
- **Containerization:** Docker, Docker Compose

### Observability
- **Metrics Collection:** Prometheus
- **Dashboards & Visualization:** Grafana

## 📁 Project Structure

```text
rag-system/
├── src/                # Backend FastAPI routes, LangChain agents, and core logic
├── frontend/           # React application and UI components
├── monitoring/         # Prometheus and Grafana configurations/dashboards
├── database/           # Init scripts and database migrations (Alembic)
├── docker-compose.yml  # Docker services orchestration
├── pyproject.toml      # Python dependencies managed by uv
└── README.md
```

## 🏃‍♂️ Getting Started

Follow these steps to run the project locally:

1. **Start the Infrastructure (Databases & Services):**
   ```bash
   docker compose up -d
   ```

2. **Activate the Virtual Environment:**
   ```bash
   source .venv/bin/activate
   ```

3. **Run the Backend (FastAPI):**
   ```bash
   uvicorn main:app --reload
   ```

4. **Run the Frontend (React):**
   ```bash
   cd frontend
   npm start
   ```

## 🧠 LangGraph Agentic Architecture & Design Choices

The core intelligence of this platform is powered by a multi-agent LangGraph architecture. We carefully designed the agent interactions to maximize reliability and security:

- **Plan and Execute Pattern:** We opted for the "Plan and Execute" approach instead of "Dynamic Replanning" (like the standard ReAct framework). 
  - *Why?* In dynamic replanning, the LLM-based planner is prone to hallucinating, getting stuck in infinite execution loops, or generating an excessively large number of unfeasible plans. The Plan and Execute method ensures a strict workflow where a plan is thoroughly established before execution, significantly increasing system stability and predictability.
- **Guardrails Layers:** We implemented robust guardrail layers across the agents to enforce security policies, validate outputs, prevent prompt injection, and guarantee that the system strictly adheres to constraints and minimizes hallucinations.

## 🚀 Future Work

As the project evolves, the next major phase focuses on achieving high availability, robust CI/CD pipelines, and cloud-native scalability. 

- **CI/CD Integration:** 
  - Implement GitHub Actions to automate code linting, unit testing, and Docker image builds.
  - Automate deployment pipelines for seamless updates.
- **Cloud Deployment (AWS):** 
  - Host the backend and frontend on AWS utilizing services like Amazon ECS or EKS for container orchestration.
  - Migrate local databases to managed cloud services (Amazon RDS for PostgreSQL, Amazon ElastiCache for Redis) to ensure data durability and automated backups.
- **Auto-Scaling & Load Balancing:** 
  - Configure Auto Scaling Groups (ASG) and Application Load Balancers (ALB) to handle variable workloads dynamically, ensuring the application remains highly responsive during traffic spikes.
- **Infrastructure as Code (IaC):** 
  - Use Terraform or AWS CDK to provision and manage the cloud infrastructure reliably and consistently.

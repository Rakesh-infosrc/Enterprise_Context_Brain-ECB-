"""
Enterprise Context Brain# ECB v2.2 FastAPI Main Application Entry Point - Architecture Docs RAG Enabledver
Runs on port 8001. Provides complete REST and OpenAPI interface.
Updated Git webhook filtering and project deduplication.
"""

import os
from dotenv import load_dotenv

# Load environment variables from backend/.env at startup
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1.router import router
from .core.telemetry.tracing import setup_tracing



app = FastAPI(
    title="Enterprise Context Brain (ECB) API",
    description="GenAI Decision Intelligence & Governed Organizational Memory Operating Console",
    version="2.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow local development from Next.js on any port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

# Instrument FastAPI
setup_tracing(app)


@app.get("/")
def root():
    return {
        "name": "Enterprise Context Brain (ECB)",
        "version": "2.2.0",
        "description": "Governed GenAI Decision Intelligence Platform",
        "docs": "/docs",
        "status": "online",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

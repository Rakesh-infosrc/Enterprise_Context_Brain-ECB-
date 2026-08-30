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

# CORS — restricted to frontend origins (env FRONTEND_URL) + localhost for dev
_frontend_urls = [u.strip() for u in os.getenv("FRONTEND_URL", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001").split(",") if u.strip()]
# In debug mode allow any localhost port; in prod require explicit FRONTEND_URL
if os.getenv("ECB_ENV", "development") == "development":
    _frontend_urls += [f"http://localhost:{p}" for p in [3000, 3001, 5173] if f"http://localhost:{p}" not in _frontend_urls]
    _frontend_urls += [f"http://127.0.0.1:{p}" for p in [3000, 3001, 5173] if f"http://127.0.0.1:{p}" not in _frontend_urls]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_frontend_urls,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key", "X-Request-ID"],
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
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)

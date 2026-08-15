from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models.memory import OrganizationalMemory

memory_router = APIRouter()
traces_router = APIRouter()
tools_router = APIRouter()

@memory_router.get("/")
async def list_memories(db: AsyncSession = Depends(get_db)):
    stmt = select(OrganizationalMemory)
    result = await db.execute(stmt)
    return result.scalars().all()

@traces_router.get("/")
async def list_agent_traces():
    return [
        {
            "trace_id": "TR-2026-001",
            "agent": "ManagerAgent",
            "status": "COMPLETED",
            "latency_ms": 420,
            "steps": 5
        }
    ]

@tools_router.get("/")
async def list_mcp_tools():
    return [
        {"name": "jira_escalation", "policy": "High Risk (HITL)"},
        {"name": "git_commit_reader", "policy": "Low Risk (Auto)"},
        {"name": "aws_status_check", "policy": "Low Risk (Auto)"}
    ]

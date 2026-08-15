from fastapi import APIRouter
from app.api.v1.query import router as query_router
from app.api.v1.decisions import decisions_router, approvals_router
from app.api.v1.context import router as context_router
from app.api.v1.memory import memory_router, traces_router, tools_router

api_router = APIRouter()
api_router.include_router(query_router, prefix="/query", tags=["Manager Query"])
api_router.include_router(decisions_router, prefix="/decisions", tags=["Decision Memory"])
api_router.include_router(approvals_router, prefix="/approvals", tags=["Action Approvals"])
api_router.include_router(context_router, prefix="/context", tags=["Context Engine"])
api_router.include_router(memory_router, prefix="/memory", tags=["Organizational Memory"])
api_router.include_router(traces_router, prefix="/traces", tags=["Agent Traces"])
api_router.include_router(tools_router, prefix="/tools", tags=["MCP Tools"])

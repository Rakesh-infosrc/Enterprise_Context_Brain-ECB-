from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models.decision import DecisionMemory
from app.db.models.approval import ActionApproval
from app.mcp_gateway.tools.jira_tool import JiraMCPTool
from datetime import datetime

decisions_router = APIRouter()
approvals_router = APIRouter()

@decisions_router.get("/")
async def list_decisions(db: AsyncSession = Depends(get_db)):
    stmt = select(DecisionMemory)
    result = await db.execute(stmt)
    return result.scalars().all()

@approvals_router.get("/")
async def list_pending_approvals(db: AsyncSession = Depends(get_db)):
    stmt = select(ActionApproval)
    result = await db.execute(stmt)
    return result.scalars().all()

@approvals_router.post("/{approval_id}/approve")
async def approve_action(approval_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ActionApproval).where(ActionApproval.id == approval_id)
    result = await db.execute(stmt)
    approval = result.scalar_one_or_none()

    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    approval.status = "APPROVED"
    approval.executed_at = datetime.utcnow()

    # Execute MCP tool
    tool = JiraMCPTool()
    tool_result = tool.execute_escalation(approval.payload)

    await db.commit()

    return {
        "message": "Action approved and executed successfully via MCP Gateway",
        "approval_id": approval.id,
        "tool_result": tool_result
    }

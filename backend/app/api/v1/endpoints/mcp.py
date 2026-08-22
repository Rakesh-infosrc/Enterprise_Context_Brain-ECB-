from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from ....domain.schemas import ActionPreview, ActionStatus, Approval, AuditEvent
from ....infrastructure.db.store import CanonicalStore
from ....infrastructure.mcp.mcp_gateway import MCPGateway
from ....infrastructure.memory.mem0_memory import Mem0MemoryService

router = APIRouter(tags=["MCP & Actions"])
store = CanonicalStore.get_instance()
mcp_gateway = MCPGateway(store)
mem0_service = Mem0MemoryService(store)

class ApproveRequest(BaseModel):
    approver_id: str = "usr-sarah-jenkins"
    comment: Optional[str] = "Approved after reviewing architecture impact and Git commit evidence."

class RejectRequest(BaseModel):
    approver_id: str = "usr-sarah-jenkins"
    reason: str = "Need further review with SRE lead before mutating Jira milestone."

@router.get("/mcp/tools")
def list_mcp_tools():
    """Returns Model Context Protocol (MCP) tool catalog."""
    return mcp_gateway.list_tools()

@router.get("/actions", response_model=List[ActionPreview])
def list_actions():
    return store.get_actions()

@router.get("/actions/{action_id}", response_model=ActionPreview)
def get_action_detail(action_id: str):
    act = store.get_action(action_id)
    if not act:
        raise HTTPException(status_code=404, detail="Action not found")
    return act

@router.post("/actions/{action_id}/approve")
def approve_action(action_id: str, req: ApproveRequest):
    act = store.get_action(action_id)
    if not act:
        raise HTTPException(status_code=404, detail="Action not found")

    user = store.users.get(req.approver_id, store.users["usr-sarah-jenkins"])
    
    # Record approval
    approval = Approval(
        id=f"app-{action_id}",
        action_id=action_id,
        approver_id=user.id,
        approver_name=user.name,
        decision="approved",
        comment=req.comment,
    )
    store.record_approval(approval)

    # Execute tool via MCP Gateway
    execution_result = mcp_gateway.execute_tool(act, approver=user, comment=req.comment)
    
    # Persist resolution pattern to Mem0
    mem0_service.add_memory(
        user_id=user.id,
        content=f"Human approved tool {act.tool_name} on {act.target_system}: {req.comment}",
        title=f"Approved Action: {act.summary[:40]}",
    )

    return {
        "status": "APPROVED_AND_EXECUTED",
        "action": act,
        "execution": execution_result,
    }

@router.post("/actions/{action_id}/reject")
def reject_action(action_id: str, req: RejectRequest):
    act = store.get_action(action_id)
    if not act:
        raise HTTPException(status_code=404, detail="Action not found")

    user = store.users.get(req.approver_id, store.users["usr-sarah-jenkins"])
    approval = Approval(
        id=f"rej-{action_id}",
        action_id=action_id,
        approver_id=user.id,
        approver_name=user.name,
        decision="rejected",
        comment=req.reason,
    )
    store.record_approval(approval)

    # Add audit log
    audit = AuditEvent(
        id=f"aud-rej-{action_id}",
        org_id="org-acme-fintech",
        actor_id=user.id,
        actor_name=user.name,
        action_type=f"ACTION_REJECTED_{act.tool_name.upper()}",
        entity_type="action",
        entity_id=action_id,
        policy_result="REJECTED_BY_USER",
        trace_id=f"tr-rej-{action_id}",
        details={"reason": req.reason},
    )
    store.add_audit_event(audit)

    return {"status": "REJECTED", "action": act}

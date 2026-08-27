from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
import uuid
import os
import json
from pydantic import BaseModel

from ....domain.schemas import ActionPreview, ActionStatus, Approval, AuditEvent, RiskClass, User, UserRole
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

class JsonRpcRequest(BaseModel):
    jsonrpc: str = "2.0"
    method: str
    params: Optional[Dict[str, Any]] = None
    id: Optional[Any] = 1

@router.get("/mcp/tools")
def list_mcp_tools():
    """Returns Model Context Protocol (MCP) tool catalog."""
    return mcp_gateway.list_tools()

@router.post("/mcp/rpc")
def mcp_jsonrpc_endpoint(req: JsonRpcRequest):
    """
    Official Standard JSON-RPC 2.0 Model Context Protocol (MCP) Endpoint.
    Supports: tools/list, tools/call, resources/list.
    """
    if req.method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "result": {"tools": mcp_gateway.list_tools()},
            "id": req.id
        }
    elif req.method == "resources/list":
        return {
            "jsonrpc": "2.0",
            "result": {"resources": mcp_gateway.list_resources()},
            "id": req.id
        }
    elif req.method == "tools/call":
        tool_name = (req.params or {}).get("name", "jira_update_issue")
        args = (req.params or {}).get("arguments", {})
        
        from ....domain.schemas import User, UserRole
        user = User(id="usr-sarah-jenkins", org_id="org-acme-fintech", name="Sarah Jenkins", email="sarah.jenkins@acmefin.com", role=UserRole.ENGINEERING_LEAD)
        action = ActionPreview(
            id=f"act-rpc-{uuid.uuid4().hex[:6]}",
            agent_run_id="run-mcp-rpc",
            tool_name=tool_name,
            target_system="Jira/GitHub",
            summary=f"JSON-RPC Execution for {tool_name}",
            description=f"Standard MCP tool call execution for tool {tool_name}",
            params=args,
            risk_class=RiskClass.HIGH_IMPACT,
            requires_approval=True,
            status=ActionStatus.APPROVED,
            impact_assessment="JSON-RPC 2.0 Standard Execution via MCP Gateway",
            reversibility="high",
            suggested_by_agent="mcp_gateway"
        )
        res = mcp_gateway.execute_tool(action, approver=user)
        return {
            "jsonrpc": "2.0",
            "result": {"content": [{"type": "text", "text": str(res)}]},
            "id": req.id
        }
    else:
        return {
            "jsonrpc": "2.0",
            "error": {"code": -32601, "message": f"Method '{req.method}' not found"},
            "id": req.id
        }

@router.get("/mcp/dataset/git")
def export_git_dataset(repo: str = "testing842/clara-V2", max_commits: int = 20):
    """Exports Git commit history, pull requests, and code diffs into LLM fine-tuning JSONL format."""
    from ....infrastructure.mcp.mcp_data_extractor import GitDatasetExtractor, JiraDatasetExtractor, DatasetNormalizer
    git_ext = GitDatasetExtractor()
    jira_ext = JiraDatasetExtractor()
    commits = git_ext.extract_commits(repo=repo, max_commits=max_commits)
    prs = git_ext.extract_pull_requests(repo=repo)
    issues = jira_ext.extract_issues()
    jsonl_records = DatasetNormalizer.format_to_llm_jsonl(commits, issues)
    return {
        "status": "SUCCESS",
        "dataset_type": "git_llm_instruction_pairs",
        "total_records": len(jsonl_records),
        "commits_extracted": len(commits),
        "pull_requests_extracted": len(prs),
        "dataset": jsonl_records,
    }

@router.get("/mcp/dataset/jira")
def export_jira_dataset(project_key: str = "KAN"):
    """Exports Jira issue descriptions, status transitions, and comments into LLM fine-tuning JSONL format."""
    from ....infrastructure.mcp.mcp_data_extractor import GitDatasetExtractor, JiraDatasetExtractor, DatasetNormalizer
    git_ext = GitDatasetExtractor()
    jira_ext = JiraDatasetExtractor()
    commits = git_ext.extract_commits()
    issues = jira_ext.extract_issues(project_key=project_key)
    jsonl_records = DatasetNormalizer.format_to_llm_jsonl(commits, issues)
    return {
        "status": "SUCCESS",
        "dataset_type": "jira_llm_instruction_pairs",
        "total_records": len(jsonl_records),
        "issues_extracted": len(issues),
        "dataset": jsonl_records,
    }

@router.get("/mcp/coverage")
def get_mcp_coverage():
    """Returns evaluation report of accessible vs locked data sources across Git and Jira MCP."""
    from ....infrastructure.mcp.mcp_data_extractor import get_mcp_coverage_report
    return get_mcp_coverage_report()

class FineTuneRequest(BaseModel):
    base_model_name: str = "meta-llama/Llama-3.2-3B-Instruct"
    epochs: int = 3
    learning_rate: float = 2e-4
    lora_rank: int = 16

@router.post("/mcp/finetune/start")
def start_fine_tuning(req: FineTuneRequest):
    """Triggers LoRA fine-tuning job on extracted Git and Jira MCP datasets."""
    from ....domain.fine_tuning.train_lora import LoRATrainingPipeline
    pipeline = LoRATrainingPipeline()
    metrics = pipeline.run_training_job(
        base_model_name=req.base_model_name,
        num_epochs=req.epochs,
        learning_rate=req.learning_rate,
        lora_rank=req.lora_rank,
    )
    return {"status": "SUCCESS", "job_details": metrics}

@router.get("/mcp/finetune/status")
def get_fine_tune_status():
    """Returns fine-tuning job status, loss curve history, and adapter checkpoint manifest."""
    manifest_path = "d:/InfoServices/ECB/backend/models/ecb-lora-adapter/training_manifest.json"
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"status": "IDLE", "message": "No active fine-tuning job manifest found."}

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
    get_act_fn = getattr(store, 'get_action', None)
    if get_act_fn:
        act = get_act_fn(action_id)
    else:
        act = next((a for a in store.get_actions() if a.id == action_id), None)
        
    if not act:
        raise HTTPException(status_code=404, detail="Action not found")

    user = User(id=req.approver_id or "usr-sarah-jenkins", org_id="org-acme-fintech", name="Sarah Jenkins", email="sarah.jenkins@acmefin.com", role=UserRole.ENGINEERING_LEAD)
    
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

    # Add audit log
    audit = AuditEvent(
        id=f"aud-app-{action_id}",
        org_id="org-acme-fintech",
        actor_id=user.id,
        actor_name=user.name,
        action_type=f"ACTION_APPROVED_{act.tool_name.upper()}",
        entity_type="action",
        entity_id=action_id,
        policy_result="ALLOWED",
        trace_id=f"tr-app-{action_id}",
        details={"comment": req.comment},
    )
    store.add_audit_event(audit)

    # Execute tool via MCP Gateway
    execution_result = mcp_gateway.execute_tool(act, approver=user, comment=req.comment)
    
    # Persist resolution pattern to Mem0
    summary_str = (getattr(act, 'summary', '') or act.tool_name or 'Action')[:40]
    mem0_service.add_memory(
        user_id=user.id,
        content=f"Human approved tool {act.tool_name} on {act.target_system}: {req.comment}",
        title=f"Approved Action: {summary_str}",
    )

    return {
        "status": "APPROVED_AND_EXECUTED",
        "action": act,
        "execution": execution_result,
    }

@router.post("/actions/{action_id}/reject")
def reject_action(action_id: str, req: RejectRequest):
    get_act_fn = getattr(store, 'get_action', None)
    if get_act_fn:
        act = get_act_fn(action_id)
    else:
        act = next((a for a in store.get_actions() if a.id == action_id), None)

    if not act:
        raise HTTPException(status_code=404, detail="Action not found")

    from ....domain.schemas import User, UserRole
    user = User(id=req.approver_id or "usr-sarah-jenkins", org_id="org-acme-fintech", name="Sarah Jenkins", email="sarah.jenkins@acmefin.com", role=UserRole.ENGINEERING_LEAD)
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

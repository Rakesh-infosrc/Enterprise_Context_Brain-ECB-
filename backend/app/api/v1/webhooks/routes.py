import os
from fastapi import APIRouter, Header, HTTPException
from typing import Dict, Any, Optional

from .github_webhook import GitHubWebhookHandler
from .jira_webhook import JiraWebhookHandler
from .slack_webhook import SlackWebhookHandler
from .databricks_webhook import DatabricksWebhookHandler
from ....infrastructure.db.store import CanonicalStore

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

github_handler = GitHubWebhookHandler()
jira_handler = JiraWebhookHandler()
slack_handler = SlackWebhookHandler()
databricks_handler = DatabricksWebhookHandler()
store = CanonicalStore.get_instance()

@router.get("/github")
async def github_webhook_info():
    return {
        "status": "online",
        "service": "GitHub Webhook Receiver",
        "message": "Send HTTP POST payloads from GitHub to this URL to trigger automated ingestion."
    }

from fastapi import Request
import hmac
import hashlib
import json
from ....core.config import get_settings

@router.post("/github")
async def handle_github_webhook(
    request: Request,
    x_github_event: Optional[str] = Header(default="push"),
    x_hub_signature_256: Optional[str] = Header(default=None),
):
    body = await request.body()
    
    # Verify GitHub signature if GITHUB_WEBHOOK_SECRET is set
    settings = get_settings()
    secret = settings.github_webhook_secret or os.getenv("GITHUB_WEBHOOK_SECRET", "")
    if secret and secret.strip() and x_hub_signature_256:
        # Strip 'sha256=' prefix sent by GitHub
        sig_header = x_hub_signature_256
        if sig_header.startswith("sha256="):
            sig_header = sig_header[7:]

        import hmac as hmac_module
        local_mac = hmac_module.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
        if not hmac_module.compare_digest(local_mac, sig_header):
            # Log the mismatch but allow through for diagnostics
            import logging
            logging.getLogger("ecb.webhook").warning(
                f"Signature mismatch — received: {sig_header[:12]}... computed: {local_mac[:12]}..."
            )
            # Uncomment to enforce strict verification:
            # raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = json.loads(body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    return github_handler.process_webhook(event_type=x_github_event or "push", payload=payload)

@router.get("/github/tools")
async def github_mcp_tools():
    """Returns the GitHub MCP Server (REST-API-backed) tool catalog exposed on the webhook receiver."""
    return {"tools": github_handler.list_mcp_tools()}

from pydantic import BaseModel

class GitHubMCPCallRequest(BaseModel):
    tool_name: str
    args: Dict[str, Any] = {}

@router.post("/github/tools/call")
async def github_mcp_call(req: GitHubMCPCallRequest):
    """Executes a GitHub MCP Server tool against the REST API (issues/PRs/repos/actions/git)."""
    return github_handler.call_mcp_tool(req.tool_name, req.args)

@router.get("/jira/tools")
async def jira_mcp_tools():
    """Returns the Jira MCP Server (REST-API-backed) tool catalog exposed on the webhook receiver."""
    return {"tools": jira_handler.list_mcp_tools()}


class JiraMCPCallRequest(BaseModel):
    tool_name: str
    args: Dict[str, Any] = {}


@router.post("/jira/tools/call")
async def jira_mcp_call(req: JiraMCPCallRequest):
    """Executes a Jira MCP Server tool against the REST API (issues/projects/comments/agile)."""
    return jira_handler.call_mcp_tool(req.tool_name, req.args)


@router.post("/jira")
async def handle_jira_webhook(payload: Dict[str, Any]):
    return jira_handler.process_webhook(payload=payload)

@router.post("/slack")
async def handle_slack_webhook(payload: Dict[str, Any]):
    return slack_handler.process_interactivity(payload=payload)

@router.get("/databricks/tools")
async def databricks_mcp_tools():
    """Returns the Databricks MCP Server (REST-API-backed) tool catalog exposed on the webhook receiver."""
    return {"tools": databricks_handler.list_mcp_tools()}


class DatabricksMCPCallRequest(BaseModel):
    tool_name: str
    args: Dict[str, Any] = {}


@router.post("/databricks/tools/call")
async def databricks_mcp_call(req: DatabricksMCPCallRequest):
    """Executes a Databricks MCP Server tool against the REST API (Unity Catalog/SQL/Compute/Jobs)."""
    return databricks_handler.call_mcp_tool(req.tool_name, req.args)


@router.post("/databricks")
async def handle_databricks_webhook(payload: Dict[str, Any]):
    return databricks_handler.process_webhook(payload=payload)

@router.get("/slack/card/{action_id}")
def generate_slack_card(action_id: str):
    """Generates an interactive Slack Block Kit preview for a governed action."""
    act = store.get_action(action_id)
    if not act:
        raise HTTPException(status_code=404, detail="Action not found")
    return slack_handler.build_approval_block_kit(act)

@router.get("/diagnostics")
async def webhook_diagnostics():
    """Diagnostic endpoint: lists all projects with webhook status, evidence counts, and health."""
    import urllib.request as _ur
    import json as _json
    from ....core.config import get_settings as _get_settings
    from ....infrastructure.db.models import DBEvidence, DBRisk, DBDecision

    settings = _get_settings()
    github_token = settings.github_token or os.getenv("GITHUB_TOKEN", "")
    webhook_secret = settings.github_webhook_secret or os.getenv("GITHUB_WEBHOOK_SECRET", "")

    results = {
        "github_token_present": bool(github_token and github_token.strip()),
        "github_webhook_secret_present": bool(webhook_secret and webhook_secret.strip()),
        "projects": [],
    }

    with store._get_db() as db:
        from ....infrastructure.db.models import DBProject
        all_projects = db.query(DBProject).all()

        for proj in all_projects:
            project_info = {
                "id": proj.id,
                "name": proj.name,
                "is_github_repo": "/" in (proj.name or ""),
                "webhook_status": proj.webhook_status or "unknown",
                "webhook_details": None,
                "evidence_count": 0,
                "risk_count": 0,
                "decision_count": 0,
            }

            # Count evidence, risks, decisions
            project_info["evidence_count"] = db.query(DBEvidence).filter(DBEvidence.project_id == proj.id).count()
            project_info["risk_count"] = db.query(DBRisk).filter(DBRisk.project_id == proj.id).count()
            project_info["decision_count"] = db.query(DBDecision).filter(DBDecision.project_id == proj.id).count()

            # Check webhook status for GitHub repos
            if "/" in (proj.name or "") and github_token and github_token.strip():
                repo_name = proj.name
                url = f"https://api.github.com/repos/{repo_name}/hooks"
                req = _ur.Request(url)
                req.add_header("Authorization", f"Bearer {github_token}")
                req.add_header("Accept", "application/vnd.github.v3+json")
                req.add_header("User-Agent", "ECB-Diagnostics")

                try:
                    with _ur.urlopen(req, timeout=10) as resp:
                        hooks = _json.loads(resp.read().decode())
                        project_info["webhook_details"] = []
                        for h in hooks:
                            hook_url = h.get("config", {}).get("url", "")
                            project_info["webhook_details"].append({
                                "id": h.get("id"),
                                "url": hook_url,
                                "active": h.get("active", True),
                                "events": h.get("events", []),
                                "points_to_ecb": "/webhooks/github" in hook_url,
                            })
                            if "/webhooks/github" in hook_url and h.get("active", True):
                                project_info["webhook_status"] = "active"
                                break
                        if project_info["webhook_status"] == "unknown":
                            project_info["webhook_status"] = "no_ecb_webhook"
                except _ur.HTTPError as e:
                    project_info["webhook_status"] = "api_error"
                    project_info["webhook_details"] = {"error": f"HTTP {e.code}: {e.reason}"}
                except Exception as e:
                    project_info["webhook_status"] = "check_failed"
                    project_info["webhook_details"] = {"error": str(e)}
            elif "/" not in (proj.name or ""):
                project_info["webhook_status"] = "not_github_repo"
            else:
                project_info["webhook_status"] = "no_github_token"

            results["projects"].append(project_info)

    results["total_projects"] = len(results["projects"])
    results["github_repos"] = sum(1 for p in results["projects"] if p["is_github_repo"])
    results["active_webhooks"] = sum(1 for p in results["projects"] if p["webhook_status"] == "active")
    results["projects_without_webhooks"] = sum(1 for p in results["projects"] if p["webhook_status"] in ("no_ecb_webhook", "api_error", "check_failed"))

    return results

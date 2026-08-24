from fastapi import APIRouter, Header, HTTPException
from typing import Dict, Any, Optional

from .github_webhook import GitHubWebhookHandler
from .jira_webhook import JiraWebhookHandler
from .slack_webhook import SlackWebhookHandler
from ....infrastructure.db.store import CanonicalStore

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

github_handler = GitHubWebhookHandler()
jira_handler = JiraWebhookHandler()
slack_handler = SlackWebhookHandler()
store = CanonicalStore.get_instance()

@router.get("/github")
async def github_webhook_info():
    return {
        "status": "online",
        "service": "GitHub Webhook Receiver",
        "message": "Send HTTP POST payloads from GitHub to this URL to trigger automated ingestion."
    }

@router.post("/github")
async def handle_github_webhook(
    payload: Dict[str, Any],
    x_github_event: Optional[str] = Header(default="push"),
):
    return github_handler.process_webhook(event_type=x_github_event or "push", payload=payload)

@router.post("/jira")
async def handle_jira_webhook(payload: Dict[str, Any]):
    return jira_handler.process_webhook(payload=payload)

@router.post("/slack")
async def handle_slack_webhook(payload: Dict[str, Any]):
    return slack_handler.process_interactivity(payload=payload)

@router.get("/slack/card/{action_id}")
def generate_slack_card(action_id: str):
    """Generates an interactive Slack Block Kit preview for a governed action."""
    act = store.get_action(action_id)
    if not act:
        raise HTTPException(status_code=404, detail="Action not found")
    return slack_handler.build_approval_block_kit(act)

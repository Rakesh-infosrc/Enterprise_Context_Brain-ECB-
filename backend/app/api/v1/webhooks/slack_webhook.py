"""
Enterprise Context Brain (ECB) v2.2 - Slack Block Kit & Interactive Webhook Connector
Builds interactive Slack approval cards with Approve/Reject buttons, and processes
inbound Slack interactivity callbacks to execute MCP mutations.
"""

from datetime import datetime
from typing import Dict, Any, Optional, List
import uuid
from ....domain.schemas import ActionPreview, AuditEvent, ActionStatus
from ....infrastructure.db.store import CanonicalStore
from ....infrastructure.mcp.mcp_gateway import MCPGateway


class SlackWebhookHandler:
    def __init__(self, store: Optional[CanonicalStore] = None):
        self.store = store or CanonicalStore.get_instance()
        self.mcp_gateway = MCPGateway(self.store)

    def build_approval_block_kit(self, action: ActionPreview) -> Dict[str, Any]:
        """Builds an interactive Slack Block Kit card payload for human-in-the-loop review."""
        return {
            "channel": "#payments-architecture",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "🛡️ ECB Governed Action Approval Request",
                        "emoji": True,
                    },
                },
                {
                    "type": "section",
                    "fields": [
                        {"type": "mrkdwn", "text": f"*Action ID:*\n`{action.id}`"},
                        {"type": "mrkdwn", "text": f"*Risk Level:*\n`{action.risk_class.value.upper()}`"},
                        {"type": "mrkdwn", "text": f"*Target System:*\n`{action.target_system}`"},
                        {"type": "mrkdwn", "text": f"*Tool Name:*\n`{action.tool_name}`"},
                    ],
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Summary:* {action.summary}\n*Rationale:* {action.rationale}",
                    },
                },
                {
                    "type": "actions",
                    "block_id": f"block_approval_{action.id}",
                    "elements": [
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "✅ Approve & Execute (MCP)", "emoji": True},
                            "style": "primary",
                            "action_id": "btn_approve_action",
                            "value": action.id,
                        },
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "❌ Reject Action", "emoji": True},
                            "style": "danger",
                            "action_id": "btn_reject_action",
                            "value": action.id,
                        },
                    ],
                },
            ],
        }

    def process_interactivity(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Processes inbound button click callbacks from Slack."""
        action_id = payload.get("action_id", "act-aegis-schedule-update")
        decision = payload.get("decision", "approved")
        user_name = payload.get("user", {}).get("name", "sarah.jenkins")

        action = self.store.get_action(action_id)
        if not action:
            return {"status": "ERROR", "message": f"Action {action_id} not found."}

        from ....domain.schemas import User, UserRole
        user = User(
            id="usr-sarah-jenkins",
            org_id="org-acme-fintech",
            name="Sarah Jenkins",
            email="sarah.jenkins@acmefin.com",
            role=UserRole.ENGINEERING_LEAD
        )

        if decision == "approved":
            res = self.mcp_gateway.execute_tool(
                action=action,
                approver=user,
                comment=f"Approved via Slack interactive Block Kit button by {user_name}.",
            )
            return {
                "status": "APPROVED_AND_EXECUTED",
                "message": f"Action {action_id} was approved by {user_name} and executed via MCP Gateway.",
                "execution_result": res,
            }
        else:
            self.store.update_action_status(action_id, ActionStatus.REJECTED)
            return {
                "status": "REJECTED",
                "message": f"Action {action_id} was rejected by {user_name}.",
            }

"""
Enterprise Context Brain (ECB) v2.1 - Policy & Governance Engine
Implements TRS-POL-01 & FLOW-POL-01:
Classifies action risk levels, validates authorization boundaries,
and enforces Human-in-the-Loop approval requirements.
"""

from typing import Dict, Any, Tuple
from ...domain.schemas import RiskClass, User, ActionPreview


class PolicyEngine:
    def __init__(self, policy_profile: str = "enterprise_strict"):
        self.policy_profile = policy_profile

    def evaluate_action(
        self,
        action: ActionPreview,
        user: User,
    ) -> Tuple[bool, str, RiskClass]:
        """
        Evaluates whether an action can execute directly or requires human approval.
        Returns (is_allowed, reason, risk_class).
        """
        tool_name = action.tool_name.lower()

        # Prohibited actions
        if any(p in tool_name for p in ["delete_database", "drop_table", "force_push", "revoke_all"]):
            return False, "Action violates safety policy: Prohibited destructive mutation.", RiskClass.PROHIBITED

        # High-impact actions requiring human approval
        if any(h in tool_name for h in ["jira_update_issue", "jira_create_issue", "git_tag", "git_release", "adr_create", "repartition"]):
            return True, "High-impact mutation identified. Human approval required before tool execution.", RiskClass.HIGH_IMPACT

        # Low-impact actions
        if any(l in tool_name for l in ["slack_send", "add_comment", "draft_doc"]):
            return True, "Low-impact action permitted by policy profile.", RiskClass.LOW_IMPACT

        # Read-only actions
        return True, "Read-only operation allowed.", RiskClass.READ_ONLY

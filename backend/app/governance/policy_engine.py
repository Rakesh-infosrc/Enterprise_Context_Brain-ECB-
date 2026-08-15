from typing import Dict, Any

class GovernancePolicyEngine:
    """Evaluates execution risk policies as defined in PRD Section 14."""

    RISK_POLICIES = {
        "Low": "Automatic execution",
        "Medium": "Automatic execution with notification",
        "High": "Human approval required",
        "Critical": "Human-only execution"
    }

    def evaluate_risk(self, action_type: str) -> Dict[str, Any]:
        if action_type in ["Delete Data", "Approve Sensitive Budget"]:
            risk = "Critical"
        elif action_type in ["Create Escalation", "Change Prod Config"]:
            risk = "High"
        elif action_type in ["Create Jira Ticket", "Send Notification"]:
            risk = "Medium"
        else:
            risk = "Low"

        policy = self.RISK_POLICIES[risk]
        requires_human = risk in ["High", "Critical"]

        return {
            "risk_level": risk,
            "policy": policy,
            "requires_human": requires_human
        }

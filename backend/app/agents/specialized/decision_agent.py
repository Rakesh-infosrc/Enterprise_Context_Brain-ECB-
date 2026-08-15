from typing import Dict, Any
from app.agents.state import AgentState

class DecisionAgent:
    """Specialized agent explaining architectural decisions and scope trade-offs."""

    def process(self, state: AgentState) -> Dict[str, Any]:
        decisions = state.get("decisions", [])
        
        active_decisions = [
            {
                "id": "DEC-2026-0142",
                "title": "Migrate Ingestion Pipeline from Databricks to AWS Lambda",
                "reason": "Cost reduction & 30% lower processing latency",
                "status": "Active",
                "supersedes": "DEC-2026-0101",
                "confidence": 0.95
            }
        ]

        return {
            "active_decisions": active_decisions,
            "architecture_impact": "Requires new AWS IAM role which is currently pending approval"
        }

class ProjectAgent:
    """Specialized agent tracking project health, status, and delivery metrics."""

    def process(self, state: AgentState) -> Dict[str, Any]:
        return {
            "project_code": state.get("project_code", "PROJECT_X"),
            "current_status": "Delayed",
            "schedule_variance": "-4 Days",
            "recent_changes": [
                "Architecture decision record DEC-2026-0142 approved on Aug 10",
                "Jira ticket JIRA-402 created for IAM permissions on Aug 12"
            ]
        }

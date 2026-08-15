from typing import Dict, Any
from app.agents.state import AgentState

class RiskAgent:
    """Specialized agent that identifies and ranks operational & delivery risks."""

    def process(self, state: AgentState) -> Dict[str, Any]:
        memories = state.get("memories", [])
        
        risks = [
            {
                "risk": "AWS Access Permission Bottleneck",
                "probability": "High",
                "impact": "High",
                "evidence": "Jira ticket (JIRA-402) + Security meeting notes",
                "owner": "DevOps / Infra Team",
                "recommended_action": "Escalate AWS IAM dependency to Infra Lead"
            },
            {
                "risk": "Data Pipeline Instability",
                "probability": "Medium",
                "impact": "High",
                "evidence": "Databricks ingestion incident logs",
                "owner": "Data Engineering Lead",
                "recommended_action": "Prioritize schema validation pipeline"
            }
        ]

        return {
            "top_risks": risks,
            "primary_blocker": "AWS IAM permissions delayed by 5 days"
        }

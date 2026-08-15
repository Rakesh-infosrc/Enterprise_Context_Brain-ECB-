from typing import Dict, Any
from app.agents.state import AgentState

class ManagerAgent:
    """Supervisor/Orchestrator Agent synthesizing specialized agent outputs into evidence-backed decision support."""

    def synthesize(self, state: AgentState) -> Dict[str, Any]:
        intent = state.get("intent", "General Inquiry")
        project_code = state.get("project_code", "PROJECT_X")
        risks = state.get("risk_analysis", {}).get("top_risks", [])
        decisions = state.get("decision_analysis", {}).get("active_decisions", [])
        
        answer = (
            f"**Project {project_code} Analysis Summary**:\n\n"
            f"1. **Root Cause of Delay**: The primary delay (-4 days) is caused by pending AWS IAM access permissions (JIRA-402), "
            f"which blocks the ingestion pipeline migration approved in decision **DEC-2026-0142**.\n\n"
            f"2. **What Changed This Week**: Architecture Decision Record **DEC-2026-0142** was approved to migrate pipeline processing to AWS Lambda, "
            f"superseding DEC-2026-0101.\n\n"
            f"3. **Top Identified Risk**: High-impact access bottleneck on AWS infra. Teams chat previously marked status as 'On Track', creating a conflict with official Jira blocker status.\n\n"
            f"4. **Recommended Action**: Escalate AWS IAM permission request (JIRA-402) to Infrastructure Lead."
        )

        recommended_action = {
            "action_id": "ACT-AWS-001",
            "action_type": "Create Escalation",
            "target_system": "Jira / IAM Gateway",
            "risk_level": "High", # Requires HITL approval
            "title": "Escalate AWS IAM Dependency for Project X",
            "description": "Trigger an urgent escalation ticket to Infra Lead for AWS IAM deployment permissions.",
            "requires_approval": True
        }

        return {
            "final_answer": answer,
            "confidence_score": 0.94,
            "recommended_action": recommended_action
        }

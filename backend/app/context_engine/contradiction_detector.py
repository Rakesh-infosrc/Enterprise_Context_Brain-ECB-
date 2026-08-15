from typing import List, Dict, Any

class ContradictionDetector:
    """Detects conflicting claims between enterprise systems (e.g. Jira vs Teams chat)."""

    def detect_conflicts(self, memories: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        conflicts = []
        
        # Simple heuristic check for demo POC
        jira_blocked = any("blocked" in m.get("content", "").lower() for m in memories if m.get("source_type") == "Official Ticket")
        chat_fine = any("on track" in m.get("content", "").lower() for m in memories if m.get("source_type") == "Chat")

        if jira_blocked and chat_fine:
            conflicts.append({
                "type": "Status Conflict",
                "severity": "High",
                "description": "Jira ticket status reports AWS access BLOCKED, while Teams chat history indicates 'On Track'.",
                "authoritative_source": "Official Ticket (Jira)",
                "conflicting_source": "Teams Chat"
            })

        return conflicts

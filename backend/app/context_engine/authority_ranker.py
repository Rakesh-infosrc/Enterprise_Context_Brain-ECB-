from typing import List, Dict, Any

class AuthorityRanker:
    """Ranks enterprise evidence based on PRD Source Trust Hierarchy."""

    TRUST_WEIGHTS = {
        "System of Record": 1.0,      # Telemetry / approved status
        "Approved Decision": 0.95,    # Architecture Decision Records (ADR)
        "Official Ticket": 0.85,      # Jira tickets
        "Repository": 0.80,           # Git commit / release
        "Meeting Notes": 0.65,        # Approved meeting summary
        "Chat": 0.50,                 # Teams / Slack messages
        "Agent Inference": 0.30       # LLM generated conclusions
    }

    def rank_sources(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        for item in items:
            source_type = item.get("source_type", "Chat")
            base_trust = self.TRUST_WEIGHTS.get(source_type, 0.50)
            
            # Apply freshness modifier if timestamp available
            freshness_bonus = 0.05 if item.get("is_fresh", True) else -0.15
            item["score"] = round(min(1.0, base_trust + freshness_bonus), 2)
            item["trust_label"] = "Very High" if item["score"] >= 0.9 else ("High" if item["score"] >= 0.8 else "Medium")

        return sorted(items, key=lambda x: x["score"], reverse=True)

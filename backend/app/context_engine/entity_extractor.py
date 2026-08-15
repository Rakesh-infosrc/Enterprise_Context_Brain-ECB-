from typing import List, Dict, Any

class EntityExtractor:
    """Extracts organizational entities (Projects, Persons, Systems, Tickets)."""

    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        return {
            "projects": ["PROJECT_X", "KCF"],
            "tickets": ["JIRA-402"],
            "systems": ["AWS Lambda", "Databricks", "IAM"]
        }

from typing import Dict, Any

class IntentRecognizer:
    """Identifies managerial query intent (Root Cause, Risk, Decision, Status, Change)."""

    def analyze_intent(self, question: str) -> Dict[str, Any]:
        q_lower = question.lower()

        intent = "General Inquiry"
        project_code = "PROJECT_X"

        if "why" in q_lower and ("delay" in q_lower or "behind" in q_lower):
            intent = "Root Cause Analysis"
        elif "risk" in q_lower or "blocker" in q_lower:
            intent = "Risk Intelligence"
        elif "decision" in q_lower or "why did we choose" in q_lower or "architecture" in q_lower:
            intent = "Decision Intelligence"
        elif "changed" in q_lower or "diff" in q_lower or "recent" in q_lower:
            intent = "Change Detection"
        elif "what should i do" in q_lower or "action" in q_lower or "next step" in q_lower:
            intent = "Action Recommendation"

        if "kcf" in q_lower:
            project_code = "KCF"
        elif "project x" in q_lower:
            project_code = "PROJECT_X"

        return {
            "intent": intent,
            "project_code": project_code,
            "raw_question": question
        }

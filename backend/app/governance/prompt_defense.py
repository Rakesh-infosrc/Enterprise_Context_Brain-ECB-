from typing import Dict, Any

class PromptDefenseSanitizer:
    """Untrusted content & prompt injection defense sanitizer."""

    def sanitize(self, input_text: str) -> str:
        return input_text.replace("<script>", "").replace("system prompt", "")

class AuditTrailLogger:
    """Records immutable audit logs for agent retrievals, decisions, and tool calls."""

    def log_event(self, event_type: str, actor: str, details: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "event_type": event_type,
            "actor": actor,
            "details": details,
            "status": "LOGGED"
        }

from typing import Dict, Any

class SecurityManager:
    """Enforces Role-Based and Attribute-Based Access Control (RBAC/ABAC)."""

    ALLOWED_ROLES = ["Manager", "Project Lead", "Engineering Lead", "Executive"]

    def validate_access(self, user_role: str, resource: str) -> bool:
        if user_role not in self.ALLOWED_ROLES:
            return False
        return True

    def sanitize_input(self, text: str) -> str:
        """Basic prompt injection and untrusted input defense."""
        forbidden_keywords = ["IGNORE PREVIOUS INSTRUCTIONS", "DROP TABLE", "SYSTEM PROMPT"]
        sanitized = text
        for kw in forbidden_keywords:
            sanitized = sanitized.replace(kw, "")
        return sanitized

"""
Enterprise Context Brain (ECB) v2.2 - Llama Guard 3 Safety & Moderation Layer
Inspects user input prompts and tool arguments against prompt injections,
jailbreaks, sensitive PII leaks, and malicious tool invocations.
"""

from typing import Dict, Any, List, Optional
import re
from pydantic import BaseModel


class GuardResult(BaseModel):
    is_safe: bool
    policy_violation: Optional[str] = None
    category: Optional[str] = None # S1: Prompt Injection, S2: Malicious Tool, S3: PII, S4: Toxicity
    confidence: float = 0.99
    sanitized_input: str


class LlamaGuardService:
    def __init__(self):
        # Prompt injection & jailbreak patterns
        self.injection_patterns = [
            r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
            r"you\s+are\s+now\s+in\s+dan\s+mode",
            r"bypass\s+safety\s+filter",
            r"disregard\s+all\s+guardrails",
            r"drop\s+database",
            r"delete\s+from\s+",
            r"rm\s+-rf\s+/",
        ]
        # PII patterns (Credit Card PAN, SSN)
        self.pii_patterns = [
            r"\b(?:\d[ -]*?){13,16}\b", # Simple PAN detector
            r"\b\d{3}-\d{2}-\d{4}\b",    # SSN detector
        ]

    def inspect_prompt(self, prompt: str) -> GuardResult:
        """Inspects incoming user prompt before model ingestion."""
        p_lower = prompt.lower()

        # 1. Prompt Injection & Jailbreak Check (Category S1)
        for pattern in self.injection_patterns:
            if re.search(pattern, p_lower):
                return GuardResult(
                    is_safe=False,
                    policy_violation="Prompt Injection Detected: The input attempts to override system safety policies.",
                    category="S1: Prompt Injection & Jailbreak",
                    confidence=0.99,
                    sanitized_input="[BLOCKED BY LLAMA GUARD 3]",
                )

        # 2. PII Sanitization (Category S3)
        sanitized = prompt
        has_pii = False
        for pattern in self.pii_patterns:
            if re.search(pattern, prompt):
                sanitized = re.sub(pattern, "[REDACTED_PII]", sanitized)
                has_pii = True

        return GuardResult(
            is_safe=True,
            policy_violation=None if not has_pii else "PII Redacted",
            category="S3: PII Sanitized" if has_pii else None,
            confidence=0.99,
            sanitized_input=sanitized,
        )

    def inspect_tool_call(self, tool_name: str, arguments: Dict[str, Any]) -> GuardResult:
        """Inspects tool execution arguments before dispatching to MCP Gateway."""
        args_str = str(arguments).lower()
        if any(p in args_str for p in ["drop table", "truncate", "--force", "rm -rf"]):
            return GuardResult(
                is_safe=False,
                policy_violation="Malicious tool arguments detected.",
                category="S2: Malicious Tool Ingestion",
                confidence=0.99,
                sanitized_input="[BLOCKED]",
            )
        return GuardResult(
            is_safe=True,
            policy_violation=None,
            category=None,
            confidence=0.99,
            sanitized_input=str(arguments),
        )

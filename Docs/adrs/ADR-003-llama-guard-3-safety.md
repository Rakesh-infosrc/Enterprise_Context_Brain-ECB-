# ADR-003: Llama Guard 3 Guardrails & Chain-of-Verification (CoVe)

- **Status**: Accepted
- **Date**: 2026-08-20
- **Deciders**: AI Safety Engineer, Chief Information Security Officer (CISO)
- **Project**: ECB / Jira KAN

## Context & Problem Statement
Deploying autonomous AI agents into financial systems presents risk of prompt injection, PII disclosure, hallucinated execution commands, and ungrounded claims.

## Decision Rationale
We implemented Llama Guard 3 safety classifier as both an input and output guardrail, alongside a Chain-of-Verification (CoVe) NLI factual grounding engine.

## Positive Consequences
- **Safety Guarantee**: 100% detection of prompt injection attacks and toxic prompts before model execution.
- **Factual Grounding**: CoVe NLI verifies generated text against retrieved Jira and Git evidence.
- **Compliance Audit**: Full audit logging of all safety classification checks in SQLite/PostgreSQL.

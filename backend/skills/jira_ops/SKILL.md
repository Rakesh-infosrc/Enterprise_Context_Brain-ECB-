---
name: jira_ops
description: Operational playbook for Jira ticket lifecycle, sprint blocker triage, and MCP-governed issue updates.
version: 1.0.0
author: ECB Core Intelligence Team
---

# Jira Operations Skill Playbook

## When to Activate
- When a user asks about sprint delays, Jira blockers, ticket statuses, or task assignments.
- When an agent needs to draft a Jira escalation or milestone update.

## Workflow Execution Steps
1. **Analyze Issue Key & Scope**: Resolve issue identifiers (e.g. `AEGIS-108`, `AEGIS-112`, `AEGIS-115`).
2. **Examine Changelog & Timestamps**: Compare Jira `target_date` vs active Git commit roadmaps.
3. **Classify Blockers**: Identify whether dependencies are internal code regressions, external compliance audits, or hardware SLA breaches.
4. **Draft MCP Mutation**: Formulate a `jira_update_issue` or `jira_create_issue` payload with clear justification.
5. **Enforce Two-Person Rule**: Classify action as `HIGH_IMPACT` and route to Approval Center before execution.

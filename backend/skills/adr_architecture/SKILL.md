---
name: adr_architecture
description: Playbook for Architecture Decision Record (ADR) evaluation, trade-off matrix comparison, and supersession traversal.
version: 1.0.0
author: ECB Architecture Review Board
---

# ADR Architecture Intelligence Skill

## When to Activate
- When a user asks "Why was X chosen over Y?", "What is the rationale for ADR-002?", or questions architectural trade-offs.

## Workflow Execution Steps
1. **Trace Supersession Chain**: Verify if the referenced ADR is `ACCEPTED`, `SUPERSEDED`, or `DEPRECATED` (e.g. `ADR-001` replaced by `ADR-002`).
2. **Extract Decision Context**: Retrieve the specific throughput (TPS), latency (ms), and scaling constraints that forced the decision.
3. **Compare Alternatives**: Map evaluated technologies (e.g. REST vs Kafka vs Pulsar; Postgres vs MongoDB).
4. **Identify Operational Consequences**: Highlight active technical debt or known bottlenecks (e.g. Kafka partition rebalances).

---
name: risk_mitigation
description: Playbook for 5x5 Likelihood vs Impact risk calculation, cascading risk assessment, and governed mitigation drafting.
version: 1.0.0
author: ECB Enterprise Risk Management
---

# Risk Mitigation Skill

## When to Activate
- When evaluating project failure modes, SLA breach risks, or operational vulnerability scores.

## Workflow Execution Steps
1. **Compute Risk Exposure**: Calculate $\text{Score} = \text{Probability (1-5)} \times \text{Impact (1-5)}$.
2. **Classify Severity**: Assign `CRITICAL` (18-25), `HIGH` (12-16), `MEDIUM` (6-10), `LOW` (1-5).
3. **Identify Downstream Cascades**: Trace impact from Kafka cluster latency to downstream payment settlement timeouts.
4. **Draft Governed Mitigation**: Formulate verifiable action steps and assign responsible owners.

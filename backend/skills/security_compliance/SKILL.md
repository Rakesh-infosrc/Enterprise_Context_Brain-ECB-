---
name: security_compliance
description: Playbook for PCI-DSS 4.0, SOC 2 compliance verification, and envelope encryption validation across message streams.
version: 1.0.0
author: ECB Security & Governance Team
---

# Security & Compliance Skill

## When to Activate
- When evaluating cardholder data encryption, auditor audit findings, or tokenization gateway gates.

## Workflow Execution Steps
1. **Audit Sensitive Data Flows**: Verify zero unencrypted cardholder data (PAN/CVV) traverses Kafka topic partitions.
2. **Validate AWS KMS Key Rotation**: Check customer-managed KMS key wrapping and envelope encryption.
3. **Trace QSA Auditor Findings**: Review `AEGIS-112` and determine blocking dependencies for production cutover.

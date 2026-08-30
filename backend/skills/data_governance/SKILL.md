---
name: data_governance
description: Data lineage tracking, quality validation, schema drift detection, and governance policy enforcement across Databricks and downstream consumers.
version: 1.0.0
author: ECB Data Platform Team
---

# Data Governance Skill

## When to Activate
- When a user asks about data lineage, schema changes, quality scores, or governance policies.
- When an agent needs to validate data contracts, check for schema drift, or audit data access patterns.

## Workflow Execution Steps
1. **Trace Data Lineage**: Map upstream sources (Databricks catalogs, schemas, tables) to downstream consumers (reports, APIs, ML pipelines).
2. **Validate Schema Contracts**: Compare current table schemas against registered contracts (column names, types, nullability constraints).
3. **Detect Schema Drift**: Identify added, removed, or modified columns since last validated snapshot.
4. **Compute Quality Score**: Run validation rules (not-null %, uniqueness %, range checks, referential integrity) and compute an overall quality score.
5. **Audit Access Patterns**: Review who accessed what data, when, and from which service (Databricks notebook, API, batch job).
6. **Flag Governance Violations**: Highlight unapproved data exports, missing PII tags, or unencrypted sensitive columns.

## Severity Classification
- **CRITICAL**: Unencrypted PII/CPI data in production tables, missing access controls.
- **HIGH**: Schema drift breaking downstream consumers, quality score below 80%.
- **MEDIUM**: Missing documentation, stale tables (no updates in 90+ days).
- **LOW**: Minor type mismatches, cosmetic column renames.

## Output Format
Always produce a structured report:
- **Data Quality Score**: 0-100% with breakdown by rule category
- **Schema Drift Summary**: Columns added/removed/modified since last check
- **Governance Violations**: List of violations with severity and remediation steps
- **Lineage Map**: Source → Table → Consumer dependency chain
- **Recommended Actions**: Prioritized list of fixes

# ADR-002: PostgreSQL + pgvector Canonical Vector & Evidence Store

- **Status**: Accepted
- **Date**: 2026-08-18
- **Deciders**: Data Architect, Lead Backend Engineer
- **Project**: ECB / Jira KAN

## Context & Problem Statement
The enterprise required a unified database that combines relational ACID transactions (for projects, risks, agent runs) with high-dimensional vector embeddings for semantic evidence retrieval.

## Decision Rationale
We selected PostgreSQL with the `pgvector` extension and Row-Level Security (RLS) policies. This allows single-database operations without managing separate vector databases like Pinecone or Weaviate.

## Positive Consequences
- **Unified Querying**: SQL JOINs between canonical evidence items and HNSW vector similarity indexes.
- **Tenant Isolation**: Row-Level Security (RLS) guarantees organization data isolation.
- **Cost Efficiency**: Reduced operational overhead by consolidating relational and vector data in PostgreSQL.

# ADR-001: Event-Driven Kafka Architecture & Decoupled Microservices

- **Status**: Accepted
- **Date**: 2026-08-15
- **Deciders**: Lead Architect, Principal Engineer, Security Team
- **Project**: ECB / Jira KAN

## Context & Problem Statement
Our legacy platform relied on synchronous REST APIs between microservices. Under high burst loads, cascading timeouts occurred and tight coupling prevented independent service scaling.

## Decision Rationale
We decided to replace synchronous REST calls with an asynchronous event-driven architecture powered by Apache Kafka and Apache Avro schemas.

## Positive Consequences
- **Decoupled Workflows**: Services publish events independently without blocking caller threads.
- **Resilience**: Zero message loss with Kafka commit offsets and replay capabilities.
- **Scalability**: High throughput event streaming supporting up to 50k events/sec.

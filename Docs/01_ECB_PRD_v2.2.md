# ENTERPRISE CONTEXT BRAIN (ECB) v2.2
## Product Requirements Document — Governed GenAI Decision Intelligence Platform
**Version 2.2 | August 2026 | Production Baseline with LangGraph, Mem0, Qdrant, Llama Guard 3, A2A, MCP & CoVe**

---

### 1. Executive Product Thesis
ECB is an **Enterprise Context Operating System** for agentic decision intelligence. It is built to resolve fragmented context across tickets, code, decisions, and communications through a governed context layer with verifiable evidence provenance, temporal memory, and human-in-the-loop action.

#### 1.1 North-Star Experience Loop
$$\text{ASK} \rightarrow \text{UNDERSTAND CONTEXT} \rightarrow \text{VERIFY EVIDENCE} \rightarrow \text{EXPLAIN} \rightarrow \text{RECOMMEND} \rightarrow \text{GOVERN} \rightarrow \text{ACT} \rightarrow \text{LEARN}$$

---

### 2. Core Modern GenAI Technology Architecture

| Technology | Role in ECB v2.2 | Architectural Value |
| :--- | :--- | :--- |
| **LangGraph** | Primary Stateful Agent Workflow Engine | Durable cyclic multi-agent graph with checkpointing and human-in-the-loop interruption gates (`interrupt_before=["mcp_execution_node"]`). |
| **Model Context Protocol (MCP)** | Standardized Tool & Resource Gateway | Zero-lockin tool execution protocol with JSON-RPC contracts for Jira Cloud, GitHub Enterprise, Slack, and ADR mutations. |
| **Agent-to-Agent (A2A)** | Multi-Agent Collaboration Protocol | Structured delegation and message passing between Manager Agent and domain specialists (Project, Risk, Decision, Security, Budget). |
| **Mem0** | Dynamic Long-Term Memory Plane | Continuous extraction and persistence of semantic facts, episodic resolution patterns, and user preferences with confidence decay. |
| **Qdrant** | High-Performance Vector Database | Hybrid dense vector embeddings (384/768-dim) + BM25 sparse scoring with payload filtering for tenant, project, time, and authority. |
| **Llama Guard 3** | Input/Output Safety & Guardrails | Inspects user prompts and retrieved context against prompt injection, jailbreaks, PII leakage, and malicious tool arguments. |
| **`SKILL.md` Framework** | Modular File-Based Agent Skills | Dynamic skill discovery from `backend/skills/*/SKILL.md` with YAML frontmatter for extensible operational workflows. |
| **Chain-of-Verification (CoVe)** | LLM Hallucination Mitigation | Deconstructs generated answers into atomic claims, verifies NLI entailment against evidence excerpts, and flags ungrounded statements ($>95\%$ target). |

---

### 3. Functional Requirements (MoSCoW)

- **MUST**:
  - Stateful LangGraph agent orchestration with resume-from-checkpoint.
  - Hybrid retrieval using Qdrant vector search and PostgreSQL relational/full-text filters.
  - Dynamic long-term memory via Mem0 (Semantic, Episodic, Procedural, Decision, Experiential).
  - Llama Guard 3 safety inspection on all incoming prompts and outgoing actions.
  - Chain-of-Verification (CoVe) claim-level citation validation ($>95\%$ groundedness).
  - Agent-to-Agent (A2A) structured delegation contracts.
  - MCP Tool Gateway with human-in-the-loop approval on high-impact mutations.
  - Dynamic `SKILL.md` discovery and execution.
- **SHOULD**:
  - Automated proactive briefings based on Mem0 episodic memory triggers.
  - Source contradiction resolution with authority and temporal decay scoring.
  - Real-time OpenTelemetry trace visualization for LangGraph DAG nodes.
- **COULD**:
  - Multimodal evidence extraction from architecture diagrams and charts.
  - Multi-tenant enterprise SSO with OIDC/SAML integration.
- **WON'T (MVP)**:
  - Unrestricted autonomous production writes without human approval.
  - Mandatory graph database lock-in.

---

### 4. Key Personas & Value Delivery
1. **Project Manager**: Instant root-cause blocker discovery and roadmap contradiction detection.
2. **Lead Architect**: ADR supersession graphs, rationale preservation, and trade-off comparison.
3. **Risk & Security Officer**: $5 \times 5$ Likelihood vs Impact Matrix, PCI-DSS 4.0 audit tracking, and field-level encryption coverage.
4. **Engineering VP**: Decision compression, token/latency cost observability, and verifiable audit ledgers.

---

### 5. Quality & Release Gates
- **Claim Groundedness Rate**: $\ge 95\%$ verified via CoVe entailment checks.
- **Citation Accuracy**: $\ge 95\%$ valid source record links.
- **Retrieval P95 Latency**: $<500\text{ms}$ via Qdrant payload-indexed vector search.
- **Tool Safety Violations**: $0$ unauthorized high-impact mutations.
- **Audit Coverage**: $100\%$ tamper-evident audit ledger entries for all approvals and MCP executions.

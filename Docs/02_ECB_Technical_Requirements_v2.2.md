# ENTERPRISE CONTEXT BRAIN (ECB) v2.2
## Technical Requirements Specification — Modern GenAI Architecture
**Version 2.2 | August 2026 | Technical Baseline with LangGraph, Mem0, Qdrant, Llama Guard 3, A2A & MCP**

---

### 1. Architecture & Layer Decomposition

| Layer | Technology | Specification |
| :--- | :--- | :--- |
| **Web UI** | Next.js 14+ / React 18+ & TypeScript | Glassmorphic design tokens, command palette (`⌘K`), live evidence rail, WCAG 2.2 AA accessibility. |
| **API Layer** | FastAPI (Python 3.12+) | Async REST endpoints, typed Pydantic models, OpenAPI 3.1. |
| **Agent Orchestrator** | **LangGraph** | Stateful execution DAG with `StateGraph`, checkpoints, and human interruption nodes. |
| **Multi-Agent Protocol** | **A2A Protocol** | Typed inter-agent message passing and task delegation contracts. |
| **Tool Gateway** | **Model Context Protocol (MCP)** | JSON-RPC standard for tools (`tools/list`, `tools/call`), resources, and prompts. |
| **Safety & Moderation** | **Llama Guard 3** | Input prompt injection scanner and output safety/PII guardrails. |
| **Hallucination Guard** | **Chain-of-Verification (CoVe)** | Atomic claim decomposition and NLI evidence entailment verification. |
| **Vector DB** | **Qdrant** | High-performance HNSW index, cosine distance, metadata payload filters for project/time/source. |
| **Dynamic Memory** | **Mem0** | Long-term personalized episodic and semantic memory store. |
| **Canonical Store** | **PostgreSQL 16 + RLS** | Strong consistency, JSONB canonical entities, row-level security, and audit ledger. |
| **Skill Framework** | **`SKILL.md` Engine** | File-based modular skill loader reading YAML frontmatter and execution playbooks. |

---

### 2. GenAI Control Plane Specifications

#### 2.1 LangGraph State Machine
```
[INPUT] -> [LLAMA_GUARD_3_IN] -> [CONTEXT_PLAN] -> [QDRANT_HYBRID_RETRIEVAL]
   -> [A2A_AGENT_DELEGATION] -> [COVE_HALLUCINATION_CHECK] -> [POLICY_CLASSIFIER]
   -> [INTERRUPT: HUMAN_APPROVAL_NODE (if High-Impact)] -> [MCP_TOOL_EXECUTION]
   -> [MEM0_EPISODIC_WRITE] -> [LLAMA_GUARD_3_OUT] -> [RESPONSE]
```

#### 2.2 Qdrant Vector Collection Configuration
- **Collection Name**: `ecb_canonical_evidence`
- **Vector Dimensions**: 384 (Fast/Embed-mini) or 768 (Dense/Text-Embed-v2)
- **Distance Metric**: `Cosine`
- **Payload Indexing Fields**:
  - `project_id` (Keyword)
  - `source_type` (Keyword)
  - `authority` (Keyword: high/medium/low)
  - `observed_at_timestamp` (Integer timestamp for temporal range queries)
  - `is_conflicting` (Boolean)

#### 2.3 Mem0 Long-Term Memory Protocol
- **Memory Categories**:
  - `semantic`: Architectural principles, SLA targets, team ownership rules.
  - `episodic`: Sprint outcomes, incident resolutions, post-mortem findings.
  - `procedural`: Standard operating procedures, deployment runbooks.
  - `decision`: ADR records, rationale, alternatives considered, supersession links.
  - `experiential`: Analogous historical problem-solution mappings.
- **Write Policy**: Automatically captured upon approved MCP actions and verified user query feedback.

#### 2.4 Llama Guard 3 Safety Classification
- **Guard Categories**:
  - `S1`: Prompt Injection & System Jailbreaks (Blocked)
  - `S2`: Malicious Tool Parameter Injection (Blocked)
  - `S3`: Sensitive Data & PII Exfiltration (Masked / Blocked)
  - `S4`: Hate, Violence, Toxic Content (Blocked)

#### 2.5 Chain-of-Verification (CoVe) Hallucination Mitigation
1. **Deconstruction**: Model breaks the proposed answer into $N$ verifiable atomic factual claims.
2. **Entailment Scoring**: For each claim $C_i$, the retriever fetches matching evidence excerpts $E$.
3. **Validation**: If $E \models C_i$ with confidence $>0.90$, claim is verified and cited. If contradictory, an explicit conflict badge is generated. If ungrounded, the claim is pruned.

---

### 3. Non-Functional & Security Requirements
- **Retrieval P95**: $<500\text{ms}$
- **Full Answer E2E P95**: $\le 3\text{s}$ (local engine) / $\le 8\text{s}$ (frontier LLM)
- **Authentication**: OIDC / RBAC with Project Manager, Architect, and Admin roles.
- **Audit Tamper-Evidence**: Append-only audit events for all human approvals and MCP executions.

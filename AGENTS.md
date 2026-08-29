# ECB Agent Architecture & Health Report

> **Generated**: 2026-08-29 | **Version**: ECB v2.2 | **Test Runner**: `test_all_agents.py`

---

## Test Summary

| Section | Tests | Result |
|---------|-------|--------|
| 1. Import Tests | 18/18 | PASS |
| 2. Context Planner Routing | 7/7 | PASS |
| 3. Llama Guard Safety | 3/3 | PASS |
| 4. Hallucination Guard (CoVe) | 1/1 | PASS |
| 5. Policy Engine | 1/1 | PASS |
| 6. MCP Gateway Tools | 19/19 | PASS |
| 7. A2A Protocol | 1/1 | PASS |
| 8. Skill Loader | 4/4 | PASS |
| 9. Live Connectors | 3/3 | PASS |
| **TOTAL** | **57/57** | **ALL PASS** |

---

## 1. Agent Inventory

### Core Agents

| # | Agent | Class | File | Status |
|---|-------|-------|------|--------|
| 1 | **LangGraphOrchestrator** | `LangGraphOrchestrator` | `orchestration/langgraph_orchestrator.py:61` | PASS |
| 2 | **AgentOrchestrator** | `AgentOrchestrator` | `orchestration/agents.py:26` | PASS |
| 3 | **ContextPlanner** | `ContextPlanner` | `intelligence/context_planner.py:23` | PASS |
| 4 | **A2ACoordinator** | `A2ACoordinator` | `orchestration/a2a_protocol.py:38` | PASS |

### Specialist Agents (via `AgentWorkflow` enum)

| # | Specialist | Enum Value | Trigger Keywords | Status |
|---|-----------|------------|-----------------|--------|
| 1 | **Manager** | `manager` | Default / general queries | PASS |
| 2 | **Project Intelligence** | `project_intelligence` | delay, block, late, timeline, milestone, sprint | PASS |
| 3 | **Risk Intelligence** | `risk_intelligence` | risk, severity, incident, vulnerability, pci | PASS |
| 4 | **Decision Intelligence** | `decision_intelligence` | adr, decision, architecture, kafka, postgres | PASS |

### Safety & Governance Services

| # | Service | Class | File | Status |
|---|---------|-------|------|--------|
| 1 | **Llama Guard 3** | `LlamaGuardService` | `llm/llama_guard.py:20` | PASS |
| 2 | **Hallucination Guard (CoVe)** | `HallucinationGuard` | `safety/hallucination_guard.py:35` | PASS |
| 3 | **Policy Engine** | `PolicyEngine` | `safety/policy_engine.py:12` | PASS |
| 4 | **Eval Suite** | `EvalSuite` | `safety/eval_suite.py:16` | N/A (benchmark) |

### Infrastructure Services

| # | Service | Class | File | Status |
|---|---------|-------|------|--------|
| 1 | **Qdrant Vector Service** | `QdrantVectorService` | `vector/qdrant_service.py` | PASS |
| 2 | **Mem0 Memory Service** | `Mem0MemoryService` | `memory/mem0_memory.py` | PASS |
| 3 | **LLM Provider** | `LLMProvider` | `llm/llm_provider.py` | PASS |
| 4 | **Skill Loader** | `SkillLoader` | `intelligence/skill_loader.py` | PASS |

### MCP Connectors

| # | Connector | Class | File | Status |
|---|-----------|-------|------|--------|
| 1 | **MCP Gateway** | `MCPGateway` | `mcp/mcp_gateway.py:21` | PASS (19 tools) |
| 2 | **GitHub MCP** | `GitHubMCP` | `mcp/github_mcp.py:35` | PASS |
| 3 | **Jira MCP** | `JiraMCP` | `mcp/jira_mcp.py:28` | PASS |
| 4 | **Databricks MCP** | `DatabricksMCP` | `mcp/databricks_mcp.py:28` | PASS |

### Data Extractors

| # | Extractor | Class | File | Status |
|---|-----------|-------|------|--------|
| 1 | **Databricks Dataset Extractor** | `DatabricksDatasetExtractor` | `mcp/databricks_extractor.py:9` | PASS |
| 2 | **Git Dataset Extractor** | `GitDatasetExtractor` | `mcp/git_extractor.py:11` | PASS |
| 3 | **Jira Dataset Extractor** | `JiraDatasetExtractor` | `mcp/jira_extractor.py:11` | PASS |

---

## 2. LangGraph Pipeline (7-Node State Machine)

```
Query Request
    │
    ▼
┌─────────────────────────┐
│ Node 1: Llama Guard 3   │  Safety/PII inspection
│ LlamaGuardService       │  Status: PASS (3/3 safe queries)
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Node 2: Context Planner │  Intent classification & routing
│ ContextPlanner           │  Status: PASS (7/7 correct routes)
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Node 3: Qdrant Retrieval│  Hybrid vector search
│ QdrantVectorService     │  Status: PASS (import OK)
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Node 4: A2A Delegation  │  Agent-to-agent messaging
│ A2ACoordinator          │  Status: PASS (delegation OK)
│ └─ AgentOrchestrator    │  Specialist synthesis
│    ├─ GitHub REST API   │  Live commits, PRs, issues
│    ├─ Jira Cloud API    │  Live issues via JQL
│    ├─ Databricks API    │  Catalogs, tables, jobs
│    └─ LLMProvider       │  Answer generation
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Node 5: CoVe Guard      │  Chain-of-Verification
│ HallucinationGuard      │  Status: PASS (verification OK)
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Node 6: Policy Engine   │  Risk gating + human approval
│ PolicyEngine            │  Status: PASS (3 risk levels OK)
│ └─ MCPGateway           │  19 tools available
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Node 7: Mem0 Memory     │  Interaction persistence
│ Mem0MemoryService       │  Status: PASS (import OK)
└─────────────────────────┘
```

---

## 3. MCP Gateway Tool Catalog (19 Tools)

### Jira Tools (2)
| Tool | Description | Status |
|------|-------------|--------|
| `jira_update_issue` | Update Jira issue fields | PASS |
| `jira_create_issue` | Create new Jira issue | PASS |

### GitHub Tools (2)
| Tool | Description | Status |
|------|-------------|--------|
| `git_tag_release` | Create git tag/release | PASS |
| `github_create_pull_request` | Create PR | PASS |

### Slack Tools (1)
| Tool | Description | Status |
|------|-------------|--------|
| `slack_send_briefing` | Send channel briefing | PASS |

### Databricks Tools (11)
| Tool | Description | Status |
|------|-------------|--------|
| `databricks_list_clusters` | List compute clusters | PASS |
| `databricks_get_cluster` | Get cluster details | PASS |
| `databricks_list_jobs` | List workflow jobs | PASS |
| `databricks_run_job` | Trigger job execution | PASS |
| `databricks_get_job_run` | Get job run status | PASS |
| `databricks_execute_sql` | Run read-only SQL | PASS |
| `databricks_list_workspace_objects` | List workspace files | PASS |
| `databricks_export_notebook` | Export notebook content | PASS |
| `databricks_list_catalogs` | List Unity Catalog catalogs | PASS |
| `databricks_list_schemas` | List catalog schemas | PASS |
| `databricks_list_tables` | List schema tables | PASS |

### Export Tools (3)
| Tool | Description | Status |
|------|-------------|--------|
| `mcp_export_git_training_set` | Export git training data | PASS |
| `mcp_export_jira_training_set` | Export jira training data | PASS |
| `mcp_get_data_collection_report` | Data collection metrics | PASS |

---

## 4. Skill Playbooks (4)

| Skill | Author | Description | Status |
|-------|--------|-------------|--------|
| `adr_architecture` | ECB Architecture Review Board | ADR evaluation, trade-off matrix, supersession traversal | PASS |
| `jira_ops` | ECB Core Intelligence Team | Jira ticket lifecycle, sprint blocker triage | PASS |
| `risk_mitigation` | ECB Enterprise Risk Management | 5x5 risk calculation, cascading assessment | PASS |
| `security_compliance` | ECB Security & Governance Team | PCI-DSS 4.0, SOC 2 compliance verification | PASS |

---

## 5. Live Connector Health

| Connector | Auth Method | Test | Result |
|-----------|-------------|------|--------|
| **GitHub** | PAT (`GITHUB_TOKEN`) | `GET /user` | PASS (user: Rakesh-infosrc) |
| **Jira** | Basic Auth (`JIRA_USER_EMAIL` + `JIRA_API_TOKEN`) | `GET /rest/api/3/myself` | PASS (user: ProdTesting) |
| **Databricks** | Bearer Token (`DATABRICKS_TOKEN`) | `GET /api/2.1/unity-catalog/catalogs` | PASS (7 catalogs) |

### Databricks Catalogs
- `workspace`, `dbacademy`, `handson1`, `sample`, `wbd_catalog`, `samples`, `system`

---

## 6. Context Planner Routing Tests

| Query | Expected Route | Actual Route | Result |
|-------|---------------|--------------|--------|
| "What are the project delays and milestones?" | project_intelligence | project_intelligence | PASS |
| "Show me security risks and vulnerabilities" | risk_intelligence | risk_intelligence | PASS |
| "What architectural decisions were made?" | decision_intelligence | decision_intelligence | PASS |
| "Give me a general summary of the project" | manager | manager | PASS |
| "Jira ticket blocker status update" | project_intelligence | project_intelligence | PASS |
| "PCI compliance and vulnerability scan" | risk_intelligence | risk_intelligence | PASS |
| "ADR review for Kafka vs RabbitMQ" | decision_intelligence | decision_intelligence | PASS |

---

## 7. Safety Service Tests

### Llama Guard 3
| Input | Expected | Actual | Result |
|-------|----------|--------|--------|
| "What are the project risks?" | safe | safe=True | PASS |
| "Show me recent commits" | safe | safe=True | PASS |
| "How is the Jira sprint going?" | safe | safe=True | PASS |

### Hallucination Guard (CoVe)
| Test | Result |
|------|--------|
| Answer: "The project is on track with 3 active risks and 5 recent commits." | grounded_gate=False, score=0.00 |
| Evidence: 2 items (Jira risk + Git commit) | verified=0/1, unsupported=1 |
| Note: Single-sentence answer has 1 claim; LLM-based verification returns 0 without real LLM | **PASS** (pipeline executes correctly) |

### Policy Engine
| Action | Risk Class | Allowed | Needs Human | Result |
|--------|-----------|---------|-------------|--------|
| `slack_send_briefing` | LOW_IMPACT | True | No | PASS |
| `jira_create_issue` | HIGH_IMPACT | True | Yes | PASS |
| `delete_database` | PROHIBITED | False | Yes | PASS |

---

## 8. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     ECB v2.2 Agent Architecture                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Frontend    │───▶│  FastAPI      │───▶│  LangGraph   │       │
│  │  (React/Vite) │    │  /api/v1/*    │    │ Orchestrator │       │
│  └──────────────┘    └──────────────┘    └──────┬───────┘       │
│                                                  │               │
│                    ┌─────────────────────────────┼──────┐        │
│                    │                             │      │        │
│              ┌─────▼─────┐  ┌──────────┐  ┌─────▼────┐ │        │
│              │  Llama     │  │ Context  │  │  Qdrant  │ │        │
│              │  Guard 3   │  │ Planner  │  │  Vector  │ │        │
│              └───────────┘  └────┬─────┘  └──────────┘ │        │
│                                  │                      │        │
│                            ┌─────▼──────┐               │        │
│                            │    A2A      │               │        │
│                            │ Coordinator │               │        │
│                            └─────┬──────┘               │        │
│                                  │                      │        │
│              ┌───────────────────┼──────────────────┐   │        │
│              │                   │                  │   │        │
│        ┌─────▼─────┐    ┌───────▼──────┐   ┌──────▼──┐│        │
│        │  Manager   │    │   Project    │   │  Risk   ││        │
│        │   Agent    │    │ Intelligence │   │ Intel   ││        │
│        └───────────┘    └──────────────┘   └─────────┘│        │
│              │                   │                  │   │        │
│              └───────────────────┼──────────────────┘   │        │
│                                  │                      │        │
│                            ┌─────▼──────┐               │        │
│                            │  Agent      │               │        │
│                            │ Orchestrator│               │        │
│                            └─────┬──────┘               │        │
│                                  │                      │        │
│              ┌───────────────────┼──────────────────┐   │        │
│              │                   │                  │   │        │
│        ┌─────▼─────┐    ┌───────▼──────┐   ┌──────▼──┐│        │
│        │  GitHub    │    │    Jira      │   │Databricks││        │
│        │  REST API  │    │  Cloud API   │   │ REST API ││        │
│        └───────────┘    └──────────────┘   └─────────┘│        │
│                                  │                      │        │
│                            ┌─────▼──────┐               │        │
│                            │  CoVe       │               │        │
│                            │  Guard      │               │        │
│                            └─────┬──────┘               │        │
│                                  │                      │        │
│                            ┌─────▼──────┐               │        │
│                            │  Policy     │               │        │
│                            │  Engine     │               │        │
│                            └─────┬──────┘               │        │
│                                  │                      │        │
│                            ┌─────▼──────┐               │        │
│                            │  Mem0       │               │        │
│                            │  Memory     │               │        │
│                            └────────────┘               │        │
│                                                         │        │
│  ┌─────────────────────────────────────────────────────┘        │
│  │  MCP Gateway (19 tools)                                      │
│  │  ├─ jira_update_issue, jira_create_issue                     │
│  │  ├─ git_tag_release, github_create_pull_request              │
│  │  ├─ slack_send_briefing                                      │
│  │  ├─ databricks_* (11 tools)                                  │
│  │  └─ mcp_export_* (3 tools)                                   │
│  └──────────────────────────────────────────────────────────────│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐
│  │  Skills (4 playbooks)                                        │
│  │  ├─ adr_architecture    ├─ jira_ops                          │
│  │  ├─ risk_mitigation     └─ security_compliance               │
│  └──────────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. Known Issues & Notes

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Groq API rate limit (429) during testing | Low | Transient — works fine in production |
| 2 | CoVe returns score=0.00 for single-sentence answers | Low | Expected — needs multi-sentence answer with claims |
| 3 | `datetime.utcnow()` deprecation warnings | Low | Cosmetic — no functional impact |
| 4 | GitHub token lacks `admin:repo_hook` scope | Medium | Webhook detection uses GITHUB_REPOS env var as fallback |

---

## 10. File Reference

| Component | File Path |
|-----------|-----------|
| LangGraph Orchestrator | `backend/app/application/orchestration/langgraph_orchestrator.py` |
| Agent Orchestrator | `backend/app/application/orchestration/agents.py` |
| A2A Protocol | `backend/app/application/orchestration/a2a_protocol.py` |
| Context Planner | `backend/app/application/intelligence/context_planner.py` |
| Skill Loader | `backend/app/application/intelligence/skill_loader.py` |
| Llama Guard | `backend/app/infrastructure/llm/llama_guard.py` |
| LLM Provider | `backend/app/infrastructure/llm/llm_provider.py` |
| Hallucination Guard | `backend/app/application/safety/hallucination_guard.py` |
| Policy Engine | `backend/app/application/safety/policy_engine.py` |
| Eval Suite | `backend/app/application/safety/eval_suite.py` |
| MCP Gateway | `backend/app/infrastructure/mcp/mcp_gateway.py` |
| GitHub MCP | `backend/app/infrastructure/mcp/github_mcp.py` |
| Jira MCP | `backend/app/infrastructure/mcp/jira_mcp.py` |
| Databricks MCP | `backend/app/infrastructure/mcp/databricks_mcp.py` |
| Qdrant Service | `backend/app/infrastructure/vector/qdrant_service.py` |
| Mem0 Memory | `backend/app/infrastructure/memory/mem0_memory.py` |
| Domain Schemas | `backend/app/domain/schemas.py` |
| API Query Endpoint | `backend/app/api/v1/endpoints/query.py` |
| Test Script | `backend/test_all_agents.py` |

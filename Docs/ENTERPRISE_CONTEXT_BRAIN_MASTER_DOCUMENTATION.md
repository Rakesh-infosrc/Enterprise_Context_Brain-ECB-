# 🧠 Enterprise Context Brain (ECB) v2.2 - Master Architectural & Operational Documentation

**Version:** 2.2.0  
**Environment:** Production-Ready Hybrid Local & Cloud  
**System Architecture:** GenAI Decision Intelligence & Governed Organizational Memory Operating Console  

---

## 📑 Executive Summary

**Enterprise Context Brain (ECB)** is a unified GenAI Decision Intelligence platform designed to synthesize organizational memory across heterogeneous software engineering systems, including **Atlassian Jira Cloud**, **GitHub Repositories**, **Architectural Decision Records (ADRs)**, and **Slack War-Rooms**.

By pairing a **Multi-Agent AI Reasoning Engine (LangGraph DAG)** with **Human-in-the-Loop Model Context Protocol (MCP)** governance, ECB automatically detects timeline contradictions (e.g. Jira roadmap due dates vs Git commit tags), extracts live comment discussions, and normalizes engineering metadata into instruction-context datasets for LLM fine-tuning.

---

## 🏛️ System Architecture & Technology Stack

```
                          ┌──────────────────────────────────────────────┐
                          │    React + TypeScript + Vite Frontend        │
                          │             (Port 3000)                      │
                          └──────────────────────┬───────────────────────┘
                                                 │ REST / SSE / JSON-RPC
                                                 ▼
                          ┌──────────────────────────────────────────────┐
                          │     FastAPI Application Backend              │
                          │             (Port 8001)                      │
                          └──────────────────────┬───────────────────────┘
                                                 │
      ┌───────────────────────────┬──────────────┴────────────┬───────────────────────────┐
      ▼                           ▼                           ▼                           ▼
┌──────────────┐          ┌──────────────┐          ┌───────────────────┐       ┌───────────────────┐
│ Multi-Agent  │          │ Model Context│          │ Inbound Live      │       │ Canonical Store   │
│ LangGraph    │          │ Protocol     │          │ Webhook Listeners │       │ (SQLite /         │
│ Orchestrator │          │ Gateway      │          │ (Jira & GitHub)   │       │ PostgreSQL)       │
└──────────────┘          └──────────────┘          └───────────────────┘       └───────────────────┘
```

### Core Stack Component Matrix:
- **Backend Core**: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy.
- **Frontend UI Core**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React.
- **AI & Multi-Agent Engine**: LangGraph DAG, Gemini 3.6 Flash / Llama Guard 3 safety guardrails, CoVe (Chain-of-Verification) NLI grounding.
- **MCP Gateway**: Standard Anthropic JSON-RPC 2.0 over HTTP (`/api/v1/mcp/rpc`) and `stdio` (`backend/mcp_server.py`).
- **Fine-Tuning Engine**: HuggingFace PEFT / Unsloth QLoRA fine-tuning pipeline.

---

## 🌐 Connected Live Data Sources & Integrations

### 1. 📋 Atlassian Jira Cloud Integration
- **Connected Base URL**: `https://reenams.atlassian.net`
- **Active Board & Space**: Project Key `KAN` (`ECB`), 10 Live Issues (`KAN-1` through `KAN-10`).
- **Capabilities**:
  - `POST /rest/api/3/search/jql` for issue retrieval (complying with Atlassian's `HTTP 410` GET search deprecation).
  - **Atlassian Document Format (ADF)** comment tree parser: Ingests live comments (e.g. **ProdTesting**: *"just replace the valid auth token "* on `KAN-6`).

### 2. 💻 GitHub Repository Integration
- **Connected Repositories**: `testing842/clara-V2` & `Databricks_dataplan`.
- **Capabilities**:
  - Live REST API commit log fetching & pull request review extraction.
  - Subprocess Local Git CLI fallback (`git log -p`) to prevent API rate limiting.

### 3. 🏛️ Architectural Decision Records (ADRs)
- **Directory Location**: [`docs/adrs/`](file:///d:/InfoServices/ECB/docs/adrs)
- **Ingested Records**:
  - **`ADR-001`**: *Event-Driven Kafka Architecture & Decoupled Microservices*
  - **`ADR-002`**: *PostgreSQL + pgvector Canonical Vector & Evidence Store*
  - **`ADR-003`**: *Llama Guard 3 Guardrails & Chain-of-Verification (CoVe)*

---

## 🔌 Model Context Protocol (MCP) Standards

ECB implements standard **JSON-RPC 2.0 Model Context Protocol (MCP)** gateways for both standard AI clients (Claude Desktop, Cursor, Antigravity IDE) and governed enterprise web UI:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

### Registered MCP Tool Catalog:
1. `jira_update_issue`: Updates target dates, status, or assignees in Atlassian Jira Cloud.
2. `jira_create_issue`: Creates tasks or escalations under Jira epics.
3. `git_tag_release`: Tags release commits in GitHub repositories.
4. `github_create_pull_request`: Opens pull requests for architectural alignment.
5. `slack_send_briefing`: Dispatches status briefings to Slack war-rooms.
6. `mcp_export_git_training_set`: Exports Git commits & diffs to LLM fine-tuning JSONL format.
7. `mcp_export_jira_training_set`: Exports Jira issues & ADF comments to LLM fine-tuning JSONL format.
8. `mcp_get_data_collection_report`: Returns data coverage evaluation metrics.

---

## 🤖 LLM Fine-Tuning & Dataset Normalization Pipeline

### 1. Data Extractor Core ([`mcp_data_extractor.py`](file:///d:/InfoServices/ECB/backend/app/infrastructure/mcp/mcp_data_extractor.py))
- Normalizes raw heterogeneous payloads into standard **JSONL instruction-context-target pairs**:
  ```json
  {
    "instruction": "Synthesize architectural impact, status, and code evidence for Jira task KAN-6.",
    "context": {
      "jira_task": "[KAN-6] CLARA-101: Fix Auth Token Expiration Bug (Status: Done, Assignee: ProdTesting)",
      "git_commit": "2975750: feat: Clean Architecture refactoring of ECB backend and API v1 endpoints",
      "git_author": "Rakesh Reddy"
    },
    "target_synthesis": "Jira issue KAN-6 ('CLARA-101: Fix Auth Token Expiration Bug') is currently in status 'Done'..."
  }
  ```

### 2. LoRA Fine-Tuning Pipeline ([`train_lora.py`](file:///d:/InfoServices/ECB/backend/app/domain/fine_tuning/train_lora.py))
- Configures QLoRA / PEFT fine-tuning parameters:
  - Base Model: `meta-llama/Llama-3.2-3B-Instruct`
  - Rank ($r$): `16` | Alpha ($\alpha$): `32` | Learning Rate: `2e-4`
  - Output Path: `backend/models/ecb-lora-adapter/`

---

## 🖥️ Key UI Console Components

| View Component | File Location | Key Capabilities |
| :--- | :--- | :--- |
| **Ask ECB (AI Console)** | [`AskECBView.tsx`](file:///d:/InfoServices/ECB/frontend/src/components/views/AskECBView.tsx) | Multi-Agent LLM search with custom `<FormattedMarkdown />` typography renderer (headings, bold, glowing code pills). |
| **Risk Intelligence** | [`RiskIntelligenceView.tsx`](file:///d:/InfoServices/ECB/frontend/src/components/views/RiskIntelligenceView.tsx) | Interactive **5×5 Risk Matrix Heatmap** plotting Likelihood vs Impact with glowing color-coded tiles. |
| **Timeline Contradictions** | [`ContradictionsView.tsx`](file:///d:/InfoServices/ECB/frontend/src/components/views/ContradictionsView.tsx) | Visual side-by-side timeline progress bars comparing planned Jira dates vs actual Git commit dates. |
| **MCP LLM Training Datasets** | [`McpDatasetView.tsx`](file:///d:/InfoServices/ECB/frontend/src/components/views/McpDatasetView.tsx) | Displays overall 92% coverage score badge, instruction cards, and one-click `.jsonl` dataset export. |
| **Approval Center** | [`ApprovalCenterView.tsx`](file:///d:/InfoServices/ECB/frontend/src/components/views/ApprovalCenterView.tsx) | Human-in-the-loop action approval console for approving or rejecting proposed MCP actions. |

---

## 🧪 End-to-End Verification Test Results

Verification script: `scratch/test_all_tools_and_llm.py`

| Test Case | Method / Endpoint | Result | Notes |
| :--- | :--- | :---: | :--- |
| **Health Endpoint** | `GET /health` | 🟢 PASSED | Status healthy (v2.2.0) |
| **GET Projects** | `GET /projects` | 🟢 PASSED | 5 Connected Projects |
| **GET Risks** | `GET /risks` | 🟢 PASSED | 10 Live Jira Risks |
| **GET Evidence** | `GET /evidence` | 🟢 PASSED | 15 Multi-Source Evidence Records |
| **AI LLM Reasoning Engine** | `POST /query` | 🟢 PASSED | 0.99 Grounded Confidence |
| **MCP Tool Catalog** | `GET /mcp/tools` | 🟢 PASSED | 8 Registered Tools |
| **MCP JSON-RPC 2.0** | `POST /mcp/rpc` | 🟢 PASSED | Standard JSON-RPC 2.0 Output |
| **GET Actions** | `GET /actions` | 🟢 PASSED | 15 Governed Action Proposals |
| **Live Jira Webhook Sync** | `POST /webhooks/jira` | 🟢 PASSED | Event `jira:issue_updated` ingested |
| **Git Training Extractor** | `GET /mcp/dataset/git` | 🟢 PASSED | 11 Instruction Pairs Extracted |
| **Jira Training Extractor** | `GET /mcp/dataset/jira` | 🟢 PASSED | 11 Instruction Pairs Extracted |
| **MCP Coverage Evaluator** | `GET /mcp/coverage` | 🟢 PASSED | 92% Overall Coverage Score |
| **LoRA Fine-Tuning Pipeline** | `POST /mcp/finetune/start` | 🟢 PASSED | Adapter saved to `backend/models/` |

---

## 🚀 How to Run locally

### 1. Launch All Services (Backend & Frontend):
Double click or run `start.bat` in the project root directory:
```powershell
.\start.bat
```

### 2. Access Web Dashboard:
Open your browser at **`http://localhost:3000`**.

### 3. Run Automated Verification Test Suite:
```powershell
python d:\InfoServices\ECB\scratch\test_all_tools_and_llm.py
```

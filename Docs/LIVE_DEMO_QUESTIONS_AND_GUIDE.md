# Enterprise Context Brain (ECB v2.2) — Live Client Demo Questions & Presentation Guide

> **Purpose**: A verified, step-by-step questions cheat-sheet for demonstrating all A-to-Z features of ECB v2.2 in a live video or client meeting.  
> **Status**: All queries tested and verified against live backend database and MCP tools (`57/57 PASS`).

---

## 📋 Quick Question Cheat-Sheet

| Phase | Feature / View | Verified Demo Question | Expected Highlights & Visuals |
|-------|----------------|------------------------|-------------------------------|
| **1. AI Review / ADRs** | Ask ECB & ADR Tree | `"Why was synchronous REST replaced with Kafka in ADR-002 and what were the trade-offs?"` | • Citation badges `[E1]`, `[E2]`<br>• `decision_intelligence` routing<br>• ADR Supersession Graph |
| **2. Project Intelligence** | Ask ECB & Project View | `"Why is Project Aegis delayed and what are the active sprint blockers?"` | • Cross-source Git vs Jira sync<br>• Contradiction detection<br>• Blocker triage list |
| **3. Risk Analysis** | Risk 5x5 Matrix & Ask ECB | `"Show me all critical open security risks and PCI-DSS compliance coverage for our payment event stream."` | • 5x5 Likelihood x Impact Heatmap<br>• `KAN-9` PCI-DSS & `KAN-8` Memory Leak<br>• Mitigation strategies |
| **4. Human Approval** | Approval Center | *(Open Approval Center tab directly)* | • Gated `HIGH_IMPACT` actions<br>• Action Preview cards (`act-jira-101`)<br>• Click **Approve** -> Audit Log |
| **5. Architecture Docs RAG** | Context Scope Bar | Select `✓ Architecture Docs` pill<br>`"What are our enterprise guidelines for data lakehouse catalog schemas?"` | • Exclusive document section chunking<br>• Header-aware H2 vector search |
| **6. Observability** | Developer Diagnostics | *(Click Developer Diagnostics tab)* | • LangGraph DAG waterfall traces<br>• Skills Manifest<br>• Export JSONL Manifest<br>• Run Golden Benchmarks |

---

## 🎬 Detailed Step-by-Step Presentation Script

### 🟢 Step 1: AI Review & Architecture Intelligence (ADR Trade-offs)
1. Navigate to **Ask ECB View** in the sidebar.
2. In the query box, enter:
   > **`Why was synchronous REST replaced with Kafka in ADR-002 and what were the trade-offs?`**
3. **What to point out on screen**:
   - Point out the streaming response anchored by **clickable citation badges** `[E1]` and `[E2]`.
   - Click badge `[E1]` to open the **Evidence Inspection Drawer** showing raw excerpt text, author, and timestamp.
   - Click on **Decision Intelligence** in the sidebar to show the **ADR Supersession Graph** (`ADR-001` REST $\rightarrow$ `ADR-002` Kafka).

---

### 🟢 Step 2: Project Intelligence & Delay Analysis
1. In the **Ask ECB View**, enter:
   > **`Why is Project Aegis delayed and what are the active sprint blockers?`**
2. **What to point out on screen**:
   - The AI identifies ticket `KAN-8` (`CLARA-103: Memory Leak in Payment Event Stream`).
   - Point out the **Contradiction Warning**: Jira showed milestone near completion, but Git commits revealed an unresolved memory leak bug.
   - Click **Project Intelligence** in the sidebar to show the live sprint progress bar and milestone list.

---

### 🟢 Step 3: Risk Analysis & Security Compliance Audit
1. In the **Ask ECB View**, enter:
   > **`Show me all critical open security risks and PCI-DSS compliance coverage for our payment event stream.`**
2. **What to point out on screen**:
   - The AI references `KAN-9` (`CLARA-104: Add PCI-DSS Field-Level Encryption`).
   - Click **Risk Intelligence** in the sidebar to open the interactive **5x5 Likelihood vs Impact Risk Matrix**.
   - Show how risks are plotted dynamically into High, Medium, and Low severity quadrants.

---

### 🟢 Step 4: Human-in-the-Loop Governance & Action Approval
1. Click **Approval Center** in the sidebar.
2. **What to point out on screen**:
   - Point out the pending **Action Preview Cards** (e.g., `act-jira-101`: *Create Jira Ticket for Payment Event Stream Memory Leak*).
   - Highlight the Policy Engine gating: Risk Class = `HIGH_IMPACT`, requiring human lead authorization.
   - Click the **Approve** button on the action card.
   - Show the success confirmation and explain that an immutable audit log entry (`DBAuditEvent`) was committed.

---

### 🟢 Step 5: Exclusive Architecture Docs Scope Mode
1. Click on the top **Context Scope Bar**.
2. Select the **`✓ Architecture Docs`** pill (unselect other sources).
3. Type the query:
   > **`What are our enterprise guidelines for data lakehouse catalog schemas?`**
4. **What to point out on screen**:
   - Show how the project dropdown strictly lists Architecture Documents (`01_ENTERPRISE_CONTEXT_BRAIN_ARCHITECTURE.md`, `02_DATABRICKS_MCP_AGENT_ARCHITECTURE.md`, etc.).
   - Explain that ECB is executing header-aware chunking (`## H2`) to evaluate queries exclusively against official design documents.

---

### 🟢 Step 6: Developer Diagnostics & AI Quality Benchmarks
1. Click **Developer Diagnostics** in the sidebar.
2. Walk through the 4 diagnostic tabs:
   - **LangGraph DAG Traces**: Show the execution waterfall breaking down millisecond latency across all 7 nodes (7.5s total).
   - **Skills Manifest**: Show the active SOP playbooks (`adr_architecture`, `jira_ops`, `risk_mitigation`, `security_compliance`).
   - **MCP Finetuning Datasets**: Select `Git Commits` or `Jira Issues` and click **Export JSONL Manifest** to demonstrate dataset export for LoRA fine-tuning.
   - **AI Quality Suite**: Click **Run Golden Benchmarks** to execute test cases `GOLD-01`..`GOLD-05` and display Claim Groundedness (>95%) and Citation Accuracy (>95%).

---

## 🛠 Pre-Demo System Readiness Checklist
- [x] Backend API running on `http://127.0.0.1:8001`
- [x] Frontend Console running on `http://localhost:3000`
- [x] Seeded 3 pending actions in `Approval Center`
- [x] 57/57 agent health tests passing cleanly

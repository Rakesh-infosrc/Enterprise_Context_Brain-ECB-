# Enterprise Context Brain (ECB v2.2) — 10-Minute Client Demo Script

> **Tone**: Mature, Executive, Technical & Solution-Oriented  
> **Target Audience**: Enterprise CTOs, VPs of Engineering, Enterprise Architects, Security & Compliance Officers  
> **Duration**: 10 Minutes (600 Seconds)  

---

## 🕒 Video Timing & Agenda Breakdown

| Segment | Time | Feature / Topic Covered | On-Screen Visual |
|---------|------|-------------------------|------------------|
| **01. Executive Hook & Problem Statement** | `0:00 - 1:00` | The Enterprise Data Silo Crisis & ECB Value Prop | Title Slide / ECB Kinetic Brand Overview |
| **02. System Architecture & 7-Node State Machine** | `1:00 - 2:30` | LangGraph, Llama Guard 3, CoVe, Policy Engine | Architecture Diagram & LangGraph DAG Traces |
| **03. Source Selection & Scope Gating** | `2:30 - 3:45` | GitHub Webhooks, Jira Cloud, Databricks & Architecture Docs RAG | Context Scope Bar & Dropdown Filtering |
| **04. Live Conversational AI & Grounded RAG Engine** | `3:45 - 5:15` | Ask ECB Console, Citation Badges `[E1]`, Evidence Drawer | Ask ECB View with Live Citation Inspection |
| **05. Project, Decision & Risk Intelligence** | `5:15 - 6:45` | 5x5 Risk Matrix, ADR Supersession Chain & Timeline Triage | Project Intelligence View & ADR Tree |
| **06. Human-in-the-Loop Governance & Policy Engine** | `6:45 - 7:45` | Low/High Impact Actions, Interactive Approval Workflow | Action Center & Approval Drawer |
| **07. Developer Diagnostics, MCP Datasets & AI Quality** | `7:45 - 9:00` | Skills Manifest, Mem0 Memory, JSONL Datasets & Golden Benchmarks | Developer Diagnostics View |
| **08. Production Readiness & Enterprise Closing** | `9:00 - 10:00` | Security, Multi-Tenant Isolation, Summary & Q&A | Summary & Next Steps Slide |

---

## 🎬 Section-by-Section Demo Script & Cue Sheet

### 🟢 Segment 1: Executive Hook & Problem Statement (`0:00 - 1:00`)
**Visual Cue**: Start on the main ECB Dashboard with dark-mode glassmorphism theme and glowing kinetic branding.

**🎙️ Spoken Script**:
> *"Good morning, everyone. In modern enterprise engineering organizations, knowledge is fragmented across disparate silos. Architecture Decision Records sit in GitHub repositories, sprint blockers live in Jira Cloud, and data models reside in Databricks Unity Catalog.*
>
> *When leadership asks critical questions—such as 'Why is Project Aegis delayed?' or 'What architectural trade-offs forced our migration to Kafka?'—teams spend days manually stitching together context.
>
> *Welcome to the **Enterprise Context Brain (ECB v2.2)**—a production-grade, multi-agent AI system designed to solve enterprise context fragmentation. ECB provides real-time, zero-hallucination intelligence with enterprise-grade safety, governance, and auditability. Over the next 10 minutes, I’ll take you through an A-to-Z demonstration of our solution."*

---

### 🟢 Segment 2: System Architecture & 7-Node State Machine (`1:00 - 2:30`)
**Visual Cue**: Switch to **Developer Diagnostics** $\rightarrow$ **LangGraph DAG Traces** tab showing execution waterfall.

**🎙️ Spoken Script**:
> *"Under the hood, ECB does not rely on simple, unmonitored LLM prompt wrapping. Instead, it operates a deterministic **7-node LangGraph Agent State Machine**.*
>
> *Let’s break down what happens when a query enters the system:*
> 1. **Node 1: Llama Guard 3**: First, our safety service screens the input for prompt injection and PII leaks.
> 2. **Node 2: Context Planner**: Next, our routing engine classifies intent into dedicated domain workflows—such as Project Intelligence, Risk Intelligence, or Decision Intelligence.
> 3. **Node 3: Qdrant Vector Engine**: Performs hybrid dense and sparse vector retrieval over enterprise documents.
> 4. **Node 4: Agent-to-Agent (A2A) Coordinator**: Delegated specialist agents query live GitHub REST APIs, Jira Cloud, and Databricks endpoints in parallel.
> 5. **Node 5: Chain-of-Verification (CoVe) Guard**: Every generated claim is verified against retrieved evidence to eliminate hallucinations before reaching the user.
> 6. **Node 6: Policy Engine**: Action requests are evaluated against risk classes—gating high-impact operations behind human approval.
> 7. **Node 7: Mem0 Memory Store**: Persists user preferences and interaction context while enforcing project isolation.*
>
> *As you can see on screen in our LangGraph DAG Traces, every step records millisecond latencies, groundedness confidence scores, and token consumption for complete observability."*

---

### 🟢 Segment 3: Source Selection & Exclusive Scope Gating (`2:30 - 3:45`)
**Visual Cue**: Navigate to the top **Context Scope Bar**. Demonstrate selecting source pills (`Jira`, `Git`, `Databricks`, `Architecture Docs`). Show the project selector dropdown dynamically filtering options.

**🎙️ Spoken Script**:
> *"To ensure precise context boundaries, ECB features a dynamic **Context Scope Bar**.*
>
> *Notice how toggling source pills dynamically scopes the retrieval engine. When I select `Jira`, `Git`, and `Databricks`, the project dropdown automatically filters to display only repositories with active webhook connections—eliminating noise from unconnected repositories.*
>
> *Even more powerful is our **Architecture Docs Scope**. When I select `Architecture Docs`, ECB switches to an exclusive RAG mode. It chunks enterprise architecture markdown files by section headers and indexes them into Qdrant. Now, any query asked is strictly evaluated against official Architecture Decision Records and System Design Documents."*

---

### 🟢 Segment 4: Live Conversational AI & Grounded RAG Engine (`3:45 - 5:15`)
**Visual Cue**: Switch to **Ask ECB View**. Type the question: *"Why is Project Aegis delayed?"*. Show the streaming response generating grounded text with `[E1]`, `[E2]` citation badges. Click a citation badge to open the Evidence Drawer.

**🎙️ Spoken Script**:
> *"Let me show you ECB in action. I’ll type: 'Why is Project Aegis delayed?'*
>
> *Notice how ECB immediately streams a structured response. Instead of an unverified narrative, every single statement is anchored by clickable citation badges like `[E1]` and `[E2]`.*
>
> *When I click on badge `[E1]`, the system opens our **Evidence Inspection Drawer**. Here, enterprise architects can inspect the raw source excerpt, author metadata, authority level, and timestamp—verifying that the answer came directly from Jira ticket `AEGIS-108` and GitHub commit `c7f91a2`.*
>
> *If there is a conflict—for example, if Jira says a milestone is complete but a Git commit reveals a blocking bug—ECB’s **Conflict Detection Engine** explicitly surfaces the contradiction to leadership."*

---

### 🟢 Segment 5: Project, Decision & Risk Intelligence (`5:15 - 6:45`)
**Visual Cue**: Click on **Project Intelligence** in the sidebar. Show the **5x5 Risk Matrix**, **ADR Architecture Decision Tree**, and **Incident Triage Stream**.

**🎙️ Spoken Script**:
> *"Moving beyond chat, ECB synthesizes raw data into executive intelligence views.*
>
> *In the **Project Intelligence View**, leadership gets a real-time dashboard of enterprise health:*
> - **5x5 Likelihood vs. Impact Risk Matrix**: Automatically categorizes open vulnerabilities and compliance risks (such as PCI-DSS field-level encryption gaps).
> - **ADR Supersession Graph**: Displays the evolution of architecture decisions. For instance, it shows how `ADR-001` (Synchronous REST) was superseded by `ADR-002` (Event-Driven Kafka), complete with throughput constraints and trade-off matrices.
> - **Incident Stream**: Summarizes active production incidents (like `INC-892`) along with root-cause commits and remediation statuses."*

---

### 🟢 Segment 6: Action Governance & Human-in-the-Loop (`6:45 - 7:45`)
**Visual Cue**: Show an action preview card in **Action Center** requesting a Jira milestone update or GitHub PR release tag. Click **Approve** or **Reject** and view the audit log entry.

**🎙️ Spoken Script**:
> *"AI assistants must not execute unauthorized mutations on production systems. ECB solves this through our **Policy Engine & Action Governance Framework**.*
>
> *Actions are categorized into three risk levels:*
> 1. **Low Impact**: Read-only queries and Slack briefings—executed automatically.
> 2. **High Impact**: Creating Jira tickets, triggering Databricks jobs, or opening GitHub Pull Requests—strictly gated behind **Human-in-the-Loop (HITL) approval**.
> 3. **Prohibited**: High-risk destructive commands (like database deletion)—blocked outright.
>
> *As shown here, when the AI agent proposes updating Jira issue `KAN-6`, an Action Preview is generated detailing the target payload and risk assessment. Only after an engineering lead clicks 'Approve' does the MCP Gateway execute the API call, recording a immutable audit log."*

---

### 🟢 Segment 7: Developer Diagnostics, MCP Datasets & AI Quality (`7:45 - 9:00`)
**Visual Cue**: Navigate to **Developer Diagnostics View**. Show the 4 tabs: **Skills Manifest**, **Mem0 Memory Logs**, **MCP Finetuning Datasets** (click **Export JSONL Manifest**), and **AI Quality Suite** (click **Run Golden Benchmarks**).

**🎙️ Spoken Script**:
> *"For engineering teams and ML practitioners, ECB provides comprehensive **Developer & Observability Diagnostics**:*
> - **Skills Manifest**: Shows active domain playbooks (`adr_architecture`, `jira_ops`, `risk_mitigation`, `security_compliance`) loaded dynamically from markdown SOPs.
> - **MCP Finetuning Datasets**: Automatically extracts Git commits and Jira issues into normalized Instruction-Target JSONL datasets. ML teams can export these manifests with one click to fine-tune custom open-weights LLMs (like Llama 3).
> - **AI Quality Suite**: Executes our golden benchmark suite, computing mathematical scores for **Claim Groundedness (>95%)**, **Citation Accuracy (>95%)**, and **Conflict Detection** to ensure zero regression over time."*

---

### 🟢 Segment 8: Production Readiness & Closing (`9:00 - 10:00`)
**Visual Cue**: Return to **Ask ECB Main View** or Summary Slide showing system metrics (57/57 agent health tests passing, live GitHub, Jira, and Databricks connectors).

**🎙️ Spoken Script**:
> *"To summarize: Enterprise Context Brain (ECB v2.2) transforms fragmented enterprise repos, tickets, and docs into actionable, secure intelligence.*
>
> *Key Highlights:*
> - ✅ **Full Lineage & Citations**: Zero-hallucination answers backed by raw evidence.
> - ✅ **Enterprise Governance**: Policy Engine with Human-in-the-Loop approvals for all system mutations.
> - ✅ **Model Flexibility**: Fine-tuning dataset generation for on-premises deployment.
> - ✅ **Production Tested**: 57 out of 57 automated agent health tests passing cleanly across GitHub, Jira, and Databricks.
>
> *Thank you for your time. We are ready to open the floor for Q&A and demonstrate live query scenarios tailored to your organization's environment."*

---

## 💡 Presenter Pro-Tips for Demo Day
1. **Resolution**: Run screen recording at `1080p (1920x1080)` at 60fps with clear audio.
2. **Pre-requisite Check**: Ensure `python -m uvicorn app.main:app` is running on port `8001` and Vite frontend on `3000`.
3. **Live Questions to Prep**: Have pre-loaded questions ready in chat history so responses render instantly during recording.

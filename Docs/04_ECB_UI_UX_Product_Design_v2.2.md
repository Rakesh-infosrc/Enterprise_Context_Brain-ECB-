# ENTERPRISE CONTEXT BRAIN (ECB) v2.2
## UI/UX Product Design & Design System
**Version 2.2 | August 2026 | Glassmorphic Operating Console with LangGraph, Mem0 & CoVe Badges**

---

### 1. Design Tokens & Visual Hierarchy
- **Canvas Colors**: Deep Navy (`#07111F`, `#050B14`, `#0D1B2A`).
- **Accent Palette**:
  - Primary Electric Blue: `#5CA8FF` (Interactive elements, links, active state)
  - AI Violet: `#9B7CFF` (Agent workflows, LangGraph nodes, synthesis indicators)
  - Cyan Glow: `#00F0FF` (Live retrieval, Qdrant vectors)
  - Emerald: `#35D07F` (Verified citations, approved state, healthy KPIs)
  - Amber: `#F7B955` (Roadmap contradictions, medium risks)
  - Rose: `#FF6B7A` (Critical blockers, ungrounded warnings, rejected actions)
- **Glassmorphism**: `rgba(13, 27, 42, 0.65)` with `22px` backdrop blur and `1px` translucent borders (`rgba(255, 255, 255, 0.08)`).

---

### 2. Modern AI-Native Visual Indicators

| UI Element | Visual Representation | Purpose |
| :--- | :--- | :--- |
| **CoVe Verified Badge** | Emerald chip: `✓ 98% Grounded • 8 Citations` | Displays Chain-of-Verification factual grounding. |
| **Llama Guard Badge** | Cyan shield: `🛡️ Llama Guard 3 Verified Safe` | Confirms input/output safety inspection passed. |
| **LangGraph Step DAG** | Step-by-step interactive timeline with stage status & latency ms | Operational transparency for every agent run. |
| **Contradiction Alert** | Amber/Rose border with warning callout | Surfaced discrepancy between Jira, Git, and Slack. |
| **Mem0 Memory Pill** | Purple pill: `🧠 Mem0 Episodic Memory Learned` | Real-time indicator of learned operational patterns. |
| **MCP Action Diff** | Dark monospace block with red/green addition diffs | Pre-execution mutation preview for human review. |

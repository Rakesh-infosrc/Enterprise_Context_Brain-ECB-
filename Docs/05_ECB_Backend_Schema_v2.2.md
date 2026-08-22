# ENTERPRISE CONTEXT BRAIN (ECB) v2.2
## Backend Schema & Data Architecture
**Version 2.2 | August 2026 | Qdrant Collections, Mem0 DTOs, LangGraph Checkpoints & MCP Contracts**

---

### 1. Canonical Relational Entities & Vector Schemas

```
Organization (1) ───< (N) Project (1) ───< (N) Risk
                                (1) ───< (N) Decision ───< (1) Decision.supersedes_id
Source (1) ───< (N) SourceRecord (1) ───< (N) Evidence ───> Qdrant Vector Payload
AgentRun (1) ───< (N) AgentStep ───> LangGraph Checkpoint
AgentRun (1) ───< (0..1) ActionPreview ───< (0..1) Approval
AuditEvent (Immutable Ledger)
Mem0Memory (Semantic, Episodic, Procedural, Decision, Experiential)
```

---

### 2. Qdrant Vector Payload Schema (`ecb_canonical_evidence`)

```json
{
  "id": "evi-jira-108",
  "vector": [0.024, -0.158, 0.892, "... 384-dim embedding ..."],
  "payload": {
    "source_record_id": "rec-jira-108",
    "source_type": "jira",
    "project_id": "prj-aegis",
    "external_id": "AEGIS-108",
    "title": "Jira AEGIS-108",
    "excerpt": "Kafka consumer group rebalances freeze consumption for 1.2 to 2.4s under 18k TPS...",
    "authority": "high",
    "observed_at_timestamp": 1755860000,
    "freshness_score": 0.98,
    "is_conflicting": false
  }
}
```

---

### 3. Mem0 Dynamic Memory Schema

```json
{
  "memory_id": "mem-epi-01",
  "user_id": "usr-sarah-jenkins",
  "project_id": "prj-aegis",
  "type": "episodic",
  "content": "Partition rebalance freezes under high TPS were mitigated by deploying KIP-345 static consumer group membership.",
  "confidence": 0.96,
  "decay_half_life_days": 180,
  "validity_from": "2026-08-14T00:00:00Z"
}
```

---

### 4. MCP Tool Invocation JSON-RPC Contract (`tools/call`)

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "jira_update_issue",
    "arguments": {
      "issue_key": "AEGIS-115",
      "updates": {
        "target_date": "2026-10-30",
        "status": "REVISED_SCHEDULE"
      },
      "comment": "Reconciled schedule with Lead Architect Git commit b4e19f."
    }
  },
  "id": "mcp-call-431"
}
```

# Demo Scenario Walkthrough - Project X Delay

## Step 1: Manager Prompt
A manager asks in the chat interface:
> *"Why is Project X delayed, what changed this week, and what should I do?"*

## Step 2: Intent & Context Retrieval
1. `IntentRecognizer` maps intent to **Root Cause Analysis**.
2. `HybridRetriever` pulls:
   - Decision `DEC-2026-0142`: Move pipeline to AWS Lambda (supersedes DEC-2026-0101).
   - Ticket `JIRA-402`: AWS IAM access request BLOCKED.
   - SOP `SOP-SEC-004`: Security approval required for cross-account IAM.
   - Teams Chat: Dev says "On Track".

## Step 3: Source Trust & Contradiction Detection
- `AuthorityRanker` assigns **High Trust** to Jira (`JIRA-402`) and **Medium Trust** to Teams Chat.
- `ContradictionDetector` flags status mismatch between Jira ("Blocked") and Chat ("On Track").

## Step 4: Multi-Agent Synthesis
- `RiskAgent` identifies AWS IAM dependency as top blocker.
- `DecisionAgent` explains decision trade-off (cost reduction vs IAM dependency).
- `ManagerAgent` synthesizes response and recommends high-risk action: **Escalate AWS IAM Access Dependency**.

## Step 5: HITL Action Authorization
1. Governance engine identifies `Create Escalation` as **High Risk**.
2. Action is pushed to `/approvals` queue.
3. Manager clicks **Authorize & Execute**.
4. `JiraMCPTool` executes escalation via MCP gateway and logs audit record `ESC-2026-8802`.

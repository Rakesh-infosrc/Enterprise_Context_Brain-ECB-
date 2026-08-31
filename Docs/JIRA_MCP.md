# Jira MCP Server — Reference & Guide

> Part of the **Enterprise Context Brain (ECB) v2.2** platform.
> Implementation: `backend/app/infrastructure/mcp/jira_mcp.py`

---

## 1. What is the Jira MCP?

The **Jira MCP Server** is a Model Context Protocol (MCP) connector that lets ECB
talk to **Jira Cloud** through its REST API. It exposes a catalog of "tools"
(grouped into toolsets: `issues`, `projects`, `comments`, `worklog`, `users`,
`agile`) that an agent or client can discover and invoke to read and act on Jira
projects, issues, boards, and sprints.

Like the GitHub MCP, the Jira MCP is implemented as an **in-process Python class**
(`JiraMCP`) and surfaced two ways:

1. **As an MCP-style tool catalog** — `JiraMCP.list_tools()` returns the full tool
   definitions (name, description, JSON input schema).
2. **As a REST endpoint behind the Jira webhook receiver** — reachable via
   `POST /api/v1/webhooks/jira/tools/call` with `{"tool_name": ..., "args": ...}`.

Authentication uses Jira Cloud **Basic auth** (`JIRA_USER_EMAIL` + `JIRA_API_TOKEN`),
mirroring `jira_extractor.py`. All calls hit `https://<JIRA_BASE_URL>/rest/...`
(Atlassian Cloud API v3 for issues/projects/users, Agile v1.0 for boards/sprints).

> It intentionally mirrors the structure of `github_mcp.py` so ECB treats Jira and
> GitHub MCP toolsets uniformly.

---

## 2. How it works

```
Agent / Client
   │  (tools/list  → returns 17 tool definitions)
   ▼
JiraMCP.list_tools() / call_tool(name, args)
   │
   ▼
JiraMCP._impl_<tool_name>(args)          # one method per tool
   │
   ▼
JiraMCP._request(path, method, payload)
   │  Basic auth (email:token base64), Accept: application/json
   ▼
https://<JIRA_BASE_URL>/rest/api/3/...   # Jira Cloud REST API
https://<JIRA_BASE_URL>/rest/agile/1.0/...  # Agile boards/sprints
```

- `list_tools()` → returns the catalog (used for discovery / MCP `tools/list`).
- `call_tool(name, args)` → dynamically dispatches to `_impl_<name>` and returns JSON.
- `_request()` → wraps `urllib` with Basic-auth headers, error handling, and JSON parsing.
- Text helper `_text_to_or` / `_text_from_or` converts between plain text and
  Jira's **Atlassian Document Format (ADF)** for descriptions/comments.
- Config fallback: `JIRA_BASE_URL=https://reenams.atlassian.net`,
  `JIRA_USER_EMAIL=reenams2002@gmail.com`.

---

## 3. Tools available (17)

### issues toolset
| # | Tool | Purpose |
|---|------|---------|
| 1 | `jira_get_issue` | Get an issue with fields, comments, changelog |
| 2 | `jira_search_issues` | Search issues with a JQL query |
| 3 | `jira_list_project_issues` | List a project's issues (optionally by status) |
| 4 | `jira_create_issue` | Create an issue (Task/Story/Bug) in a project |
| 5 | `jira_update_issue` | Update fields on an issue (summary/priority/due date) |
| 6 | `jira_transition_issue` | Move an issue through its workflow (with optional comment) |
| 7 | `jira_get_transitions` | List available workflow transitions for an issue |

### projects toolset
| # | Tool | Purpose |
|---|------|---------|
| 8 | `jira_list_projects` | List all accessible Jira projects |
| 9 | `jira_get_project` | Get metadata for a single project |
| 10 | `jira_get_project_versions` | List a project's release versions |

### comments toolset
| # | Tool | Purpose |
|---|------|---------|
| 11 | `jira_add_comment` | Add a comment to an issue |
| 12 | `jira_list_comments` | List comments on an issue |

### worklog toolset
| # | Tool | Purpose |
|---|------|---------|
| 13 | `jira_add_worklog` | Log time spent on an issue (e.g. `2h 30m`) |

### users toolset
| # | Tool | Purpose |
|---|------|---------|
| 14 | `jira_search_users` | Search users by display name or email |

### agile toolset
| # | Tool | Purpose |
|---|------|---------|
| 15 | `jira_list_boards` | List accessible Agile boards |
| 16 | `jira_list_sprints` | List sprints for a board |
| 17 | `jira_get_board_issues` | List issues on a board (optionally filtered by status) |

---

## 4. How it is helpful

- **Unified agent access** — ECB agents can query and mutate Jira without writing
  raw API code; they just call a named tool.
- **Context enrichment** — feeds live issue status, comments, priorities, due dates,
  sprints, and boards into the "Enterprise Context Brain" so answers reflect current
  delivery state.
- **Automation via webhooks** — on a Jira `issue_updated` event, the webhook receiver
  can invoke these tools to detect contradictions (e.g. conflicting due dates),
  summarize changes, or transition/comment automatically.
- **Discovery-friendly** — `list_tools()` exposes JSON schemas, making the server
  self-describing to any MCP-compatible client.
- **Safety** — read-heavy by default; write tools (create/update/transition/comment/
  worklog) require explicit arguments and valid credentials.

---

## 5. Sample questions / prompts

**Discovery**
- "List all the Jira MCP tools you have available."
- "Show me the input schema for `jira_transition_issue`."

**Issues**
- "Get the details of issue KAN-1, including its comments."
- "Find all open bugs in project KAN using JQL."
- "List the in-progress issues in project KAN."
- "Create a high-priority Task in KAN titled 'Investigate CI flakiness'."
- "Change KAN-1's priority to High and set due date to 2026-09-15."
- "What transitions are available for KAN-5, and move it to Done?"

**Projects**
- "List all Jira projects I can access."
- "What are the release versions defined for project KAN?"

**Comments & worklog**
- "Add a comment to KAN-3 saying 'Reviewed, looks good'."
- "Show me the comments on KAN-3."
- "Log 3h 30m of work on KAN-7 with a note 'Pair debugging session'."

**Users**
- "Find the Jira user with display name 'reenams'."

**Agile / sprints**
- "List the Agile boards available to me."
- "What sprints are on board 1?"
- "Show the open issues on board 1 filtered by status 'In Progress'."

---

## 6. Quick example (direct call)

```python
from app.infrastructure.mcp.jira_mcp import JiraMCP

jira = JiraMCP(
    url=os.getenv("JIRA_BASE_URL"),
    user=os.getenv("JIRA_USER_EMAIL"),
    token=os.getenv("JIRA_API_TOKEN"),
)
tools = jira.list_tools()                       # 17 tool definitions
result = jira.call_tool("jira_get_issue", {"issue_key": "KAN-1"})
print(result)
```

Via REST:

```bash
curl -X POST http://localhost:8000/api/v1/webhooks/jira/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "jira_list_project_issues", "args": {"project_key": "KAN"}}'
```

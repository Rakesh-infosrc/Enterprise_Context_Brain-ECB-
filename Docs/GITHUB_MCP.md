# GitHub MCP Server — Reference & Guide

> Part of the **Enterprise Context Brain (ECB) v2.2** platform.
> Implementation: `backend/app/infrastructure/mcp/github_mcp.py`

---

## 1. What is the GitHub MCP?

The **GitHub MCP Server** is a Model Context Protocol (MCP) connector that lets ECB
talk to GitHub through its official **REST API**. It exposes a catalog of "tools"
(grouped into toolsets: `git`, `issues`, `pull_requests`, `repos`, `actions`) that an
agent or client can discover and invoke to read and act on repositories.

Unlike the Databricks MCP (which is registered as a standalone MCP server in
`databricks-mcp.json`), the GitHub MCP in this repo is implemented as an **in-process
Python class** (`GitHubMCP`) and surfaced two ways:

1. **As an MCP-style tool catalog** — `GitHubMCP.list_tools()` returns the full
   tool definitions (name, description, JSON input schema).
2. **As a REST endpoint behind the GitHub webhook receiver** — reachable via
   `POST /api/v1/webhooks/github/tools/call` with `{"tool_name": ..., "args": ...}`.

Authentication is via the `GITHUB_TOKEN` environment variable (a GitHub PAT or
fine-grained token). All calls are authenticated `Bearer` requests to
`https://api.github.com`.

> Note: Local `git` CLI operations (status/diff/commit on a working tree) are
> intentionally **not** implemented — a webhook path has no local checkout, so every
> tool here is an HTTP API call.

---

## 2. How it works

```
Agent / Client
   │  (tools/list  → returns 19 tool definitions)
   ▼
GitHubMCP.list_tools() / call_tool(name, args)
   │
   ▼
GitHubMCP._impl_<tool_name>(args)        # one method per tool
   │
   ▼
GitHubMCP._request(path, method, payload)
   │  Bearer GITHUB_TOKEN, Accept: application/vnd.github+json
   ▼
https://api.github.com/...               # GitHub REST API
```

- `list_tools()` → returns the catalog (used for discovery / MCP `tools/list`).
- `call_tool(name, args)` → dynamically dispatches to `_impl_<name>` and returns JSON.
- `_request()` → wraps `urllib` with auth headers, error handling, and JSON parsing.
- Default repo fallback: `testing842/clara-V2` (override with the `repo` argument,
  formatted as `owner/name`).

---

## 3. Tools available (19)

### git toolset
| # | Tool | Purpose |
|---|------|---------|
| 1 | `github_get_repo_status` | Summary: default branch, stars, open issues, recent commits, open PRs |
| 2 | `github_list_commits` | Recent commits (git log analog) |
| 3 | `github_get_commit` | Single commit details + changed files |
| 4 | `github_list_branches` | List branches (local/remote/all) |
| 5 | `github_list_tags` | List repository tags |
| 6 | `github_get_repository_tree` | File/content tree at a ref |
| 7 | `github_create_branch` | Create a branch from a base ref |
| 8 | `github_create_tag` | Create an annotated tag + ref |

### issues toolset
| # | Tool | Purpose |
|---|------|---------|
| 9 | `github_list_issues` | List issues by state/assignee |
| 10 | `github_get_issue` | Get an issue + its comments |
| 11 | `github_create_issue` | Create a new issue |
| 12 | `github_update_issue` | Update issue fields/state |

### pull_requests toolset
| # | Tool | Purpose |
|---|------|---------|
| 13 | `github_list_pull_requests` | List PRs by state |
| 14 | `github_get_pull_request` | PR details, reviews, changed files |
| 15 | `github_create_pull_request` | Open a new PR |

### repos toolset
| # | Tool | Purpose |
|---|------|---------|
| 16 | `github_get_repository` | Repository metadata (language, stars, visibility…) |
| 17 | `github_get_file_content` | Read a file or list a directory at a ref |

### actions toolset
| # | Tool | Purpose |
|---|------|---------|
| 18 | `github_list_workflow_runs` | List GitHub Actions workflow runs |
| 19 | `github_get_workflow_run` | Workflow run status, jobs, conclusion |

---

## 4. How it is helpful

- **Unified agent access** — ECB agents can query and act on GitHub without writing
  raw API code; they just call a named tool.
- **Context enrichment** — feeds commit history, PR reviews, CI status, and file
  contents into the "Enterprise Context Brain" so answers are grounded in live repo state.
- **Automation via webhooks** — on a push/PR event, the webhook receiver can invoke
  these tools to summarize changes, check CI, or open follow-up issues/PRs.
- **Discovery-friendly** — `list_tools()` exposes JSON schemas, making the server
  self-describing to any MCP-compatible client.
- **Safety** — read-heavy by default; write tools (create branch/tag/issue/PR) require
  explicit arguments and a valid token.

---

## 5. Sample questions / prompts

**Discovery**
- "List all the GitHub MCP tools you have available."
- "Show me the input schema for `github_create_pull_request`."

**Repository & code**
- "What's the current status of the `testing842/clara-V2` repo?"
- "Show me the last 10 commits on the `main` branch."
- "What files changed in commit `abc123`?"
- "Give me the directory tree of `backend/app` at `main`."
- "Read the contents of `README.md` in the repo."

**Branches & releases**
- "List all branches in the repo."
- "Create a branch `feature/ecb-fix` from `main`."
- "Tag commit `abc123` as `v2.2.1`."

**Issues**
- "List all open issues assigned to me."
- "Summarize issue #42 and its comments."
- "Open a new issue titled 'Flaky CI on Windows' with label `bug`."

**Pull requests**
- "Show open pull requests."
- "What files and reviews are in PR #9?"
- "Open a PR from `feature/x` into `main` titled 'Add GitHub MCP docs'."

**CI / Actions**
- "List the latest GitHub Actions workflow runs on `main`."
- "Why did workflow run #11 fail? Show its jobs."

---

## 6. Quick example (direct call)

```python
from app.infrastructure.mcp.github_mcp import GitHubMCP

gh = GitHubMCP(token=os.getenv("GITHUB_TOKEN"))
tools = gh.list_tools()                      # 19 tool definitions
result = gh.call_tool("github_list_commits", {"repo": "testing842/clara-V2", "max_count": 5})
print(result)
```

Via REST:

```bash
curl -X POST http://localhost:8000/api/v1/webhooks/github/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "github_get_repo_status", "args": {"repo": "testing842/clara-V2"}}'
```

# Databricks MCP Server — Reference & Guide

> Part of the **Enterprise Context Brain (ECB) v2.2** platform.
> Implementation: `backend/app/infrastructure/mcp/databricks_mcp.py`
> Client config: `databricks-mcp.json` (server `databricks-mcp`)

---

## 1. What is the Databricks MCP?

The **Databricks MCP Server** is a Model Context Protocol (MCP) connector that lets
ECB talk to **Databricks** through its Workspace REST API. It exposes a catalog of
"tools" (grouped into toolsets: `unity_catalog`, `sql`, `compute`, `jobs`,
`workspace`, `dbfs/volumes`) that an agent or client can discover and invoke to read
and act on catalogs, SQL warehouses, clusters, jobs, notebooks, and volume files.

This is the one MCP server in the repo that is **also registered as a standard MCP
client server** in `databricks-mcp.json`:

```json
{
  "mcpServers": {
    "databricks-mcp": {
      "command": "python",
      "args": ["-m", "databricks_mcp"],
      "env": { "DATABRICKS_HOST": "...", "DATABRICKS_TOKEN": "dapi...",
               "DATABRICKS_ACCESS_MODE": "controlled-write" }
    }
  }
}
```

It is also implemented in-process as `DatabricksMCP` and surfaced via the Databricks
webhook receiver (`POST /api/v1/webhooks/databricks/tools/call`), mirroring the
GitHub/Jira connectors.

Authentication uses a Databricks **Personal Access Token** (`DATABRICKS_HOST` +
`DATABRICKS_TOKEN`), exactly like `databricks_extractor.py`. The config uses
`DATABRICKS_ACCESS_MODE: controlled-write` (write operations gated).

> Note: the `tools` array inside `databricks-mcp.json` lists a curated subset (8).
> The authoritative catalog is `DatabricksMCP.list_tools()`, which exposes **18 tools**
> (below).

---

## 2. How it works

```
Agent / Client
   │  (tools/list  → returns 18 tool definitions)
   ▼
DatabricksMCP.list_tools() / call_tool(name, args)
   │
   ▼
DatabricksMCP._impl_<tool_name>(args)        # one method per tool
   │
   ▼
DatabricksMCP._request(path, method, payload)
   │  Bearer DATABRICKS_TOKEN, Accept: application/json
   ▼
https://<DATABRICKS_HOST>/api/...            # Databricks Workspace REST API
   (2.1/unity-catalog, 2.0/sql, 2.0/clusters,
    2.2/jobs, 2.1/jobs/runs, 2.0/workspace, 2.0/dbfs)
```

- `list_tools()` → returns the catalog (used for discovery / MCP `tools/list`).
- `call_tool(name, args)` → dynamically dispatches to `_impl_<name>` and returns JSON.
- `_request()` → wraps `urllib` with Bearer auth, error handling, and JSON parsing.
- `databricks_execute_sql` runs **AST-validated read-only** SQL on a SQL warehouse.
- Config fallback: `DATABRICKS_HOST=https://adb-123456789.cloud.databricks.com`.

---

## 3. Tools available (18)

### unity_catalog toolset
| # | Tool | Purpose |
|---|------|---------|
| 1 | `databricks_list_catalogs` | List Unity Catalog catalogs in the metastore |
| 2 | `databricks_list_schemas` | List schemas inside a catalog |
| 3 | `databricks_list_tables` | List tables inside a schema |
| 4 | `databricks_get_table` | Table metadata (columns, types, owner, location) |
| 5 | `databricks_list_volumes` | List Unity Catalog volumes in a catalog/schema |

### sql toolset
| # | Tool | Purpose |
|---|------|---------|
| 6 | `databricks_list_warehouses` | List SQL warehouses (state, size) |
| 7 | `databricks_execute_sql` | Run read-only SQL on a warehouse (SELECT/SHOW/DESCRIBE/EXPLAIN) |

### compute toolset
| # | Tool | Purpose |
|---|------|---------|
| 8 | `databricks_list_clusters` | List active/terminated clusters |
| 9 | `databricks_get_cluster` | Get cluster config and state |

### jobs toolset
| # | Tool | Purpose |
|---|------|---------|
| 10 | `databricks_list_jobs` | List workflow/job definitions |
| 11 | `databricks_get_job` | Get full job config (tasks, schedule) |
| 12 | `databricks_list_job_runs` | List recent runs for a job (or all) |
| 13 | `databricks_get_job_run` | Run status, tasks, execution details |
| 14 | `databricks_run_job` | Trigger an async job run |
| 15 | `databricks_cancel_job_run` | Cancel an active run |

### workspace toolset
| # | Tool | Purpose |
|---|------|---------|
| 16 | `databricks_list_workspace_objects` | List notebooks/files/dirs at a path |
| 17 | `databricks_export_notebook` | Export notebook source as base64 |

### dbfs / volumes files toolset
| # | Tool | Purpose |
|---|------|---------|
| 18 | `databricks_read_volume_file` | Read a file from a volume or DBFS |

---

## 4. How it is helpful

- **Unified agent access** — ECB agents can inspect and operate Databricks
  (catalogs, SQL, jobs, clusters, notebooks) through named tools instead of raw API code.
- **Data governance** — Unity Catalog tools surface lineage-friendly metadata
  (owners, comments, storage locations) to enrich the Enterprise Context Brain.
- **Read-only SQL safety** — `databricks_execute_sql` is AST-validated for
  SELECT/SHOW/DESCRIBE/EXPLAIN, and the client config sets `controlled-write` mode.
- **Automation via webhooks** — the webhook receiver can trigger/inspect jobs,
  export notebooks, or read volume files when wired to events.
- **Discovery-friendly** — `list_tools()` exposes JSON schemas for any MCP client.

---

## 5. Sample questions / prompts

**Discovery**
- "List all the Databricks MCP tools you have available."
- "Show me the input schema for `databricks_execute_sql`."

**Unity Catalog**
- "List all Unity Catalogs in the workspace."
- "What schemas exist in catalog `main`?"
- "List the tables in `main.finance`."
- "Show the columns and owner of table `main.finance.invoices`."
- "List the volumes under `main.default`."

**SQL**
- "List the SQL warehouses."
- "Run `SELECT count(*) FROM main.finance.invoices` on warehouse `abcd1234...`."

**Compute**
- "List all clusters and their states."
- "Get the configuration of cluster `1025-092000-active123`."

**Jobs**
- "List the jobs in the workspace."
- "Get the tasks and schedule of job 123."
- "Show recent runs of job 123."
- "What was the result of job run 987654?"
- "Run job 123 now."
- "Cancel run 987654."

**Workspace & files**
- "List notebooks under `/Users/dev@company.com`."
- "Export the source of `/Workspace/Users/dev/notebook`."
- "Read the file `/Volumes/main/default/landing/metrics.csv`."

---

## 6. Quick example (direct call)

```python
from app.infrastructure.mcp.databricks_mcp import DatabricksMCP

db = DatabricksMCP(
    host=os.getenv("DATABRICKS_HOST"),
    token=os.getenv("DATABRICKS_TOKEN"),
)
tools = db.list_tools()                        # 18 tool definitions
result = db.call_tool("databricks_list_clusters", {"limit": 10})
print(result)
```

Via REST:

```bash
curl -X POST http://localhost:8000/api/v1/webhooks/databricks/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "databricks_list_catalogs", "args": {}}'
```

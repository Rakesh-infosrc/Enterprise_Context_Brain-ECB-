# Databricks MCP Integration Guide (`databricks-mcp`)

This document defines a simplified, ECB-compliant Model Context Protocol (MCP) configuration for Databricks. It maps the core tools of the Databricks workspace into ECB's standardized schema format, securing data extraction, notebook tracking, and workflow runs.

---

## 1. Connection Configuration

To integrate the Databricks MCP server with the ECB environment, secure credentials are managed dynamically via environment variables without hardcoding.

| Parameter | Configuration Approach | Value Format | Description |
| :--- | :--- | :--- | :--- |
| **`DATABRICKS_HOST`** | Environment variable | `https://<workspace-id>.cloud.databricks.com` | The base URL of the Databricks workspace. |
| **`DATABRICKS_TOKEN`** | Environment variable | `dapi...` | Personal Access Token (PAT) used for authentication. |
| **`DATABRICKS_ACCESS_MODE`** | Server configuration | `controlled-write` | Access level (options: `read-only`, `controlled-write`). |

---

## 2. Registering with ECB MCP Framework

To register the Databricks MCP tools with the ECB framework, add the server details under the `mcpServers` object in the global configuration file:

### Global Configuration File Location
* **File Path:** [`C:/Users/Rakesh/.gemini/config/mcp_config.json`](file:///C:/Users/Rakesh/.gemini/config/mcp_config.json)

### Registration JSON Block
```json
{
  "mcpServers": {
    "databricks-mcp": {
      "command": "python",
      "args": ["-m", "databricks_mcp"],
      "env": {
        "DATABRICKS_HOST": "https://<workspace-id>.cloud.databricks.com",
        "DATABRICKS_TOKEN": "YOUR_DATABRICKS_TOKEN",
        "DATABRICKS_ACCESS_MODE": "controlled-write"
      }
    }
  }
}
```

---

## 3. Condensed Databricks MCP Core Tools

The following tools condense cluster, SQL, job, and workspace path actions into standard ECB JSON-RPC format:

### 1. Compute & Cluster Management

#### `databricks_list_clusters`
* **Description:** List all active and terminated compute clusters in the Databricks workspace.
* **Input Parameters:**
  * `limit` (integer, optional, default: `25`): Maximum number of clusters to return.
* **Returns:** `list[dict]` containing cluster state, ID, Spark runtime version, and node types.

#### `databricks_get_cluster`
* **Description:** Retrieve configuration settings and current execution state for a specific compute cluster.
* **Input Parameters:**
  * `cluster_id` (string, required): Unique identifier of the Databricks cluster.
* **Returns:** `dict` containing cluster properties, worker node count, state (e.g., `RUNNING`, `TERMINATED`), and drivers.

---

### 2. Jobs & Workflow Runs

#### `databricks_list_jobs`
* **Description:** List all registered workflow definitions and data engineering jobs in the workspace.
* **Input Parameters:**
  * `limit` (integer, optional, default: `25`): Maximum number of jobs to return.
* **Returns:** `list[dict]` containing job definitions, owners, and scheduling rules.

#### `databricks_run_job`
* **Description:** Trigger an asynchronous run execution of a workflow job. Returns the generated run ID.
* **Input Parameters:**
  * `job_id` (integer, required): The numeric ID of the job definition to run.
  * `idempotency_token` (string, optional): Token to prevent duplicate runs of the same action.
* **Returns:** `dict` with execution details including `run_id` and start timestamp.

#### `databricks_get_job_run`
* **Description:** Retrieve status, lifecycle state, tasks, and execution details of a specific job run.
* **Input Parameters:**
  * `run_id` (integer, required): The unique numeric identifier of the run instance.
* **Returns:** `dict` containing execution state (e.g., `PENDING`, `RUNNING`, `TERMINATED`), start/end time, and individual task status.

---

### 3. SQL Warehouse Queries

#### `databricks_execute_sql`
* **Description:** Run an AST-validated read-only SQL query on a SQL warehouse. Supports `SELECT`, `SHOW`, `DESCRIBE`, and `EXPLAIN`.
* **Input Parameters:**
  * `statement` (string, required): The read-only SQL statement to execute.
  * `warehouse_id` (string, required): The unique 16-character hexadecimal ID of the SQL Warehouse.
  * `max_rows` (integer, optional, default: `1000`): Maximum number of rows to return in the result.
  * `catalog` (string, optional): Default catalog context to use.
  * `schema` (string, optional): Default schema context to use.
* **Returns:** `dict` containing schema descriptors, column schemas, and raw data rows.

---

### 4. Workspace Files & Notebooks

#### `databricks_list_workspace_objects`
* **Description:** List notebooks, files, and directories stored under a given workspace folder path.
* **Input Parameters:**
  * `path` (string, required): Workspace path to list.
  * `limit` (integer, optional, default: `50`): Maximum items to return.
* **Returns:** `list[dict]` containing metadata, type (`NOTEBOOK`, `DIRECTORY`, `FILE`), and object paths.

#### `databricks_export_notebook`
* **Description:** Export the source code or content of a notebook/file as base64-encoded text.
* **Input Parameters:**
  * `path` (string, required): Full workspace path to the notebook.
  * `export_format` (string, optional, default: `"SOURCE"`): Export format (options: `SOURCE`, `HTML`, `JUPYTER`, `DBC`).
* **Returns:** `dict` containing base64 content, file extension, and export format.

---

## 4. Usage Workflow Examples

### Workflow A: Run a Core Data Pipeline and Monitor Completion
1. **Trigger run:**
   ```json
   {
     "name": "databricks_run_job",
     "arguments": {
       "job_id": 4029102,
       "idempotency_token": "a2b3c4-ecb-sync"
     }
   }
   ```
   * *Response:* `{"run_id": 9876543, "status": "PENDING"}`

2. **Poll Status:**
   ```json
   {
     "name": "databricks_get_job_run",
     "arguments": {
       "run_id": 9876543
     }
   }
   ```
   * *Response:* `{"run_id": 9876543, "state": {"life_cycle_state": "TERMINATED", "result_state": "SUCCESS"}}`

### Workflow B: Run validated read-only SQL on a Delta Table
```json
{
  "name": "databricks_execute_sql",
  "arguments": {
    "warehouse_id": "ab12c345def67890",
    "statement": "SELECT user_id, action, timestamp FROM hive_metastore.audit.user_logs LIMIT 10",
    "max_rows": 10
  }
}
```
* *Response:*
  ```json
  {
    "manifest": {
      "schema": {
        "columns": [
          {"name": "user_id", "type": "STRING"},
          {"name": "action", "type": "STRING"},
          {"name": "timestamp", "type": "TIMESTAMP"}
        ]
      }
    },
    "result": {
      "data_array": [
        ["usr-01", "LOGIN", "2026-08-26T12:00:00Z"],
        ["usr-02", "QUERY", "2026-08-26T12:01:30Z"]
      ]
    }
  }
  ```

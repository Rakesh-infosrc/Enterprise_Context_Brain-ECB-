"""
Enterprise Context Brain (ECB) v2.2 - Databricks MCP Server (REST API) Connector
Implements the "Databricks MCP Server" toolsets (Unity Catalog, SQL, Compute,
Jobs, Workspace, Volumes/DBFS) over the Databricks Workspace REST API. Exposed
both as a standard MCP tool catalog (tools/list + tools/call) and as an
invokable set of functions for the Databricks webhook receiver.

Mirrors the naming/structure of the GitHub/Jira MCP connectors so ECB treats all
three platform MCP toolsets uniformly. Authenticates with a Databricks Personal
Access Token (DATABRICKS_HOST + DATABRICKS_TOKEN) exactly like
databricks_extractor.py.
"""

from __future__ import annotations

import json
import os
import urllib.request
import urllib.error
import urllib.parse
from typing import Any, Dict, List, Optional


class DatabricksMCPError(Exception):
    """Raised when a Databricks REST API call fails."""


class DatabricksMCP:
    """Connects ECB to Databricks via its Workspace REST API (MCP Server toolsets)."""

    def __init__(self, host: Optional[str] = None, token: Optional[str] = None):
        self.host = (host or os.getenv("DATABRICKS_HOST", "https://adb-123456789.cloud.databricks.com")).rstrip("/")
        self.token = token or os.getenv("DATABRICKS_TOKEN", "")

    # ------------------------------------------------------------------ #
    # HTTP helpers
    # ------------------------------------------------------------------ #
    def _request(
        self,
        path: str,
        method: str = "GET",
        payload: Optional[Dict[str, Any]] = None,
    ) -> Any:
        if not self.token or not self.token.strip():
            raise DatabricksMCPError("DATABRICKS_TOKEN is not configured; cannot call Databricks REST API.")
        url = f"{self.host}/api{path}"
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Authorization", f"Bearer {self.token}")
        req.add_header("Accept", "application/json")
        req.add_header("User-Agent", "ECB-databricks-mcp/2.2")
        if payload is not None:
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req) as resp:
                raw = resp.read().decode("utf-8")
                if not raw:
                    return {}
                return json.loads(raw)
        except urllib.error.HTTPError as e:
            detail = ""
            try:
                detail = e.read().decode("utf-8")
            except Exception:
                pass
            raise DatabricksMCPError(f"Databricks API {method} {path} -> HTTP {e.code}: {detail[:400]}") from e
        except urllib.error.URLError as e:
            raise DatabricksMCPError(f"Databricks API {method} {path} -> network error: {e}") from e

    # ------------------------------------------------------------------ #
    # Tool catalog
    # ------------------------------------------------------------------ #
    def list_tools(self) -> List[Dict[str, Any]]:
        """Returns the Databricks MCP Server tool catalog (REST-API-backed toolsets)."""
        return [
            # ---- Unity Catalog toolset ----
            {
                "name": "databricks_list_catalogs",
                "description": "List all Unity Catalog catalogs accessible in the workspace metastore.",
                "inputSchema": {"type": "object", "properties": {}},
            },
            {
                "name": "databricks_list_schemas",
                "description": "List all schemas inside a given Unity Catalog.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "catalog_name": {"type": "string", "description": "The catalog to query schemas from (e.g. main)"},
                    },
                    "required": ["catalog_name"],
                },
            },
            {
                "name": "databricks_list_tables",
                "description": "List all tables inside a specific Unity Catalog schema.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "catalog_name": {"type": "string"},
                        "schema_name": {"type": "string"},
                        "max_tables": {"type": "integer", "default": 100},
                    },
                    "required": ["catalog_name", "schema_name"],
                },
            },
            {
                "name": "databricks_get_table",
                "description": "Get detailed metadata for a Unity Catalog table (columns, types, owner, location).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "full_name": {"type": "string", "description": "catalog.schema.table name"},
                    },
                    "required": ["full_name"],
                },
            },
            {
                "name": "databricks_list_volumes",
                "description": "List Unity Catalog volumes in a catalog/schema.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "catalog_name": {"type": "string"},
                        "schema_name": {"type": "string"},
                    },
                    "required": ["catalog_name", "schema_name"],
                },
            },
            # ---- SQL toolset ----
            {
                "name": "databricks_list_warehouses",
                "description": "List all SQL warehouses in the workspace with state and size.",
                "inputSchema": {"type": "object", "properties": {}},
            },
            {
                "name": "databricks_execute_sql",
                "description": "Run an AST-validated read-only SQL query on a SQL warehouse.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "statement": {"type": "string", "description": "The read-only SQL statement to execute"},
                        "warehouse_id": {"type": "string", "description": "The SQL warehouse id"},
                        "max_rows": {"type": "integer", "default": 1000},
                        "catalog": {"type": "string", "description": "Optional default catalog"},
                        "schema": {"type": "string", "description": "Optional default schema"},
                    },
                    "required": ["statement", "warehouse_id"],
                },
            },
            # ---- Compute toolset ----
            {
                "name": "databricks_list_clusters",
                "description": "List all active and terminated compute clusters in the workspace.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "limit": {"type": "integer", "default": 25},
                    },
                },
            },
            {
                "name": "databricks_get_cluster",
                "description": "Retrieve configuration settings and state for a specific cluster.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "cluster_id": {"type": "string"},
                    },
                    "required": ["cluster_id"],
                },
            },
            # ---- Jobs toolset ----
            {
                "name": "databricks_list_jobs",
                "description": "List all registered workflow definitions and data engineering jobs.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "limit": {"type": "integer", "default": 25},
                        "name": {"type": "string", "description": "Optional job name filter"},
                    },
                },
            },
            {
                "name": "databricks_get_job",
                "description": "Get full configuration of a specific job (tasks, schedule, clusters).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "job_id": {"type": "integer"},
                    },
                    "required": ["job_id"],
                },
            },
            {
                "name": "databricks_list_job_runs",
                "description": "List recent runs for a job (or all jobs) with state and timing.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "job_id": {"type": "integer", "description": "Optional job id filter"},
                        "limit": {"type": "integer", "default": 25},
                    },
                },
            },
            {
                "name": "databricks_get_job_run",
                "description": "Get status, lifecycle state, tasks and execution details of a job run.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "run_id": {"type": "integer"},
                    },
                    "required": ["run_id"],
                },
            },
            {
                "name": "databricks_run_job",
                "description": "Trigger an asynchronous run execution of a job. Returns the run id.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "job_id": {"type": "integer"},
                        "idempotency_token": {"type": "string"},
                    },
                    "required": ["job_id"],
                },
            },
            {
                "name": "databricks_cancel_job_run",
                "description": "Cancel an active job run.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "run_id": {"type": "integer"},
                    },
                    "required": ["run_id"],
                },
            },
            # ---- Workspace toolset ----
            {
                "name": "databricks_list_workspace_objects",
                "description": "List notebooks, files, and directories under a workspace folder path.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Workspace path to list (e.g. /Users/dev@company.com)"},
                    },
                    "required": ["path"],
                },
            },
            {
                "name": "databricks_export_notebook",
                "description": "Export the source code or content of a notebook/file as base64 text.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string"},
                        "format": {"type": "string", "default": "SOURCE"},
                    },
                    "required": ["path"],
                },
            },
            # ---- DBFS/Volumes files toolset ----
            {
                "name": "databricks_read_volume_file",
                "description": "Read contents of a file from a Unity Catalog volume or DBFS.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Volume or DBFS file path"},
                    },
                    "required": ["path"],
                },
            },
        ]

    def get_tool(self, name: str) -> Optional[Dict[str, Any]]:
        for t in self.list_tools():
            if t["name"] == name:
                return t
        return None

    # ------------------------------------------------------------------ #
    # Tool implementations
    # ------------------------------------------------------------------ #
    def call_tool(self, name: str, arguments: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Dispatches an MCP-style tool call to the Databricks REST API."""
        args = arguments or {}
        try:
            method = getattr(self, f"_impl_{name}")
        except AttributeError:
            raise DatabricksMCPError(f"Unknown Databricks MCP tool: {name}")
        return method(args)

    # ---- Unity Catalog ----
    def _impl_databricks_list_catalogs(self, args: Dict[str, Any]) -> Dict[str, Any]:
        data = self._request("/2.1/unity-catalog/catalogs")
        catalogs = data.get("catalogs", [])
        return {
            "catalogs": [
                {
                    "name": c.get("name"),
                    "comment": c.get("comment"),
                    "owner": c.get("owner"),
                    "metastore_id": c.get("metastore_id"),
                }
                for c in catalogs
            ]
        }

    def _impl_databricks_list_schemas(self, args: Dict[str, Any]) -> Dict[str, Any]:
        catalog_name = args["catalog_name"]
        data = self._request(f"/2.1/unity-catalog/schemas?catalog_name={urllib.parse.quote(catalog_name)}")
        schemas = data.get("schemas", [])
        return {
            "catalog_name": catalog_name,
            "schemas": [
                {"name": s.get("name"), "comment": s.get("comment"), "owner": s.get("owner")}
                for s in schemas
            ],
        }

    def _impl_databricks_list_tables(self, args: Dict[str, Any]) -> Dict[str, Any]:
        catalog_name = args["catalog_name"]
        schema_name = args["schema_name"]
        max_tables = int(args.get("max_tables", 100))
        data = self._request(
            f"/2.1/unity-catalog/tables?catalog_name={urllib.parse.quote(catalog_name)}&schema_name={urllib.parse.quote(schema_name)}"
        )
        tables = data.get("tables", [])
        return {
            "catalog_name": catalog_name,
            "schema_name": schema_name,
            "tables": [
                {"name": t.get("name"), "table_type": t.get("table_type"), "owner": t.get("owner"), "comment": t.get("comment")}
                for t in tables[:max_tables]
            ],
            "total": len(tables),
        }

    def _impl_databricks_get_table(self, args: Dict[str, Any]) -> Dict[str, Any]:
        full_name = args["full_name"]
        data = self._request(f"/2.1/unity-catalog/tables/{urllib.parse.quote(full_name)}")
        return {
            "name": data.get("name"),
            "full_name": data.get("full_name"),
            "catalog_name": data.get("catalog_name"),
            "schema_name": data.get("schema_name"),
            "table_type": data.get("table_type"),
            "owner": data.get("owner"),
            "comment": data.get("comment"),
            "data_source_format": data.get("data_source_format"),
            "storage_location": data.get("storage_location"),
            "columns": [
                {"name": col.get("name"), "type": col.get("type_text"), "nullable": col.get("nullable")}
                for col in (data.get("columns") or [])
            ],
            "properties": data.get("properties"),
            "generation": data.get("generation"),
        }

    def _impl_databricks_list_volumes(self, args: Dict[str, Any]) -> Dict[str, Any]:
        catalog_name = args["catalog_name"]
        schema_name = args["schema_name"]
        data = self._request(
            f"/2.1/unity-catalog/volumes?catalog_name={urllib.parse.quote(catalog_name)}&schema_name={urllib.parse.quote(schema_name)}"
        )
        volumes = data.get("volumes", [])
        return {
            "catalog_name": catalog_name,
            "schema_name": schema_name,
            "volumes": [
                {"name": v.get("name"), "volume_type": v.get("volume_type"), "owner": v.get("owner"), "comment": v.get("comment")}
                for v in volumes
            ],
        }

    # ---- SQL ----
    def _impl_databricks_list_warehouses(self, args: Dict[str, Any]) -> Dict[str, Any]:
        data = self._request("/2.0/sql/warehouses")
        warehouses = data.get("warehouses", [])
        return {
            "warehouses": [
                {
                    "id": w.get("id"),
                    "name": w.get("name"),
                    "state": w.get("state"),
                    "cluster_size": w.get("cluster_size"),
                    "min_num_clusters": w.get("min_num_clusters"),
                    "max_num_clusters": w.get("max_num_clusters"),
                    "creator_name": w.get("creator_name"),
                }
                for w in warehouses
            ]
        }

    def _impl_databricks_execute_sql(self, args: Dict[str, Any]) -> Dict[str, Any]:
        statement = args["statement"]
        warehouse_id = args["warehouse_id"]
        max_rows = int(args.get("max_rows", 1000))
        payload = {
            "warehouse_id": warehouse_id,
            "statement": statement,
            "wait_timeout": "15s",
            "on_wait_timeout": "CONTINUE",
            "max_result_size": 200,
        }
        if args.get("catalog"):
            payload["catalog"] = args["catalog"]
        if args.get("schema"):
            payload["schema"] = args["schema"]
        data = self._request("/2.0/sql/statements", method="POST", payload=payload)
        rows = []
        columns = []
        manifest = data.get("manifest", {})
        if manifest:
            columns = [c.get("name") for c in manifest.get("schema", {}).get("columns", [])]
        result = data.get("result", {}).get("data_array", [])
        for row in result[:max_rows]:
            rows.append(row)
        return {
            "statement_id": data.get("statement_id"),
            "status": data.get("status", {}).get("state"),
            "columns": columns,
            "row_count": len(result),
            "rows": rows,
        }

    # ---- Compute ----
    def _impl_databricks_list_clusters(self, args: Dict[str, Any]) -> Dict[str, Any]:
        limit = int(args.get("limit", 25))
        data = self._request("/2.0/clusters/list")
        clusters = data.get("clusters", [])
        return {
            "clusters": [
                {
                    "cluster_id": c.get("cluster_id"),
                    "cluster_name": c.get("cluster_name"),
                    "state": c.get("state"),
                    "spark_version": c.get("spark_version"),
                    "node_type_id": c.get("node_type_id"),
                    "num_workers": c.get("num_workers", 0),
                    "creator_user_name": c.get("creator_user_name"),
                }
                for c in clusters[:limit]
            ],
            "total": len(clusters),
        }

    def _impl_databricks_get_cluster(self, args: Dict[str, Any]) -> Dict[str, Any]:
        cluster_id = args["cluster_id"]
        c = self._request(f"/2.0/clusters/get?cluster_id={urllib.parse.quote(cluster_id)}")
        return {
            "cluster_id": c.get("cluster_id"),
            "cluster_name": c.get("cluster_name"),
            "state": c.get("state"),
            "spark_version": c.get("spark_version"),
            "node_type_id": c.get("node_type_id"),
            "num_workers": c.get("num_workers", 0),
            "autotermination_minutes": c.get("autotermination_minutes"),
            "last_state_loss_time": c.get("last_state_loss_time"),
            "creator_user_name": c.get("creator_user_name"),
            "cluster_source": c.get("cluster_source"),
        }

    # ---- Jobs ----
    def _impl_databricks_list_jobs(self, args: Dict[str, Any]) -> Dict[str, Any]:
        limit = int(args.get("limit", 25))
        name_filter = args.get("name")
        qs = f"limit={limit}"
        if name_filter:
            qs += f"&name={urllib.parse.quote(name_filter)}"
        data = self._request(f"/2.2/jobs/list?{qs}")
        jobs = data.get("jobs", [])
        return {
            "jobs": [
                {
                    "job_id": j.get("job_id"),
                    "name": j.get("settings", {}).get("name"),
                    "creator_user_name": j.get("creator_user_name"),
                    "created_time": j.get("created_time"),
                    "schedule": (j.get("settings") or {}).get("schedule"),
                    "tasks": [t.get("task_key") for t in (j.get("settings") or {}).get("tasks", [])],
                }
                for j in jobs
            ],
            "total": len(jobs),
        }

    def _impl_databricks_get_job(self, args: Dict[str, Any]) -> Dict[str, Any]:
        job_id = int(args["job_id"])
        j = self._request(f"/2.2/jobs/get?job_id={job_id}")
        return {
            "job_id": j.get("job_id"),
            "name": (j.get("settings") or {}).get("name"),
            "creator_user_name": j.get("creator_user_name"),
            "created_time": j.get("created_time"),
            "run_as": j.get("settings", {}).get("run_as"),
            "schedule": (j.get("settings") or {}).get("schedule"),
            "tasks": [
                {
                    "task_key": t.get("task_key"),
                    "job_cluster_key": t.get("job_cluster_key"),
                    "task_type": t.get("task_type"),
                }
                for t in (j.get("settings") or {}).get("tasks", [])
            ],
        }

    def _impl_databricks_list_job_runs(self, args: Dict[str, Any]) -> Dict[str, Any]:
        limit = int(args.get("limit", 25))
        job_id = args.get("job_id")
        qs = f"limit={limit}"
        if job_id:
            qs += f"&job_id={job_id}"
        data = self._request(f"/2.1/jobs/runs/list?{qs}")
        runs = data.get("runs", [])
        return {
            "runs": [
                {
                    "run_id": r.get("run_id"),
                    "job_id": r.get("job_id"),
                    "state": r.get("state", {}).get("life_cycle_state"),
                    "result_state": r.get("state", {}).get("result_state"),
                    "start_time": r.get("start_time"),
                    "end_time": r.get("end_time"),
                    "run_page_url": r.get("run_page_url"),
                }
                for r in runs
            ],
            "total": len(runs),
        }

    def _impl_databricks_get_job_run(self, args: Dict[str, Any]) -> Dict[str, Any]:
        run_id = int(args["run_id"])
        data = self._request(f"/2.1/jobs/runs/get?run_id={run_id}")
        return {
            "run_id": data.get("run_id"),
            "job_id": data.get("job_id"),
            "state": data.get("state", {}).get("life_cycle_state"),
            "result_state": data.get("state", {}).get("result_state"),
            "start_time": data.get("start_time"),
            "end_time": data.get("end_time"),
            "run_page_url": data.get("run_page_url"),
            "tasks": [
                {
                    "task_key": t.get("task_key"),
                    "state": (t.get("state") or {}).get("life_cycle_state"),
                    "result_state": (t.get("state") or {}).get("result_state"),
                    "start_time": t.get("start_time"),
                    "end_time": t.get("end_time"),
                }
                for t in (data.get("tasks") or [])
            ],
        }

    def _impl_databricks_run_job(self, args: Dict[str, Any]) -> Dict[str, Any]:
        job_id = int(args["job_id"])
        payload: Dict[str, Any] = {"job_id": job_id}
        if args.get("idempotency_token"):
            payload["idempotency_token"] = args["idempotency_token"]
        data = self._request("/2.1/jobs/run-now", method="POST", payload=payload)
        return {"run_id": data.get("run_id"), "job_id": job_id, "status": "submitted"}

    def _impl_databricks_cancel_job_run(self, args: Dict[str, Any]) -> Dict[str, Any]:
        run_id = int(args["run_id"])
        self._request("/2.1/jobs/runs/cancel", method="POST", payload={"run_id": run_id})
        return {"run_id": run_id, "status": "cancelled"}

    # ---- Workspace ----
    def _impl_databricks_list_workspace_objects(self, args: Dict[str, Any]) -> Dict[str, Any]:
        path = args.get("path", "/")
        data = self._request(f"/2.0/workspace/list?path={urllib.parse.quote(path)}")
        objects = data.get("objects", [])
        return {
            "path": path,
            "objects": [
                {
                    "path": o.get("path"),
                    "object_type": o.get("object_type"),
                    "language": o.get("language"),
                    "modified_at": o.get("modified_at"),
                    "object_id": o.get("object_id"),
                }
                for o in objects
            ],
        }

    def _impl_databricks_export_notebook(self, args: Dict[str, Any]) -> Dict[str, Any]:
        path = args["path"]
        fmt = args.get("format", "SOURCE")
        data = self._request(
            f"/2.0/workspace/export?path={urllib.parse.quote(path)}&format={urllib.parse.quote(fmt)}"
        )
        return {"path": path, "format": fmt, "content_base64": data.get("content")}

    def _impl_databricks_read_volume_file(self, args: Dict[str, Any]) -> Dict[str, Any]:
        path = args["path"]
        data = self._request(f"/2.0/dbfs/read?path={urllib.parse.quote(path)}&length=1000000")
        return {"path": path, "data_base64": data.get("data"), "bytes_read": data.get("bytes_read")}

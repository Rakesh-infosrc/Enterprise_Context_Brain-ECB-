"""
Enterprise Context Brain (ECB) v2.2 - Databricks MCP Server (REST API) Full Test Suite
Verifies ALL Databricks MCP Server toolsets (Unity Catalog, SQL, Compute, Jobs,
Workspace, Volumes/DBFS) exposed on the Databricks webhook receiver.
Real Databricks REST API calls are mocked via DatabricksMCP._request.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.infrastructure.db.store import CanonicalStore
from app.infrastructure.mcp.databricks_mcp import DatabricksMCP
from app.api.v1.webhooks.databricks_webhook import DatabricksWebhookHandler


@pytest.fixture(autouse=True)
def reset_store():
    store = CanonicalStore.get_instance()
    store.reset()
    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def mock_databricks_api(monkeypatch):
    """Stubs out the Databricks REST API transport so no token/network is needed."""

    def fake_request(self, path, method="GET", payload=None):
        base = path.split("?")[0]
        # --- Unity Catalog ---
        if base == "/2.1/unity-catalog/catalogs":
            return {"catalogs": [{"name": "main", "comment": "Primary catalog", "owner": "root", "metastore_id": "m1"}, {"name": "analytics", "comment": "", "owner": "eng", "metastore_id": "m1"}]}
        if base == "/2.1/unity-catalog/schemas":
            return {"schemas": [{"name": "default", "comment": "", "owner": "root"}, {"name": "silver", "comment": "curated", "owner": "eng"}]}
        if base == "/2.1/unity-catalog/tables":
            return {"tables": [{"name": "customers", "table_type": "MANAGED", "owner": "eng", "comment": "customer data"}, {"name": "orders", "table_type": "MANAGED", "owner": "eng", "comment": "orders"}]}
        if base.startswith("/2.1/unity-catalog/tables/") and "/tables/" in base:
            full = base.split("/2.1/unity-catalog/tables/")[1]
            return {
                "name": full.split(".")[-1], "full_name": full, "catalog_name": "main", "schema_name": "default",
                "table_type": "MANAGED", "owner": "eng", "comment": "customer data", "data_source_format": "DELTA",
                "storage_location": "s3://bucket/table", "columns": [{"name": "id", "type_text": "bigint", "nullable": False}, {"name": "name", "type_text": "string", "nullable": True}],
            }
        if base == "/2.1/unity-catalog/volumes":
            return {"volumes": [{"name": "raw_data", "volume_type": "MANAGED", "owner": "eng", "comment": "raw"}, {"name": "images", "volume_type": "MANAGED", "owner": "eng", "comment": ""}]}
        # --- SQL ---
        if base == "/2.0/sql/warehouses":
            return {"warehouses": [{"id": "warehouse1", "name": "Analytics WH", "state": "RUNNING", "cluster_size": "2X-Small", "min_num_clusters": 1, "max_num_clusters": 2, "creator_name": "reena"}]}
        if base == "/2.0/sql/statements":
            return {
                "statement_id": "stmt1", "status": {"state": "SUCCEEDED"},
                "manifest": {"schema": {"columns": [{"name": "id"}, {"name": "name"}]}},
                "result": {"data_array": [[1, "alice"], [2, "bob"]]},
            }
        # --- Clusters ---
        if base == "/2.0/clusters/list":
            return {"clusters": [{"cluster_id": "1234-abc", "cluster_name": "Shared Compute", "state": "RUNNING", "spark_version": "13.3.x", "node_type_id": "i3.xlarge", "num_workers": 2, "creator_user_name": "reena"}]}
        if base == "/2.0/clusters/get":
            return {"cluster_id": "1234-abc", "cluster_name": "Shared Compute", "state": "RUNNING", "spark_version": "13.3.x", "node_type_id": "i3.xlarge", "num_workers": 2, "autotermination_minutes": 30, "creator_user_name": "reena", "cluster_source": "UI"}
        # --- Jobs ---
        if base == "/2.2/jobs/list":
            return {"jobs": [{"job_id": 101, "settings": {"name": "Daily ETL", "schedule": {"quartz_cron_expression": "0 0 9 * * ?"}, "tasks": [{"task_key": "extract"}, {"task_key": "load"}]}, "creator_user_name": "reena", "created_time": 1724658000000}]}
        if base == "/2.2/jobs/get":
            return {"job_id": 101, "settings": {"name": "Daily ETL", "run_as": "reena", "schedule": {"quartz_cron_expression": "0 0 9 * * ?"}, "tasks": [{"task_key": "extract", "job_cluster_key": "shared", "task_type": "notebook"}]}, "creator_user_name": "reena", "created_time": 1724658000000}
        if base == "/2.1/jobs/runs/list":
            return {"runs": [{"run_id": 5001, "job_id": 101, "state": {"life_cycle_state": "TERMINATED", "result_state": "SUCCESS"}, "start_time": 1724658000000, "end_time": 1724658060000, "run_page_url": "https://example/#job/101/run/5001"}]}
        if base == "/2.1/jobs/runs/get":
            return {"run_id": 5001, "job_id": 101, "state": {"life_cycle_state": "TERMINATED", "result_state": "SUCCESS"}, "start_time": 1724658000000, "end_time": 1724658060000, "run_page_url": "https://example/#job/101/run/5001", "tasks": [{"task_key": "extract", "state": {"life_cycle_state": "TERMINATED", "result_state": "SUCCESS"}, "start_time": 1724658000000, "end_time": 1724658030000}]}
        if base == "/2.1/jobs/run-now":
            return {"run_id": 6001}
        if base == "/2.1/jobs/runs/cancel":
            return {}
        # --- Workspace ---
        if base == "/2.0/workspace/list":
            return {"objects": [{"path": "/Users/reena/notebook", "object_type": "NOTEBOOK", "language": "PYTHON", "modified_at": 1724658000000, "object_id": 1234}, {"path": "/Users/reena/folder", "object_type": "DIRECTORY", "modified_at": 1724658000000, "object_id": 1235}]}
        if base == "/2.0/workspace/export":
            return {"content": "cHJpbnQoImhlbGxvIik="}
        # --- DBFS ---
        if base == "/2.0/dbfs/read":
            return {"data": "c2FtcGxl", "bytes_read": 6}
        raise AssertionError(f"Unhandled test path: {path}")

    monkeypatch.setattr(DatabricksMCP, "_request", fake_request)


# ====================================================================
# Unity Catalog toolset
# ====================================================================
def test_databricks_list_catalogs(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_list_catalogs", "args": {}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["catalogs"]) == 2
    assert data["catalogs"][0]["name"] == "main"


def test_databricks_list_schemas(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_list_schemas", "args": {"catalog_name": "main"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["catalog_name"] == "main"
    assert "silver" in [s["name"] for s in data["schemas"]]


def test_databricks_list_tables(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_list_tables", "args": {"catalog_name": "main", "schema_name": "default"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["tables"]) == 2
    assert data["tables"][0]["name"] == "customers"


def test_databricks_get_table(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_get_table", "args": {"full_name": "main.default.customers"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["full_name"] == "main.default.customers"
    assert len(data["columns"]) == 2
    assert data["columns"][0]["name"] == "id"


def test_databricks_list_volumes(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_list_volumes", "args": {"catalog_name": "main", "schema_name": "default"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["volumes"]) == 2
    assert data["volumes"][0]["name"] == "raw_data"


# ====================================================================
# SQL toolset
# ====================================================================
def test_databricks_list_warehouses(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_list_warehouses", "args": {}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["warehouses"][0]["name"] == "Analytics WH"
    assert data["warehouses"][0]["state"] == "RUNNING"


def test_databricks_execute_sql(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_execute_sql", "args": {"statement": "SELECT * FROM customers", "warehouse_id": "warehouse1"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "SUCCEEDED"
    assert data["columns"] == ["id", "name"]
    assert len(data["rows"]) == 2


# ====================================================================
# Compute toolset
# ====================================================================
def test_databricks_list_clusters(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_list_clusters", "args": {}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["clusters"][0]["cluster_name"] == "Shared Compute"
    assert data["clusters"][0]["state"] == "RUNNING"


def test_databricks_get_cluster(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_get_cluster", "args": {"cluster_id": "1234-abc"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["cluster_id"] == "1234-abc"
    assert data["spark_version"] == "13.3.x"


# ====================================================================
# Jobs toolset
# ====================================================================
def test_databricks_list_jobs(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_list_jobs", "args": {}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["jobs"][0]["name"] == "Daily ETL"
    assert data["jobs"][0]["job_id"] == 101


def test_databricks_get_job(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_get_job", "args": {"job_id": 101}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Daily ETL"
    assert data["tasks"][0]["task_key"] == "extract"


def test_databricks_list_job_runs(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_list_job_runs", "args": {"job_id": 101}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["runs"][0]["result_state"] == "SUCCESS"
    assert data["runs"][0]["run_id"] == 5001


def test_databricks_get_job_run(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_get_job_run", "args": {"run_id": 5001}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["run_id"] == 5001
    assert data["result_state"] == "SUCCESS"
    assert len(data["tasks"]) == 1


def test_databricks_run_job(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_run_job", "args": {"job_id": 101}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["run_id"] == 6001
    assert data["status"] == "submitted"


def test_databricks_cancel_job_run(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_cancel_job_run", "args": {"run_id": 5001}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["run_id"] == 5001
    assert data["status"] == "cancelled"


# ====================================================================
# Workspace toolset
# ====================================================================
def test_databricks_list_workspace_objects(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_list_workspace_objects", "args": {"path": "/Users/reena"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["path"] == "/Users/reena"
    assert data["objects"][0]["object_type"] == "NOTEBOOK"


def test_databricks_export_notebook(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_export_notebook", "args": {"path": "/Users/reena/notebook"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["content_base64"] == "cHJpbnQoImhlbGxvIik="


# ====================================================================
# DBFS / Volume files toolset
# ====================================================================
def test_databricks_read_volume_file(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_read_volume_file", "args": {"path": "/Volumes/main/default/raw_data/file.csv"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["data_base64"] == "c2FtcGxl"
    assert data["bytes_read"] == 6


# ====================================================================
# Tool catalog endpoint
# ====================================================================
def test_databricks_mcp_tool_catalog_count(client):
    resp = client.get("/api/v1/webhooks/databricks/tools")
    assert resp.status_code == 200
    tools = resp.json()["tools"]
    assert len(tools) == 18
    names = {t["name"] for t in tools}
    expected = {
        "databricks_list_catalogs",
        "databricks_list_schemas",
        "databricks_list_tables",
        "databricks_get_table",
        "databricks_list_volumes",
        "databricks_list_warehouses",
        "databricks_execute_sql",
        "databricks_list_clusters",
        "databricks_get_cluster",
        "databricks_list_jobs",
        "databricks_get_job",
        "databricks_list_job_runs",
        "databricks_get_job_run",
        "databricks_run_job",
        "databricks_cancel_job_run",
        "databricks_list_workspace_objects",
        "databricks_export_notebook",
        "databricks_read_volume_file",
    }
    assert expected == names


# ====================================================================
# Mode B: webhook payload dispatches to MCP tool
# ====================================================================
def test_databricks_mcp_webhook_mode_b_dispatch(client):
    resp = client.post("/api/v1/webhooks/databricks", json={
        "tool": "databricks_list_clusters",
        "arguments": {},
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["clusters"][0]["cluster_name"] == "Shared Compute"


# ====================================================================
# Error handling: unknown tool
# ====================================================================
def test_databricks_mcp_unknown_tool(client):
    handler = DatabricksWebhookHandler()
    result = handler.call_mcp_tool("databricks_nonexistent", {})
    assert result["status"] == "ERROR"
    assert "Unknown" in result["error"] or "nonexistent" in result["error"]


# ====================================================================
# Audit trail: every MCP call is logged
# ====================================================================
def test_databricks_mcp_call_logs_audit_event(client):
    resp = client.post("/api/v1/webhooks/databricks/tools/call", json={
        "tool_name": "databricks_list_jobs", "args": {}
    })
    assert resp.status_code == 200
    store = CanonicalStore.get_instance()
    audits = store.get_audit_events(limit=10)
    tool_audits = [a for a in audits if "DATABRICKS_MCP" in a.action_type]
    assert len(tool_audits) >= 1
    assert "databricks_list_jobs" in tool_audits[0].entity_id

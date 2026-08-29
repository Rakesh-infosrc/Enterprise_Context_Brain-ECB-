"""
Enterprise Context Brain (ECB) v2.2 - Jira MCP Server (REST API) Full Test Suite
Verifies ALL Jira MCP Server toolsets (issues, projects, comments, transitions,
worklog, users, agile) exposed on the Jira webhook receiver.
Real Jira REST API calls are mocked via JiraMCP._request.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.infrastructure.db.store import CanonicalStore
from app.infrastructure.mcp.jira_mcp import JiraMCP
from app.api.v1.webhooks.jira_webhook import JiraWebhookHandler


@pytest.fixture(autouse=True)
def reset_store():
    store = CanonicalStore.get_instance()
    store.reset()
    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def mock_jira_api(monkeypatch):
    """Stubs out the Jira REST API transport so no token/network is needed."""

    def fake_request(self, path, method="GET", payload=None):
        base = path.split("?")[0]
        # --- projects ---
        if base == "/api/3/project":
            return [
                {"key": "KAN", "name": "ECB Kanban", "projectTypeKey": "software", "lead": {"displayName": "Reena MS"}},
                {"key": "CLARA", "name": "clara-V2", "projectTypeKey": "software", "lead": {"displayName": "Reena MS"}},
            ]
        if base.startswith("/api/3/project/") and base.endswith("/versions"):
            key = base.split("/")[4]
            return [
                {"id": "10000", "name": "v2.2.0", "description": "release", "released": False, "releaseDate": "2026-10-01"}
            ]
        if base.startswith("/api/3/project/"):
            key = base.rsplit("/", 1)[-1]
            return {"key": key, "name": f"Project {key}", "projectTypeKey": "software", "lead": {"displayName": "Reena MS"}, "url": f"https://jira.example.com/browse/{key}"}
        # --- transitions ---
        if "/transitions" in base:
            return {"transitions": [{"id": "31", "name": "In Progress", "to": {"name": "In Progress"}}, {"id": "41", "name": "Done", "to": {"name": "Done"}}]}
        # --- comments ---
        if "/comment" in base and method == "POST":
            return {"id": "10020"}
        if "/comment" in base:
            return {"comments": [{"id": "10010", "author": {"displayName": "Reena MS"}, "created": "2026-08-01T00:00:00.000Z", "body": {"type": "doc", "version": 1, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "looks good"}]}]}}]}
        # --- worklog ---
        if "/worklog" in base and method == "POST":
            return {"id": "10030"}
        # --- users ---
        if "/user/search" in base:
            return [{"accountId": "abc123", "displayName": "Reena MS", "emailAddress": "reenams2002@gmail.com"}]
        # --- agile boards / sprints ---
        if "/board/" in base and "/sprint" in base:
            return {"values": [{"id": 1, "name": "Sprint 1", "state": "active"}, {"id": 2, "name": "Sprint 2", "state": "future"}]}
        if "/agile/1.0/board" in base:
            return {"values": [{"id": 1, "name": "ECB Board", "type": "kanban"}]}
        # --- search/jql ---
        if "/search/jql" in base:
            jql = (payload or {}).get("jql", "project=KAN")
            project = "KAN"
            if "project=" in jql:
                project = jql.split("project=")[1].split()[0].strip("'\"")
            issues = [
                {
                    "key": "KAN-1",
                    "fields": {
                        "summary": "Persistent context with Mem0",
                        "status": {"name": "In Progress"},
                        "priority": {"name": "High"},
                        "issuetype": {"name": "Story"},
                        "assignee": {"displayName": "Reena MS"},
                        "duedate": "2026-09-15",
                        "updated": "2026-08-01T00:00:00.000Z",
                        "created": "2026-07-01T00:00:00.000Z",
                        "description": None,
                    },
                },
                {
                    "key": "KAN-2",
                    "fields": {
                        "summary": "GitHub webhook ingestion",
                        "status": {"name": "Done"},
                        "priority": {"name": "Medium"},
                        "issuetype": {"name": "Task"},
                        "assignee": {"displayName": "Dev User"},
                        "duedate": None,
                        "updated": "2026-08-02T00:00:00.000Z",
                        "created": "2026-07-02T00:00:00.000Z",
                        "description": None,
                    },
                },
            ]
            return {"total": len(issues), "issues": issues}
        # --- create issue (POST /api/3/issue) ---
        if base == "/api/3/issue" and method == "POST":
            key = "KAN-9"
            return {"key": key, "id": "10001"}
        # --- single issue (GET/PUT) ---
        if base.startswith("/api/3/issue/"):
            if method == "POST":
                if "/transitions" in base:
                    return {}
                if "/comment" in base:
                    return {"id": "10020"}
                if "/worklog" in base:
                    return {"id": "10030"}
                return {}
            if method == "PUT":
                return {}
            key = base.rsplit("/", 1)[-1]
            return {
                "key": key,
                "fields": {
                    "summary": "Sample issue",
                    "status": {"name": "In Progress"},
                    "priority": {"name": "High"},
                    "issuetype": {"name": "Story"},
                    "assignee": {"displayName": "Reena MS"},
                    "reporter": {"displayName": "Reena MS"},
                    "duedate": "2026-09-15",
                    "created": "2026-07-01T00:00:00.000Z",
                    "updated": "2026-08-01T00:00:00.000Z",
                    "description": {"type": "doc", "version": 1, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Description here"}]}]},
                    "labels": ["ecb"],
                },
            }
        raise AssertionError(f"Unhandled test path: {path}")

    monkeypatch.setattr(JiraMCP, "_request", fake_request)


# ====================================================================
# 1. jira_get_issue (issues toolset)
# ====================================================================
def test_jira_get_issue(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_get_issue", "args": {"issue_key": "KAN-1"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["key"] == "KAN-1"
    assert data["summary"] == "Sample issue"
    assert data["status"] == "In Progress"
    assert isinstance(data["comments"], list)
    assert len(data["comments"]) == 1
    assert data["url"] is not None


# ====================================================================
# 2. jira_search_issues (search via JQL)
# ====================================================================
def test_jira_search_issues(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_search_issues", "args": {"jql": "project=KAN", "max_results": 20}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert data["issues"][0]["key"] == "KAN-1"
    assert data["issues"][0]["status"] == "In Progress"


# ====================================================================
# 3. jira_list_project_issues (issues toolset)
# ====================================================================
def test_jira_list_project_issues(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_list_project_issues", "args": {"project_key": "KAN"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["project_key"] == "KAN"
    assert len(data["issues"]) == 2


# ====================================================================
# 4. jira_create_issue (issues toolset)
# ====================================================================
def test_jira_create_issue(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_create_issue", "args": {"project_key": "KAN", "summary": "New task"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "created"
    assert data["key"] is not None


# ====================================================================
# 5. jira_update_issue (issues toolset)
# ====================================================================
def test_jira_update_issue(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_update_issue", "args": {"issue_key": "KAN-1", "summary": "Updated"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "updated"
    assert "summary" in data["updated_fields"]


# ====================================================================
# 6. jira_transition_issue (transitions toolset)
# ====================================================================
def test_jira_transition_issue(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_transition_issue", "args": {"issue_key": "KAN-1", "transition_name": "Done"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "transitioned"
    assert data["transition"] == "Done"


# ====================================================================
# 7. jira_get_transitions (transitions toolset)
# ====================================================================
def test_jira_get_transitions(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_get_transitions", "args": {"issue_key": "KAN-1"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["transitions"]) == 2
    assert data["transitions"][0]["to_status"] == "In Progress"


# ====================================================================
# 8. jira_list_projects (projects toolset)
# ====================================================================
def test_jira_list_projects(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_list_projects", "args": {}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["projects"]) == 2
    assert data["projects"][0]["key"] == "KAN"


# ====================================================================
# 9. jira_get_project (projects toolset)
# ====================================================================
def test_jira_get_project(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_get_project", "args": {"project_key": "KAN"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["key"] == "KAN"
    assert data["lead"] == "Reena MS"


# ====================================================================
# 10. jira_get_project_versions (projects toolset)
# ====================================================================
def test_jira_get_project_versions(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_get_project_versions", "args": {"project_key": "KAN"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["versions"]) == 1
    assert data["versions"][0]["name"] == "v2.2.0"


# ====================================================================
# 11. jira_add_comment (comments toolset)
# ====================================================================
def test_jira_add_comment(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_add_comment", "args": {"issue_key": "KAN-1", "body": "Approved"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "added"
    assert data["comment_id"] == "10020"


# ====================================================================
# 12. jira_list_comments (comments toolset)
# ====================================================================
def test_jira_list_comments(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_list_comments", "args": {"issue_key": "KAN-1"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["issue_key"] == "KAN-1"
    assert data["comments"][0]["author"] == "Reena MS"
    assert data["comments"][0]["body"] == "looks good"


# ====================================================================
# 13. jira_add_worklog (worklog toolset)
# ====================================================================
def test_jira_add_worklog(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_add_worklog", "args": {"issue_key": "KAN-1", "time_spent": "2h"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "added"
    assert data["time_spent"] == "2h"


# ====================================================================
# 14. jira_search_users (users toolset)
# ====================================================================
def test_jira_search_users(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_search_users", "args": {"query": "reenams"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["users"][0]["display_name"] == "Reena MS"


# ====================================================================
# 15. jira_list_boards (agile toolset)
# ====================================================================
def test_jira_list_boards(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_list_boards", "args": {}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["boards"][0]["name"] == "ECB Board"


# ====================================================================
# 16. jira_list_sprints (agile toolset)
# ====================================================================
def test_jira_list_sprints(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_list_sprints", "args": {"board_id": 1}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["sprints"]) == 2
    assert data["sprints"][0]["state"] == "active"


# ====================================================================
# 17. jira_get_board_issues (agile toolset)
# ====================================================================
def test_jira_get_board_issues(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_get_board_issues", "args": {"board_id": 1}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["board_id"] == 1
    assert len(data["issues"]) == 2


# ====================================================================
# Tool catalog endpoint
# ====================================================================
def test_jira_mcp_tool_catalog_count(client):
    resp = client.get("/api/v1/webhooks/jira/tools")
    assert resp.status_code == 200
    tools = resp.json()["tools"]
    assert len(tools) == 17
    names = {t["name"] for t in tools}
    expected = {
        "jira_get_issue",
        "jira_search_issues",
        "jira_list_project_issues",
        "jira_create_issue",
        "jira_update_issue",
        "jira_transition_issue",
        "jira_get_transitions",
        "jira_list_projects",
        "jira_get_project",
        "jira_get_project_versions",
        "jira_add_comment",
        "jira_list_comments",
        "jira_add_worklog",
        "jira_search_users",
        "jira_list_boards",
        "jira_list_sprints",
        "jira_get_board_issues",
    }
    assert expected == names


# ====================================================================
# Mode B: webhook payload dispatches to MCP tool
# ====================================================================
def test_jira_mcp_webhook_mode_b_dispatch(client):
    resp = client.post("/api/v1/webhooks/jira", json={
        "tool": "jira_search_issues",
        "arguments": {"jql": "project=KAN"},
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert data["issues"][0]["key"] == "KAN-1"


# ====================================================================
# Error handling: unknown tool
# ====================================================================
def test_jira_mcp_unknown_tool(client):
    handler = JiraWebhookHandler()
    result = handler.call_mcp_tool("jira_nonexistent", {"issue_key": "KAN-1"})
    assert result["status"] == "ERROR"
    assert "Unknown" in result["error"] or "nonexistent" in result["error"]


# ====================================================================
# Audit trail: every MCP call is logged
# ====================================================================
def test_jira_mcp_call_logs_audit_event(client):
    resp = client.post("/api/v1/webhooks/jira/tools/call", json={
        "tool_name": "jira_list_projects", "args": {}
    })
    assert resp.status_code == 200
    store = CanonicalStore.get_instance()
    audits = store.get_audit_events(limit=10)
    tool_audits = [a for a in audits if "JIRA_MCP" in a.action_type]
    assert len(tool_audits) >= 1
    assert "jira_list_projects" in tool_audits[0].entity_id

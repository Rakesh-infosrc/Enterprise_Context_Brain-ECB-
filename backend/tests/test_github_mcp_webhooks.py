"""
Enterprise Context Brain (ECB) v2.2 - GitHub MCP Server (REST API) Full Test Suite
Verifies ALL 19 GitHub MCP Server toolsets (git, issues, pull_requests, repos,
actions, tags/releases) exposed on the GitHub webhook receiver.
Real GitHub REST API calls are mocked via GitHubMCP._request.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.infrastructure.db.store import CanonicalStore
from app.infrastructure.mcp.github_mcp import GitHubMCP
from app.api.v1.webhooks.github_webhook import GitHubWebhookHandler


@pytest.fixture(autouse=True)
def reset_store():
    store = CanonicalStore.get_instance()
    store.reset()
    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def mock_github_api(monkeypatch):
    """Stubs out the GitHub REST API transport so no token/network is needed."""

    def fake_request(self, path, method="GET", payload=None):
        base = path.split("?")[0]
        seg = [s for s in base.split("/") if s]
        # repo root: /repos/{owner}/{repo} -> seg ['repos', owner, repo]
        if len(seg) == 3 and seg[0] == "repos":
            return {"full_name": "o/r", "default_branch": "main", "size": 100, "language": "Python", "open_issues_count": 3, "stargazers_count": 10, "description": "test repo", "visibility": "private", "pushed_at": "2026-08-01T00:00:00Z", "archived": False, "forks_count": 1}
        # git/trees
        if "/git/trees/" in base:
            return {"truncated": False, "tree": [{"path": "src/app.py", "type": "blob"}, {"path": "docs", "type": "tree"}]}
        # tags - GET list
        if base.endswith("/tags") and method == "GET":
            return [{"name": "v2.2.0"}, {"name": "v2.1.0"}]
        # tags - POST create annotated tag object (/repos/o/r/git/tags)
        if base.endswith("/tags") and method == "POST" and "/git/" in base:
            return {"sha": "tagobj123", "tag": payload.get("tag", "v1") if payload else "v1"}
        # branches (list only)
        if base.endswith("/branches"):
            return [{"name": "main"}, {"name": "develop"}]
        # git/ref/heads/{branch}
        if "/git/ref/heads/" in base:
            return {"object": {"sha": "base123"}}
        # git/refs POST (create branch or tag ref)
        if base == "/git/refs" and method == "POST":
            return {"ref": payload.get("ref", "refs/heads/x"), "object": {"sha": "abc"}}
        # actions/runs/{id}/jobs (specific run's jobs)
        if "/actions/runs/" in path and "/jobs" in path:
            return {"jobs": [{"name": "test", "status": "completed", "conclusion": "success"}]}
        # actions/runs list (no specific run id)
        if "/actions/runs" in path and "/actions/runs/" not in path:
            return {"workflow_runs": [{"id": 11, "name": "CI", "status": "completed", "conclusion": "success", "head_branch": "main", "created_at": "2026-08-01T00:00:00Z", "html_url": "https://github.com/o/r/actions/runs/11"}]}
        # actions/runs/{id} (specific run details)
        if "/actions/runs/" in path and "/jobs" not in path:
            return {"id": 11, "name": "CI", "status": "completed", "conclusion": "success", "head_branch": "main", "head_sha": "abc123", "created_at": "2026-08-01T00:00:00Z", "updated_at": "2026-08-01T01:00:00Z"}
        # contents (file)
        if "/contents/" in base:
            return {"name": "app.py", "path": "src/app.py", "type": "file", "size": 8, "content": "aGVsbG8=", "encoding": "base64"}
        # issues - list
        if base.endswith("/issues") and method == "GET":
            return [{"number": 3, "title": "Bug", "state": "open", "user": {"login": "dev"}, "labels": [{"name": "bug"}], "created_at": "2026-08-01T00:00:00Z"}]
        # issues - create
        if base.endswith("/issues") and method == "POST":
            return {"number": 5, "html_url": "https://github.com/o/r/issues/5"}
        # issues/{num}/comments
        if "/issues/" in base and base.endswith("/comments"):
            return [{"user": {"login": "reviewer"}, "body": "looks good"}]
        # issues/{num} - update (PATCH)
        if "/issues/" in base and method == "PATCH":
            num = seg[-1] if seg else "3"
            return {"number": int(num), "title": payload.get("title", "Updated"), "state": payload.get("state", "closed")}
        # issues/{num} - get (GET)
        if "/issues/" in base and method == "GET":
            num = seg[-1] if seg else "3"
            return {"number": int(num), "title": "Bug", "state": "open", "body": "detail", "user": {"login": "dev"}, "labels": [{"name": "bug"}], "created_at": "2026-08-01T00:00:00Z"}
        # pulls - list
        if base.endswith("/pulls") and method == "GET":
            return [{"number": 1, "title": "Multi-region failover", "state": "open", "user": {"login": "dev"}, "head": {"ref": "feature/x", "repo": {"name": "r"}}, "base": {"ref": "main", "repo": {"name": "r"}}, "body": "desc", "merged": False}]
        # pulls - create
        if base.endswith("/pulls") and method == "POST":
            return {"number": 9, "html_url": "https://github.com/o/r/pull/9"}
        # pulls/{num}/reviews
        if "/pulls/" in base and base.endswith("/reviews"):
            return [{"state": "APPROVED"}]
        # pulls/{num}/files
        if "/pulls/" in base and base.endswith("/files"):
            return [{"filename": "src/app.py"}]
        # pulls/{num} - get
        if "/pulls/" in base and method == "GET":
            num = seg[-1] if seg else "1"
            return {"number": int(num), "title": "PR", "state": "open", "user": {"login": "dev"}, "head": {"ref": "f"}, "base": {"ref": "main"}, "body": "desc", "merged": False}
        # commits - get single commit (has SHA after /commits/)
        if "/commits/" in base:
            sha = seg[-1] if seg else "abc123"
            return {"sha": sha, "commit": {"author": {"name": "Alex Mercer", "date": "2026-08-01T10:00:00Z"}, "message": "fix(pci): TLS 1.3"}, "stats": {"additions": 10, "deletions": 2}, "files": [{"filename": "src/app.py", "status": "modified", "additions": 10, "deletions": 2}]}
        # commits - list
        if base.endswith("/commits"):
            return [{"sha": "abc123", "commit": {"author": {"name": "Alex Mercer", "date": "2026-08-01T10:00:00Z"}, "message": "fix(pci): TLS 1.3\n\nbody"}}]
        raise AssertionError(f"Unhandled test path: {path}")

    monkeypatch.setattr(GitHubMCP, "_request", fake_request)


# ====================================================================
# 1. github_get_repo_status (git toolset - status analog)
# ====================================================================
def test_github_get_repo_status(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_get_repo_status", "args": {"repo": "o/r"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["repository"] == "o/r"
    assert data["default_branch"] == "main"
    assert data["language"] == "Python"
    assert isinstance(data["recent_commits"], list)


# ====================================================================
# 2. github_list_commits (git toolset - log analog)
# ====================================================================
def test_github_list_commits(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_list_commits", "args": {"repo": "o/r", "max_count": 5}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["commits"][0]["sha"] == "abc123"
    assert data["commits"][0]["message"] == "fix(pci): TLS 1.3"


# ====================================================================
# 3. github_get_commit (git toolset - show analog)
# ====================================================================
def test_github_get_commit(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_get_commit", "args": {"repo": "o/r", "sha": "abc123"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["sha"] == "abc123"
    assert "author" in data


# ====================================================================
# 4. github_list_branches (git toolset - branch analog)
# ====================================================================
def test_github_list_branches(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_list_branches", "args": {"repo": "o/r", "branch_type": "local"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "main" in data["branches"]


# ====================================================================
# 5. github_list_tags (git toolset - tag listing)
# ====================================================================
def test_github_list_tags(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_list_tags", "args": {"repo": "o/r"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "v2.2.0" in data["tags"]


# ====================================================================
# 6. github_get_repository_tree (git toolset - tree/status analog)
# ====================================================================
def test_github_get_repository_tree(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_get_repository_tree", "args": {"repo": "o/r", "branch": "main"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["entries"]) == 2
    assert data["entries"][0]["path"] == "src/app.py"


# ====================================================================
# 7. github_create_branch (git toolset - create_branch analog)
# ====================================================================
def test_github_create_branch(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_create_branch", "args": {"repo": "o/r", "branch_name": "feature/x", "base_branch": "main"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["branch"] == "feature/x"
    assert data["status"] == "created"


# ====================================================================
# 8. github_create_tag (git toolset - tag_release analog)
# ====================================================================
def test_github_create_tag(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_create_tag", "args": {"repo": "o/r", "tag": "v2.2.0", "sha": "abc123", "message": "Release"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["tag"] == "v2.2.0"
    assert data["status"] == "created"


# ====================================================================
# 9. github_list_issues (issues toolset)
# ====================================================================
def test_github_list_issues(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_list_issues", "args": {"repo": "o/r", "state": "open"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["issues"][0]["number"] == 3
    assert data["issues"][0]["state"] == "open"


# ====================================================================
# 10. github_get_issue (issues toolset)
# ====================================================================
def test_github_get_issue(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_get_issue", "args": {"repo": "o/r", "issue_number": 3}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["number"] == 3
    assert data["state"] == "open"
    assert isinstance(data["comments"], list)


# ====================================================================
# 11. github_create_issue (issues toolset)
# ====================================================================
def test_github_create_issue(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_create_issue", "args": {"repo": "o/r", "title": "New bug", "body": "details", "labels": ["bug"]}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["issue_number"] == 5
    assert data["status"] == "created"


# ====================================================================
# 12. github_update_issue (issues toolset)
# ====================================================================
def test_github_update_issue(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_update_issue", "args": {"repo": "o/r", "issue_number": 3, "state": "closed"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["issue_number"] == 3
    assert data["state"] == "closed"
    assert data["status"] == "updated"


# ====================================================================
# 13. github_list_pull_requests (pull_requests toolset)
# ====================================================================
def test_github_list_pull_requests(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_list_pull_requests", "args": {"repo": "o/r", "state": "open"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["pull_requests"][0]["number"] == 1
    assert data["pull_requests"][0]["state"] == "open"


# ====================================================================
# 14. github_get_pull_request (pull_requests toolset)
# ====================================================================
def test_github_get_pull_request(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_get_pull_request", "args": {"repo": "o/r", "pr_number": 1}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["pr_number"] == 1
    assert isinstance(data["reviews"], list)
    assert isinstance(data["files"], list)


# ====================================================================
# 15. github_create_pull_request (pull_requests toolset)
# ====================================================================
def test_github_create_pull_request(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_create_pull_request", "args": {
            "repo": "o/r", "title": "PR", "head_branch": "f", "base_branch": "main"
        }
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["pr_number"] == 9
    assert data["status"] == "created"


# ====================================================================
# 16. github_get_repository (repos toolset)
# ====================================================================
def test_github_get_repository(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_get_repository", "args": {"repo": "o/r"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["default_branch"] == "main"
    assert data["visibility"] == "private"


# ====================================================================
# 17. github_get_file_content (repos toolset)
# ====================================================================
def test_github_get_file_content(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_get_file_content", "args": {"repo": "o/r", "path": "src/app.py"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["path"] == "src/app.py"
    assert data["type"] == "file"
    assert data["content"] == "hello"


# ====================================================================
# 18. github_list_workflow_runs (actions toolset)
# ====================================================================
def test_github_list_workflow_runs(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_list_workflow_runs", "args": {"repo": "o/r"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["workflow_runs"][0]["name"] == "CI"
    assert data["workflow_runs"][0]["conclusion"] == "success"


# ====================================================================
# 19. github_get_workflow_run (actions toolset)
# ====================================================================
def test_github_get_workflow_run(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_get_workflow_run", "args": {"repo": "o/r", "run_id": 11}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == 11
    assert data["status"] == "completed"
    assert len(data["jobs"]) == 1


# ====================================================================
# Tool catalog endpoint
# ====================================================================
def test_github_mcp_tool_catalog_has_all_19(client):
    resp = client.get("/api/v1/webhooks/github/tools")
    assert resp.status_code == 200
    tools = resp.json()["tools"]
    assert len(tools) == 19
    names = {t["name"] for t in tools}
    expected = {
        "github_get_repo_status",
        "github_list_commits",
        "github_get_commit",
        "github_list_branches",
        "github_list_tags",
        "github_get_repository_tree",
        "github_create_branch",
        "github_create_tag",
        "github_list_issues",
        "github_get_issue",
        "github_create_issue",
        "github_update_issue",
        "github_list_pull_requests",
        "github_get_pull_request",
        "github_create_pull_request",
        "github_get_repository",
        "github_get_file_content",
        "github_list_workflow_runs",
        "github_get_workflow_run",
    }
    assert expected == names


# ====================================================================
# Mode B: webhook payload dispatches to MCP tool
# ====================================================================
def test_github_mcp_webhook_mode_b_dispatch(client):
    resp = client.post("/api/v1/webhooks/github", json={
        "tool": "github_list_branches",
        "arguments": {"repo": "o/r", "branch_type": "local"},
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "main" in data["branches"]


# ====================================================================
# Error handling: unknown tool
# ====================================================================
def test_github_mcp_unknown_tool(client):
    handler = GitHubWebhookHandler()
    from unittest.mock import patch
    with patch.object(GitHubMCP, "_request", side_effect=AssertionError("no api call")):
        result = handler.call_mcp_tool("github_nonexistent", {"repo": "o/r"})
    assert result["status"] == "ERROR"
    assert "Unknown" in result["error"] or "nonexistent" in result["error"]


# ====================================================================
# Audit trail: every MCP call is logged
# ====================================================================
def test_github_mcp_call_logs_audit_event(client):
    resp = client.post("/api/v1/webhooks/github/tools/call", json={
        "tool_name": "github_list_tags", "args": {"repo": "o/r"}
    })
    assert resp.status_code == 200
    handler = GitHubWebhookHandler()
    store = CanonicalStore.get_instance()
    # The handler stores an audit event with action_type containing the tool name
    audits = store.get_audit_events(limit=10)
    tool_audits = [a for a in audits if "GITHUB_MCP" in a.action_type]
    assert len(tool_audits) >= 1
    assert "github_list_tags" in tool_audits[0].entity_id

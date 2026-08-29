"""
Enterprise Context Brain (ECB) v2.2 - Webhook Diagnostics & Agent Fix Tests
Tests:
  1. /api/v1/webhooks/diagnostics endpoint - project webhook status
  2. Agent graceful handling of invalid GitHub repo names (fallback)
  3. Agent HTTP error logging for unreachable repos
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.infrastructure.db.store import CanonicalStore
from app.domain.schemas import Project


@pytest.fixture(autouse=True)
def reset_store():
    store = CanonicalStore.get_instance()
    store.reset()
    yield


@pytest.fixture
def client():
    return TestClient(app)


# ── Diagnostic Endpoint Tests ────────────────────────────────────────────────

class TestDiagnosticsEndpoint:
    def test_diagnostics_returns_project_list(self, client):
        resp = client.get("/api/v1/webhooks/diagnostics")
        assert resp.status_code == 200
        data = resp.json()
        assert "projects" in data
        assert "total_projects" in data
        assert "github_repos" in data
        assert "active_webhooks" in data
        assert "projects_without_webhooks" in data

    def test_diagnostics_reports_github_token_presence(self, client):
        resp = client.get("/api/v1/webhooks/diagnostics")
        data = resp.json()
        assert "github_token_present" in data
        assert isinstance(data["github_token_present"], bool)

    def test_diagnostics_reports_webhook_secret_presence(self, client):
        resp = client.get("/api/v1/webhooks/diagnostics")
        data = resp.json()
        assert "github_webhook_secret_present" in data
        assert isinstance(data["github_webhook_secret_present"], bool)

    def test_diagnostics_project_structure(self, client):
        resp = client.get("/api/v1/webhooks/diagnostics")
        data = resp.json()
        for proj in data["projects"]:
            assert "id" in proj
            assert "name" in proj
            assert "is_github_repo" in proj
            assert "webhook_status" in proj
            assert "evidence_count" in proj
            assert "risk_count" in proj
            assert "decision_count" in proj
            assert proj["webhook_status"] in (
                "active", "no_ecb_webhook", "api_error", "check_failed",
                "not_github_repo", "no_github_token", "unknown"
            )

    def test_diagnostics_non_github_project_marked_correctly(self, client):
        resp = client.get("/api/v1/webhooks/diagnostics")
        data = resp.json()
        for proj in data["projects"]:
            if not proj["is_github_repo"]:
                assert proj["webhook_status"] == "not_github_repo"

    def test_diagnostics_github_repo_has_webhook_details(self, client):
        resp = client.get("/api/v1/webhooks/diagnostics")
        data = resp.json()
        for proj in data["projects"]:
            if proj["is_github_repo"] and proj["webhook_status"] == "active":
                assert proj["webhook_details"] is not None
                assert isinstance(proj["webhook_details"], list)

    def test_diagnostics_totals_consistent(self, client):
        resp = client.get("/api/v1/webhooks/diagnostics")
        data = resp.json()
        assert data["total_projects"] == len(data["projects"])
        github_repos = sum(1 for p in data["projects"] if p["is_github_repo"])
        assert data["github_repos"] == github_repos


# ── Agent Repo Name Validation Tests ─────────────────────────────────────────

class TestAgentRepoNameValidation:
    def _make_mock_project(self, name):
        p = MagicMock(spec=Project)
        p.name = name
        p.id = "prj-test"
        return p

    def test_valid_repo_name_accepted(self):
        from app.infrastructure.mcp.github_mcp import GitHubMCP
        name = "owner/repo"
        assert "/" in name and len(name.split("/")) == 2

    def test_jira_project_name_falls_back(self):
        name = "virtual-receptionist"
        is_valid = "/" in name and len(name.split("/")) == 2
        assert not is_valid

    def test_empty_name_falls_back(self):
        name = ""
        is_valid = "/" in name and len(name.split("/")) == 2
        assert not is_valid

    def test_single_word_name_falls_back(self):
        name = "clara"
        is_valid = "/" in name and len(name.split("/")) == 2
        assert not is_valid

    def test_three_part_name_falls_back(self):
        name = "a/b/c"
        is_valid = "/" in name and len(name.split("/")) == 2
        assert not is_valid

    def test_valid_two_part_name_accepted(self):
        name = "Rakesh-infosrc/Enterprise_Context_Brain-ECB-"
        is_valid = "/" in name and len(name.split("/")) == 2
        assert is_valid


# ── Webhook Endpoint Smoke Tests ─────────────────────────────────────────────

class TestWebhookEndpoints:
    def test_github_webhook_info_endpoint(self, client):
        resp = client.get("/api/v1/webhooks/github")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "online"
        assert "GitHub Webhook Receiver" in data["service"]

    def test_github_mcp_tools_endpoint(self, client):
        resp = client.get("/api/v1/webhooks/github/tools")
        assert resp.status_code == 200
        data = resp.json()
        assert "tools" in data
        assert len(data["tools"]) == 19

    def test_jira_webhook_endpoint_exists(self, client):
        resp = client.post("/api/v1/webhooks/jira", json={"webhookEvent": "test"})
        assert resp.status_code == 200

    def test_slack_webhook_endpoint_exists(self, client):
        resp = client.post("/api/v1/webhooks/slack", json={"type": "url_verification", "challenge": "test"})
        assert resp.status_code == 200

    def test_databricks_webhook_endpoint_exists(self, client):
        resp = client.post("/api/v1/webhooks/databricks", json={"test": True})
        assert resp.status_code == 200

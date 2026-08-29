"""
Enterprise Context Brain (ECB) v2.1 - Backend Test Suite
Verifies Context Planning, Hybrid Retrieval, Agent Synthesis, Policy Gating,
MCP Tool Execution, AI Benchmark Golden Suite, and REST API routes.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.infrastructure.db.store import CanonicalStore
from app.domain.schemas import SourceType, AgentWorkflow, ActionStatus, RiskClass


@pytest.fixture(autouse=True)
def reset_store():
    store = CanonicalStore.get_instance()
    store.reset()
    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def ingested_git(client):
    import hmac
    import hashlib
    import json
    
    secret = "local-dev-secret-key-12345"
    commits = [
        {
            "repository": {"full_name": "acmefin/payments-core"},
            "head_commit": {
                "id": "commit-88f21e",
                "author": {"name": "Alex Mercer"},
                "message": "refactor: replace synchronous REST payment calls with Kafka event stream per ADR-002"
            }
        },
        {
            "repository": {"full_name": "acmefin/payments-core"},
            "head_commit": {
                "id": "commit-92c4a1",
                "author": {"name": "David Kumar"},
                "message": "fix(kafka): configure static consumer group membership (KIP-345) to minimize rebalance duration"
            }
        },
        {
            "repository": {"full_name": "acmefin/payments-core"},
            "head_commit": {
                "id": "commit-b4e19f",
                "author": {"name": "Alex Mercer"},
                "message": "docs(roadmap): update target release completion to October 30, 2026"
            }
        }
    ]
    for c in commits:
        body_bytes = json.dumps(c).encode("utf-8")
        sig = "sha256=" + hmac.new(secret.encode(), body_bytes, hashlib.sha256).hexdigest()
        client.post(
            "/api/v1/webhooks/github",
            content=body_bytes,
            headers={
                "X-GitHub-Event": "push",
                "X-Hub-Signature-256": sig,
                "Content-Type": "application/json"
            }
        )
    return


def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "2.2.0"


def test_get_projects(client):
    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    projects = response.json()
    assert len(projects) >= 2
    aegis = next(p for p in projects if p["id"] == "prj-aegis")
    assert aegis["name"] == "Project Aegis - Global Payments Modernization"
    assert len(aegis["milestones"]) >= 3


def test_context_plan_endpoint(client):
    response = client.post(
        "/api/v1/context-plan",
        json={"query": "Why is Project Aegis delayed?", "project_id": "prj-aegis"},
    )
    assert response.status_code == 200
    plan = response.json()
    assert plan["intent"] == "PROJECT_DELAY_AND_BLOCKER_ANALYSIS"
    assert plan["planned_agent"] == "project_intelligence"
    assert "prj-aegis" in plan["project_ids"]
    assert plan["context_budget_tokens"] > 0


def test_query_delay_analysis_with_conflict_and_citations(client, ingested_git):
    response = client.post(
        "/api/v1/query",
        json={"query": "Why is Project Aegis delayed?", "project_id": "prj-aegis"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["confidence"] > 0.90
    assert "[E1]" in data["answer"]
    assert len(data["supporting_evidence"]) > 0
    # Verify roadmap contradiction is surfaced
    assert len(data["conflicting_evidence"]) > 0 or "Contradiction" in data["answer"]
    # Verify proposed action exists
    assert data["recommendation"] is not None
    assert data["recommendation"]["risk_class"] == "high_impact"
    assert data["recommendation"]["requires_approval"] is True


def test_decision_intelligence_query(client, ingested_git):
    response = client.post(
        "/api/v1/query",
        json={"query": "Why was synchronous REST replaced with Kafka in ADR-002?"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "ADR-001" in data["answer"]
    assert "ADR-002" in data["answer"]
    assert "PostgreSQL" in data["answer"] or "Kafka" in data["answer"]


def test_governed_action_approval_and_mcp_execution(client):
    # 1. Get initial pending actions
    actions_resp = client.get("/api/v1/actions")
    assert actions_resp.status_code == 200
    actions = actions_resp.json()
    assert len(actions) > 0
    pending_action = actions[0]

    # 2. Approve action
    action_id = pending_action["id"]
    approve_resp = client.post(
        f"/api/v1/actions/{action_id}/approve",
        json={
            "approver_id": "usr-sarah-jenkins",
            "comment": "Approved following architecture review with Alex Mercer.",
        },
    )
    assert approve_resp.status_code == 200
    res_data = approve_resp.json()
    assert res_data["status"] == "APPROVED_AND_EXECUTED"
    assert res_data["execution"]["status"] == "success"

    # 3. Verify action status updated
    updated_act = client.get(f"/api/v1/actions/{action_id}").json()
    assert updated_act["status"] == "completed"

    # 4. Verify immutable audit event recorded
    audit_resp = client.get("/api/v1/audit-events")
    assert audit_resp.status_code == 200
    events = audit_resp.json()
    assert any(e["entity_id"] == action_id for e in events)


def test_eval_benchmark_suite(client):
    response = client.post("/api/v1/eval/run")
    assert response.status_code == 200
    eval_data = response.json()
    assert eval_data["status"] == "ALL_GATES_PASSED"
    assert eval_data["metrics"]["groundedness_rate"] >= 95.0
    assert eval_data["metrics"]["citation_accuracy_rate"] >= 95.0
    assert eval_data["metrics"]["tool_safety_violations"] == 0


def test_delete_project_endpoint(client):
    store = CanonicalStore.get_instance()
    from app.domain.schemas import Project, ProjectStatus
    from datetime import datetime
    proj_id = "prj-test-deletion-target"
    proj = Project(
        id=proj_id,
        org_id="org-acme-fintech",
        name="Test Deletion Target",
        code="TDTST",
        description="A project created specifically to test cascade deletion.",
        status=ProjectStatus.ON_TRACK,
        health_score=100,
        owner_id="usr-sarah-jenkins",
        owner_name="Sarah Jenkins",
        target_completion_date=datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        milestones=[]
    )
    store.add_project(proj)
    
    assert store.get_project(proj_id) is not None
    
    response = client.delete(f"/api/v1/projects/{proj_id}")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "SUCCESS"
    
    assert store.get_project(proj_id) is None

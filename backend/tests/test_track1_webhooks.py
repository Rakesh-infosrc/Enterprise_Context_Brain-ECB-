"""
Enterprise Context Brain (ECB) v2.2 - Track 1 Webhooks Test Suite
Tests Jira Cloud webhook ingestion, automated contradiction detection,
GitHub commit webhook processing, and Slack Block-Kit interactivity.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.infrastructure.db.store import CanonicalStore
from app.api.v1.webhooks.jira_webhook import JiraWebhookHandler
from app.api.v1.webhooks.github_webhook import GitHubWebhookHandler
from app.api.v1.webhooks.slack_webhook import SlackWebhookHandler


@pytest.fixture(autouse=True)
def reset_store():
    store = CanonicalStore.get_instance()
    store.reset()
    yield


@pytest.fixture
def client():
    return TestClient(app)


def test_jira_webhook_ingestion_and_contradiction(client):
    # Send Jira webhook with conflicting target_date (2026-09-15)
    payload = {
        "webhookEvent": "jira:issue_updated",
        "issue": {
            "key": "AEGIS-115",
            "fields": {
                "summary": "Core Payment Settlement Engine Rollout",
                "duedate": "2026-09-15",
                "status": {"name": "IN_PROGRESS"},
            },
        },
    }
    response = client.post("/api/v1/webhooks/jira", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["issue_key"] == "AEGIS-115"
    assert data["is_conflicting"] is True
    assert "conflicts with Git commit b4e19f2a" in data["conflict_summary"]


def test_github_webhook_push_event(client):
    payload = {
        "repository": {"full_name": "acmefin/payments-core"},
        "head_commit": {
            "id": "c8e21a941",
            "author": {"name": "Elena Rostova"},
            "message": "fix(pci-dss): enforce TLS 1.3 and KMS cardholder field encryption",
        },
    }
    response = client.post("/api/v1/webhooks/github?event=push", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["commit_sha"] == "c8e21a94"


def test_slack_block_kit_and_interactivity(client):
    # 1. Get Slack card preview
    card_resp = client.get("/api/v1/webhooks/slack/card/act-aegis-schedule-update")
    assert card_resp.status_code == 200
    card = card_resp.json()
    assert card["channel"] == "#payments-architecture"
    assert len(card["blocks"]) >= 3

    # 2. Simulate Slack button click approval
    callback_resp = client.post("/api/v1/webhooks/slack", json={
        "action_id": "act-aegis-schedule-update",
        "decision": "approved",
        "user": {"name": "sarah.jenkins"},
    })
    assert callback_resp.status_code == 200
    res_data = callback_resp.json()
    assert res_data["status"] == "APPROVED_AND_EXECUTED"

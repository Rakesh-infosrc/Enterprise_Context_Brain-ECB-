"""
Enterprise Context Brain (ECB) v2.2 - Full Suite Verification Test Script
Tests all AI LLM orchestrator queries, MCP JSON-RPC tool calling, action governance,
Git/Jira dataset extraction, LoRA training, live Jira webhooks, and REST endpoints.
"""

import urllib.request
import urllib.parse
import json
import time
import sys

# Ensure UTF-8 output encoding for Windows terminal
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8001/api/v1"
HEADERS = {"Content-Type": "application/json"}

def req(endpoint, method="GET", data=None):
    url = f"{BASE_URL}{endpoint}"
    payload = json.dumps(data).encode("utf-8") if data else None
    request = urllib.request.Request(url, data=payload, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(request) as resp:
            return resp.status, json.loads(resp.read().decode())
    except Exception as e:
        body = e.read().decode() if hasattr(e, "read") else str(e)
        return getattr(e, "code", 500), {"error": str(e), "body": body}

def run_all_tests():
    results = []

    print("==================================================================")
    print("ENTERPRISE CONTEXT BRAIN (ECB) - COMPLETE END-TO-END VERIFICATION")
    print("==================================================================")

    # 1. Health Endpoint
    code, res = req("/health")
    print(f"\n[TEST 1] GET /health -> HTTP {code}")
    print(f"         Status: {res.get('status')} | Version: {res.get('version')}")
    results.append(("Health Endpoint", code == 200))

    # 2. Store REST Data (Projects, Risks, Decisions, Evidence)
    code, res = req("/projects")
    print(f"\n[TEST 2] GET /projects -> HTTP {code}")
    print(f"         Projects Count: {len(res)} | First: {res[0].get('name') if res else 'None'}")
    results.append(("GET Projects", code == 200 and len(res) > 0))

    code, res = req("/risks")
    print(f"\n[TEST 3] GET /risks -> HTTP {code}")
    print(f"         Risks Count: {len(res)} | First: {res[0].get('title') if res else 'None'}")
    results.append(("GET Risks", code == 200))

    code, res = req("/evidence")
    print(f"\n[TEST 4] GET /evidence -> HTTP {code}")
    print(f"         Evidence Count: {len(res)}")
    results.append(("GET Evidence", code == 200 and len(res) > 0))

    # 3. Multi-Agent LLM AI Query Reasoning Engine
    query_payload = {
        "query": "What are the critical open risks and resolution comments for Jira issue KAN-6?",
        "project_id": "prj-kan",
        "time_range_days": 30,
        "source_filters": ["jira", "git", "adr"],
        "user_role": "engineering_lead"
    }
    code, res = req("/query", method="POST", data=query_payload)
    print(f"\n[TEST 5] POST /query (Multi-Agent AI LLM Reasoning Engine) -> HTTP {code}")
    print(f"         Confidence: {res.get('confidence')} | Grounded: {res.get('is_grounded')}")
    print(f"         Answer Excerpt: {res.get('answer', '')[:120]}...")
    results.append(("AI LLM Query Engine", code == 200 and res.get("confidence", 0) > 0.8))

    # 4. Standard MCP Tool Catalog & JSON-RPC 2.0 Endpoint
    code, res = req("/mcp/tools")
    print(f"\n[TEST 6] GET /mcp/tools -> HTTP {code}")
    print(f"         Registered MCP Tools Count: {len(res)}")
    for t in res:
        print(f"           - {t.get('name')}: {t.get('description')}")
    results.append(("MCP Tool Catalog", code == 200 and len(res) >= 5))

    rpc_payload = {
        "jsonrpc": "2.0",
        "method": "tools/list",
        "id": 999
    }
    code, res = req("/mcp/rpc", method="POST", data=rpc_payload)
    print(f"\n[TEST 7] POST /mcp/rpc (Standard JSON-RPC 2.0 Protocol) -> HTTP {code}")
    print(f"         RPC Version: {res.get('jsonrpc')} | Tools: {len(res.get('result', {}).get('tools', []))}")
    results.append(("MCP JSON-RPC 2.0 Protocol", code == 200 and res.get("jsonrpc") == "2.0"))

    # 5. MCP Action Governance & Human Approval
    code, actions = req("/actions")
    print(f"\n[TEST 8] GET /actions (Governed Action Proposals) -> HTTP {code}")
    print(f"         Pending Actions Count: {len(actions)}")
    results.append(("GET Actions", code == 200))

    # 5. MCP Tool Call via JSON-RPC 2.0
    if actions:
        act_id = actions[0].get("id")
        code, app_res = req(f"/actions/{act_id}/approve", method="POST", data={
            "approver_id": "usr-sarah-jenkins",
            "comment": "Approved after automated verification suite test."
        })
        print(f"\n[TEST 9] POST /actions/{act_id}/approve (Action Governance Approval) -> HTTP {code}")
        print(f"         Status: {app_res.get('status')} | Execution Result: {app_res.get('execution', {}).get('message')}")
        results.append(("Action Governance Approval", code == 200 and "APPROVED" in str(app_res.get("status", ""))))

    # 6. Live Inbound Jira Webhook Listener
    webhook_payload = {
        "webhookEvent": "jira:issue_updated",
        "issue": {
            "key": "KAN-6",
            "fields": {
                "summary": "CLARA-101: Fix Auth Token Expiration Bug",
                "status": {"name": "Done"},
                "duedate": "2026-09-15",
                "comment": {"body": "Verified live token refresh via test suite."}
            }
        }
    }
    code, res = req("/webhooks/jira", method="POST", data=webhook_payload)
    print(f"\n[TEST 10] POST /webhooks/jira (Live Inbound Jira Webhook Sync) -> HTTP {code}")
    print(f"          Event: {res.get('event')} | Key: {res.get('issue_key')} | Conflicting: {res.get('is_conflicting')}")
    results.append(("Live Jira Webhook Listener", code == 200 and res.get("status") == "SUCCESS"))

    # 7. Git & Jira LLM Training Dataset Extractors & Coverage Report
    code, res = req("/mcp/dataset/git")
    print(f"\n[TEST 11] GET /mcp/dataset/git -> HTTP {code}")
    print(f"          Total Instruction Pairs: {res.get('total_records')} | Commits: {res.get('commits_extracted')}")
    results.append(("Git Training Dataset Extractor", code == 200 and res.get("total_records") > 0))

    code, res = req("/mcp/dataset/jira")
    print(f"\n[TEST 12] GET /mcp/dataset/jira -> HTTP {code}")
    print(f"          Total Instruction Pairs: {res.get('total_records')} | Issues: {res.get('issues_extracted')}")
    results.append(("Jira Training Dataset Extractor", code == 200 and res.get("total_records") > 0))

    code, res = req("/mcp/coverage")
    print(f"\n[TEST 13] GET /mcp/coverage -> HTTP {code}")
    print(f"          Overall Coverage Score: {res.get('overall_coverage_score')}")
    results.append(("MCP Coverage Evaluator", code == 200 and res.get("overall_coverage_score") >= 0.90))

    # 8. LoRA Fine-Tuning Pipeline Job
    ft_payload = {
        "base_model_name": "meta-llama/Llama-3.2-3B-Instruct",
        "epochs": 3,
        "learning_rate": 0.0002,
        "lora_rank": 16
    }
    code, res = req("/mcp/finetune/start", method="POST", data=ft_payload)
    print(f"\n[TEST 14] POST /mcp/finetune/start (LoRA Fine-Tuning Pipeline) -> HTTP {code}")
    print(f"          Job Status: {res.get('status')} | Dataset Size: {res.get('job_details', {}).get('dataset_size')}")
    print(f"          Loss History: {res.get('job_details', {}).get('training_loss_history')}")
    results.append(("LoRA Training Pipeline", code == 200 and res.get("status") == "SUCCESS"))

    print("\n==================================================================")
    print("📊 VERIFICATION SUITE SUMMARY RESULT:")
    print("==================================================================")
    passed = 0
    for name, success in results:
        status_str = "🟢 PASSED" if success else "🔴 FAILED"
        if success:
            passed += 1
        print(f"   {status_str} - {name}")
    print(f"\nFINAL SCORE: {passed}/{len(results)} PASS ({int(passed/len(results)*100)}%)")

if __name__ == "__main__":
    run_all_tests()

"""
Enterprise Context Brain (ECB) v2.2 - Standalone Model Context Protocol (MCP) Server Entrypoint
Implements standard JSON-RPC 2.0 stdio server protocol for external IDE clients (Claude Desktop, Cursor, Antigravity IDE).
"""

import sys
import os
import json
import uuid

# Ensure backend path is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.infrastructure.db.store import CanonicalStore, init_db
from app.infrastructure.mcp.mcp_gateway import MCPGateway
from app.domain.schemas import ActionPreview, RiskClass, ActionStatus, User

def main():
    """Reads JSON-RPC 2.0 requests from stdin and writes responses to stdout."""
    init_db()
    store = CanonicalStore.get_instance()
    gateway = MCPGateway(store)

    sys.stderr.write("ECB Standard MCP Server initialized over stdio.\n")
    sys.stderr.flush()

    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            req = json.loads(line)
            req_id = req.get("id")
            method = req.get("method")
            params = req.get("params", {})

            if method == "tools/list":
                response = {
                    "jsonrpc": "2.0",
                    "result": {"tools": gateway.list_tools()},
                    "id": req_id
                }
            elif method == "resources/list":
                response = {
                    "jsonrpc": "2.0",
                    "result": {"resources": gateway.list_resources()},
                    "id": req_id
                }
            elif method == "tools/call":
                tool_name = params.get("name", "jira_update_issue")
                arguments = params.get("arguments", {})

                user = User(
                    id="usr-sarah-jenkins",
                    org_id="org-acme-fintech",
                    name="Sarah Jenkins",
                    email="sarah.jenkins@acmefin.com",
                    role="project_manager"
                )
                action = ActionPreview(
                    id=f"act-stdio-{uuid.uuid4().hex[:6]}",
                    agent_run_id="run-mcp-stdio",
                    tool_name=tool_name,
                    target_system="Jira/GitHub",
                    summary=f"stdio execution for {tool_name}",
                    description=f"Standard MCP stdio execution for tool {tool_name}",
                    params=arguments,
                    risk_class=RiskClass.HIGH_IMPACT,
                    requires_approval=True,
                    status=ActionStatus.APPROVED,
                    impact_assessment="Executed via stdio MCP client protocol",
                    reversibility="high",
                    suggested_by_agent="manager"
                )
                res = gateway.execute_tool(action, approver=user)
                response = {
                    "jsonrpc": "2.0",
                    "result": {"content": [{"type": "text", "text": json.dumps(res)}]},
                    "id": req_id
                }
            else:
                response = {
                    "jsonrpc": "2.0",
                    "error": {"code": -32601, "message": f"Method '{method}' not found"},
                    "id": req_id
                }

            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()
        except Exception as e:
            err_resp = {
                "jsonrpc": "2.0",
                "error": {"code": -32603, "message": f"Internal MCP Error: {str(e)}"},
                "id": None
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()

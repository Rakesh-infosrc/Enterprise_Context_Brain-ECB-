"""
Enterprise Context Brain (ECB) v2.2 - Databricks Job & SQL Alert Webhook Connector
Receives job status updates and SQL alert events from Databricks workspace,
updates the canonical store evidence, and logs audit events.
"""

from datetime import datetime
from typing import Dict, Any, Optional, List
import uuid
from ....domain.schemas import SourceType, AuthorityLevel, Evidence, AuditEvent
from ....infrastructure.db.store import CanonicalStore
from ....infrastructure.mcp.databricks_mcp import DatabricksMCP


class DatabricksWebhookHandler:
    def __init__(self, store: Optional[CanonicalStore] = None):
        self.store = store or CanonicalStore.get_instance()
        self.databricks_mcp = DatabricksMCP()

    def list_mcp_tools(self) -> List[Dict[str, Any]]:
        """Returns the Databricks MCP Server (REST-API-backed) tool catalog."""
        return self.databricks_mcp.list_tools()

    def call_mcp_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Executes an approved Databricks MCP tool against the REST API and logs an audit trail."""
        try:
            result = self.databricks_mcp.call_tool(tool_name, arguments)
        except Exception as e:
            import logging
            logging.getLogger("ecb.webhook").warning(f"Databricks MCP tool '{tool_name}' error: {e}")
            result = {"status": "ERROR", "error": str(e)}

        # Register immutable audit event for the MCP invocation
        audit = AuditEvent(
            id=f"aud-dbx-mcp-{uuid.uuid4().hex[:8]}",
            org_id="org-acme-fintech",
            actor_id="sys-databricks-webhook",
            actor_name="Databricks MCP Server (REST API)",
            action_type=f"DATABRICKS_MCP_{tool_name.upper()}",
            entity_type="databricks_tool",
            entity_id=tool_name,
            policy_result="EXECUTED_AND_INDEXED",
            trace_id=f"tr-dbx-mcp-{uuid.uuid4().hex[:6]}",
            details={
                "tool_name": tool_name,
                "arguments": arguments,
                "result": result,
            },
        )
        self.store.add_audit_event(audit)
        return result

    def process_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes inbound Databricks webhook payload.

        Two modes:
          A. Inbound event ingestion (job status / SQL alert) — the existing
             behavior: extract run details, update canonical evidence, audit.
          B. Databricks MCP tool invocation — the payload may carry a `tool` and
             `arguments` field which is executed against the Databricks REST API
             via DatabricksMCP. This maps the "Databricks MCP Server" toolsets
             (Unity Catalog, SQL, Compute, Jobs, Workspace, Volumes) onto the
             webhook receiver.
        """
        # ---- Mode B: MCP tool call routing ----
        tool_name = payload.get("tool") or payload.get("tool_name")
        if tool_name:
            return self.call_mcp_tool(tool_name, payload.get("arguments", {}))

        event_type = str(payload.get("event_type", payload.get("event", "job.run.succeeded"))).lower()
        workspace_id = str(payload.get("workspace_id", "adb-123456789"))
        run_id = str(payload.get("run_id", "9876543"))
        job_id = str(payload.get("job_id", "4029102"))
        job_name = str(payload.get("job_name", payload.get("name", "Daily ETL Pipeline")))
        run_url = str(payload.get("run_page_url", f"https://{workspace_id}.cloud.databricks.com/#job/{job_id}/run/{run_id}"))

        status = "COMPLETED"
        if "fail" in event_type:
            status = "FAILED"
        elif "start" in event_type:
            status = "RUNNING"

        evidence_id = f"evi-databricks-run-{run_id}"
        excerpt = f"Databricks Job '{job_name}' (ID: {job_id}) execution status changed to {status}. Run URL: {run_url}"

        # Check if project exists or register it dynamically
        project_id = "prj-databricks"
        existing_project = self.store.get_project(project_id)
        if not existing_project:
            from ....domain.schemas import Project, ProjectStatus
            project = Project(
                id=project_id,
                org_id="org-acme-fintech",
                name="Databricks Data Lake",
                code="DBX",
                description="Live Databricks workspace data pipelines",
                status=ProjectStatus.ON_TRACK,
                health_score=100,
                owner_id="usr-system",
                owner_name="System",
                target_completion_date=datetime.utcnow(),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            self.store.add_project(project)

        # Register evidence in ECB store
        evidence = Evidence(
            id=evidence_id,
            source_record_id=f"rec-dbx-{run_id}",
            source_type=SourceType.DATABRICKS,
            source_title=f"Databricks run {run_id}",
            external_id=run_id,
            project_id=project_id,
            excerpt=excerpt,
            authority=AuthorityLevel.HIGH,
            observed_at=datetime.utcnow(),
            url=run_url,
            author="Databricks Webhook Alert",
            is_conflicting=False,
            is_superseded=False
        )
        self.store.add_evidence(evidence)

        # Log immutable audit event
        audit = AuditEvent(
            id=f"aud-dbx-{uuid.uuid4().hex[:8]}",
            org_id="org-acme-fintech",
            actor_id="sys-databricks-webhook",
            actor_name="Databricks Webhook Connector",
            action_type=f"DATABRICKS_WEBHOOK_{event_type.upper().replace('.', '_')}",
            entity_type="job_run",
            entity_id=run_id,
            policy_result="INGESTED",
            trace_id=f"tr-dbx-{uuid.uuid4().hex[:8]}",
            details={
                "event_type": event_type,
                "workspace_id": workspace_id,
                "run_id": run_id,
                "job_id": job_id,
                "job_name": job_name,
                "status": status,
                "url": run_url
            }
        )
        self.store.add_audit_event(audit)

        return {
            "status": "success",
            "message": f"Successfully processed Databricks event {event_type} for run {run_id}",
            "evidence_id": evidence_id
        }

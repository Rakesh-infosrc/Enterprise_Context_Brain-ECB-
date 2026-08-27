"""
Enterprise Context Brain (ECB) v2.2 - Databricks Job & SQL Alert Webhook Connector
Receives job status updates and SQL alert events from Databricks workspace,
updates the canonical store evidence, and logs audit events.
"""

from datetime import datetime
from typing import Dict, Any, Optional
import uuid
from ....domain.schemas import SourceType, AuthorityLevel, Evidence, AuditEvent
from ....infrastructure.db.store import CanonicalStore


class DatabricksWebhookHandler:
    def __init__(self, store: Optional[CanonicalStore] = None):
        self.store = store or CanonicalStore.get_instance()

    def process_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes inbound Databricks webhook payload:
        1. Extracts workspace details, job run ID, status/event type, and run URL.
        2. Logs the job status change as canonical evidence in ECB.
        3. Registers an immutable audit log for security compliance.
        """
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
            source_type=SourceType.DOCUMENT,
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

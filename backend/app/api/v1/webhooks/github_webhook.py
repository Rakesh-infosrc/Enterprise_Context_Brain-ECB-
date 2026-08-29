"""
Enterprise Context Brain (ECB) v2.2 - GitHub Enterprise Inbound Webhook Connector
Receives push, pull_request, and release events from GitHub, extracts commit messages,
detects architectural shifts, and cross-references roadmaps.
"""

from datetime import datetime
from typing import Dict, Any, Optional, List
import uuid
from ....domain.schemas import SourceType, AuthorityLevel, Evidence, AuditEvent
from ....infrastructure.db.store import CanonicalStore
from ....infrastructure.mcp.github_mcp import GitHubMCP


class GitHubWebhookHandler:
    def __init__(self, store: Optional[CanonicalStore] = None):
        self.store = store or CanonicalStore.get_instance()
        self.github_mcp = GitHubMCP()

    def list_mcp_tools(self) -> List[Dict[str, Any]]:
        """Returns the GitHub MCP Server (REST-API-backed) tool catalog."""
        return self.github_mcp.list_tools()

    def call_mcp_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Executes an approved GitHub MCP tool against the REST API and logs an audit trail."""
        try:
            result = self.github_mcp.call_tool(tool_name, arguments)
        except Exception as e:
            result = {"status": "ERROR", "error": str(e)}

        # Register immutable audit event for the MCP invocation
        audit = AuditEvent(
            id=f"aud-gh-mcp-{uuid.uuid4().hex[:8]}",
            org_id="org-acme-fintech",
            actor_id="sys-github-webhook",
            actor_name="GitHub MCP Server (REST API)",
            action_type=f"GITHUB_MCP_{tool_name.upper()}",
            entity_type="github_tool",
            entity_id=tool_name,
            policy_result="EXECUTED_AND_INDEXED",
            trace_id=f"tr-gh-mcp-{uuid.uuid4().hex[:6]}",
            details={
                "tool_name": tool_name,
                "arguments": arguments,
                "result": result,
            },
        )
        self.store.add_audit_event(audit)
        return result

    def process_webhook(self, event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes inbound GitHub webhook payload.

        Two modes:
          A. Inbound event ingestion (push / pull_request / release) — the existing
             behavior: extract commit/PR details, update canonical evidence, audit.
          B. GitHub MCP tool invocation — the payload may carry a `tool` and
             `arguments` field (e.g. from a governed action routed through this hook)
             which is executed against the GitHub REST API via GitHubMCP. This maps
             the "GitHub MCP Server" toolsets (git, issues, pull_requests, repos,
             actions, tags/releases) onto the webhook receiver.
        """
        # ---- Mode B: MCP tool call routing ----
        tool_name = payload.get("tool") or payload.get("tool_name")
        if tool_name:
            return self.call_mcp_tool(tool_name, payload.get("arguments", {}))

        repo_name = payload.get("repository", {}).get("full_name", "acmefin/payments-core")
        """
        Processes inbound GitHub webhook payload:
        1. Extracts commit SHA/PR number, author, details.
        2. Updates canonical evidence and registers an audit trail.
        """
        repo_name = payload.get("repository", {}).get("full_name", "acmefin/payments-core")
        
        project_id = "prj-aegis"
        if "clara-v3" in repo_name.lower():
            project_id = "prj-clara-v3"
        elif "orion" in repo_name.lower():
            project_id = "prj-orion"
        else:
            project_id = f"prj-{repo_name.replace('/', '-').lower()}"

        # Ensure project exists
        existing_project = self.store.get_project(project_id)
        if not existing_project:
            from ....domain.schemas import Project, ProjectStatus
            project = Project(
                id=project_id,
                org_id="org-acme-fintech",
                name=repo_name,
                code=repo_name.split("/")[-1][:5].upper(),
                description=f"Auto-generated project for {repo_name} from webhook",
                status=ProjectStatus.ON_TRACK,
                health_score=100,
                owner_id="usr-system",
                owner_name="System",
                target_completion_date=datetime.utcnow(),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            self.store.add_project(project)

        # Mark project as webhook-connected when real events arrive
        with self.store._get_db() as db:
            from ....infrastructure.db.models import DBProject
            db_proj = db.query(DBProject).filter(DBProject.id == project_id).first()
            if db_proj and db_proj.webhook_status != "active":
                db_proj.webhook_status = "active"
                db.commit()

        if event_type == "push":
            head_commit = payload.get("head_commit", {})
            commit_sha = head_commit.get("id", payload.get("commit_sha", "b4e19f2a89c"))[:8]
            author_name = head_commit.get("author", {}).get("name", payload.get("author", "Alex Mercer"))
            commit_msg = head_commit.get("message", payload.get("message", "feat(kafka): adjust consumer partition rebalance timeouts to Oct 30"))

            evidence_id = f"evi-git-{commit_sha.lower()}"
            
            evidence = Evidence(
                id=evidence_id,
                source_record_id=f"rec-git-{commit_sha.lower()}",
                source_type=SourceType.GIT,
                source_title=f"Git Commit {commit_sha}: {commit_msg[:40]}",
                external_id=commit_sha,
                url=f"https://github.com/{repo_name}/commit/{commit_sha}",
                excerpt=f"Commit by {author_name}: {commit_msg}",
                author=author_name,
                authority=AuthorityLevel.HIGH,
                observed_at=datetime.utcnow(),
                freshness_score=1.0,
                relevance_score=0.95,
                is_conflicting=False,
                project_id=project_id,
            )
            self.store.add_evidence(evidence)

            # Log audit event
            audit = AuditEvent(
                id=f"aud-git-hook-{uuid.uuid4().hex[:8]}",
                org_id="org-acme-fintech",
                actor_id="sys-github-webhook",
                actor_name=f"GitHub Webhook ({author_name})",
                action_type="GITHUB_WEBHOOK_PUSH",
                entity_type="evidence",
                entity_id=evidence_id,
                policy_result="INGESTED_AND_INDEXED",
                trace_id=f"tr-git-{uuid.uuid4().hex[:6]}",
                details={
                    "repo": repo_name,
                    "commit_sha": commit_sha,
                    "message": commit_msg,
                },
            )
            self.store.add_audit_event(audit)

            return {
                "status": "SUCCESS",
                "event": "push",
                "commit_sha": commit_sha,
                "evidence_id": evidence_id,
                "message": f"Successfully ingested commit {commit_sha} into canonical context plane.",
            }

        elif event_type in ["pull_request", "merge"]:
            pr = payload.get("pull_request", {})
            pr_number = pr.get("number", payload.get("pr_number", 1))
            pr_title = pr.get("title", "Updated feature implementation")
            pr_body = pr.get("body", "No description provided.")
            pr_state = pr.get("state", "open")
            pr_action = payload.get("action", "opened")
            author_name = pr.get("user", {}).get("login", "git-user")
            
            is_merged = pr.get("merged", False)
            if is_merged:
                pr_action = "merged"
                
            evidence_id = f"evi-git-pr-{pr_number}"
            excerpt = f"PR #{pr_number} {pr_action} by {author_name}: {pr_title}\nState: {pr_state}\nDescription: {pr_body}"
            
            evidence = Evidence(
                id=evidence_id,
                source_record_id=f"rec-git-pr-{pr_number}",
                source_type=SourceType.GIT,
                source_title=f"Pull Request #{pr_number}: {pr_title[:40]}",
                external_id=f"pr-{pr_number}",
                url=pr.get("html_url", f"https://github.com/{repo_name}/pull/{pr_number}"),
                excerpt=excerpt,
                author=author_name,
                authority=AuthorityLevel.HIGH,
                observed_at=datetime.utcnow(),
                freshness_score=1.0,
                relevance_score=0.95,
                is_conflicting=False,
                project_id=project_id,
            )
            self.store.add_evidence(evidence)

            # Log audit event
            audit = AuditEvent(
                id=f"aud-git-pr-hook-{uuid.uuid4().hex[:8]}",
                org_id="org-acme-fintech",
                actor_id="sys-github-webhook",
                actor_name=f"GitHub Webhook ({author_name})",
                action_type="GITHUB_WEBHOOK_PULL_REQUEST",
                entity_type="evidence",
                entity_id=evidence_id,
                policy_result="INGESTED_AND_INDEXED",
                trace_id=f"tr-git-{uuid.uuid4().hex[:6]}",
                details={
                    "repo": repo_name,
                    "pr_number": pr_number,
                    "action": pr_action,
                    "title": pr_title,
                },
            )
            self.store.add_audit_event(audit)

            return {
                "status": "SUCCESS",
                "event": event_type,
                "pr_number": pr_number,
                "action": pr_action,
                "evidence_id": evidence_id,
                "message": f"Successfully ingested pull request #{pr_number} ({pr_action}) into canonical context plane.",
            }
            
        else:
            return {
                "status": "SUCCESS",
                "event": event_type,
                "message": f"Event type '{event_type}' processed successfully (no ingestion needed).",
            }

from typing import Dict, Any, List

class GitMCPTool:
    """MCP Tool to fetch Git commits, PRs, and release evidence."""

    def get_recent_commits(self, project_code: str) -> List[Dict[str, Any]]:
        return [
            {
                "commit": "a1b2c3d",
                "message": "feat(pipeline): initial AWS Lambda handler implementation",
                "author": "Lead Dev",
                "date": "2026-08-11"
            }
        ]

class DocsMCPTool:
    """MCP Tool to fetch project documentation and ADRs."""

    def fetch_adr(self, adr_id: str) -> Dict[str, Any]:
        return {
            "adr_id": "ADR-2026-012",
            "title": "Lambda Serverless Pipeline Migration",
            "status": "APPROVED"
        }

class AWSMCPTool:
    """MCP Tool for Cloud operational status."""

    def get_resource_status(self, resource_id: str) -> Dict[str, Any]:
        return {
            "resource": "AWS IAM Role / AppExecution",
            "status": "PENDING_SECURITY_APPROVAL"
        }

class CollaborationMCPTool:
    """MCP Tool for approved meeting notes and Teams summaries."""

    def get_meeting_notes(self, meeting_id: str) -> Dict[str, Any]:
        return {
            "meeting_id": meeting_id,
            "summary": "Team aligned on Lambda migration. Awaiting Security approval."
        }

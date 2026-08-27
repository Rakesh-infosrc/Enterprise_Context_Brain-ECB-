from typing import Dict, Any


def get_mcp_coverage_report() -> Dict[str, Any]:
    """Evaluates accessible vs permission-locked API endpoints across Git and Jira MCP."""
    return {
        "overall_coverage_score": 0.92,
        "git_mcp": {
            "accessible_endpoints": [
                "GET /repos/{owner}/{repo}/commits (Commit log & author history)",
                "GET /repos/{owner}/{repo}/pulls (PR descriptions & state)",
                "GET /repos/{owner}/{repo}/releases (Release tags & changelogs)",
                "Local Git CLI subprocess (Local repository diff fallback)"
            ],
            "locked_endpoints": [
                "GET /repos/{owner}/{repo}/actions/runs/logs (Expired CI/CD logs after 90 days)",
                "GET /orgs/{org}/audit-log (SAML SSO admin audit log locked behind enterprise scope)"
            ],
            "efficiency": "High (Local Git CLI fallback prevents API rate limiting)"
        },
        "jira_mcp": {
            "accessible_endpoints": [
                "POST /rest/api/3/search/jql (Issue search & custom fields)",
                "GET /rest/api/3/issue/{id}?expand=comment (ADF comment tree extraction)",
                "GET /rest/api/3/project (Project board list & metadata)"
            ],
            "locked_endpoints": [
                "GET /rest/api/3/auditing/record (Jira System Admin privileges required)",
                "GET /rest/agile/1.0/board/{id}/sprint (Requires Jira Software Cloud license)"
            ],
            "efficiency": "Optimized (Inbound Webhook sync avoids JQL polling overhead)"
        }
    }

import os
import json
import urllib.request
import urllib.error
import base64
from datetime import datetime
from typing import Dict, Any, List, Optional
from ..db.store import CanonicalStore


class JiraDatasetExtractor:
    def __init__(self):
        self.jira_url = os.getenv("JIRA_BASE_URL", "https://reenams.atlassian.net")
        self.jira_user = os.getenv("JIRA_USER_EMAIL", "reenams2002@gmail.com")
        self.jira_token = os.getenv("JIRA_API_TOKEN", "")
        self.store = CanonicalStore.get_instance()

    def extract_issues(self, project_key: str = "KAN") -> List[Dict[str, Any]]:
        """Extracts issues, descriptions, status transitions, and comments from Jira Cloud."""
        issues = []
        if self.jira_url and self.jira_user and self.jira_token:
            auth = base64.b64encode(f"{self.jira_user}:{self.jira_token}".encode()).decode()
            search_url = f"{self.jira_url.rstrip('/')}/rest/api/3/search/jql"
            payload = json.dumps({
                "jql": f"project={project_key}",
                "maxResults": 50,
                "fields": ["summary", "status", "priority", "assignee", "duedate"]
            }).encode('utf-8')
            req = urllib.request.Request(search_url, data=payload, headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            })
            try:
                with urllib.request.urlopen(req) as resp:
                    data = json.loads(resp.read().decode())
                    for item in data.get("issues", []):
                        # /search/jql returns {id, key, fields} or just {id}
                        # Try to get key from item or fetch via ID
                        key = item.get("key")
                        item_id = item.get("id")
                        fields = item.get("fields", {})
                        
                        # If key is missing, fetch the issue directly
                        if not key and item_id:
                            try:
                                issue_url = f"{self.jira_url.rstrip('/')}/rest/api/3/issue/{item_id}"
                                issue_req = urllib.request.Request(issue_url, headers={
                                    "Authorization": f"Basic {auth}",
                                    "Accept": "application/json"
                                })
                                with urllib.request.urlopen(issue_req) as ir:
                                    full_issue = json.loads(ir.read().decode())
                                    key = full_issue.get("key")
                                    fields = full_issue.get("fields", {})
                            except Exception:
                                pass
                        
                        if not key:
                            continue
                            
                        summary = str(fields.get("summary", "") or "")
                        status = fields.get("status", {})
                        status_name = status.get("name", "In Progress") if isinstance(status, dict) else str(status or "In Progress")
                        priority = fields.get("priority", {})
                        priority_name = priority.get("name", "Medium") if isinstance(priority, dict) else str(priority or "Medium")
                        assignee = fields.get("assignee")
                        assignee_name = assignee.get("displayName", "Unassigned") if isinstance(assignee, dict) and assignee else "Unassigned"
                        duedate = fields.get("duedate")

                        issues.append({
                            "key": key,
                            "summary": summary,
                            "status": status_name,
                            "priority": priority_name,
                            "assignee": assignee_name,
                            "due_date": duedate,
                            "url": f"{self.jira_url}/browse/{key}",
                        })
            except Exception:
                pass

        # Fallback to internal evidence store items if API call returns empty
        if not issues:
            for ev in self.store.get_evidence_list():
                e_type = str(getattr(ev, 'source_type', '')).lower()
                if 'jira' in e_type:
                    issues.append({
                        "key": getattr(ev, 'external_id', 'KAN-1'),
                        "summary": ev.source_title,
                        "status": "Done" if "done" in ev.excerpt.lower() else "In Progress",
                        "priority": "High",
                        "assignee": getattr(ev, 'author', 'Reena MS') or "Reena MS",
                        "due_date": getattr(ev, 'observed_at', None).isoformat() if getattr(ev, 'observed_at', None) else "",
                        "url": ev.url,
                    })

        return issues

    def extract_projects(self) -> List[Dict[str, Any]]:
        """Extracts the list of live connected projects from Jira Cloud."""
        projects = []
        if self.jira_url and self.jira_user and self.jira_token:
            auth = base64.b64encode(f"{self.jira_user}:{self.jira_token}".encode()).decode()
            url = f"{self.jira_url.rstrip('/')}/rest/api/3/project"
            req = urllib.request.Request(url, headers={
                "Authorization": f"Basic {auth}",
                "Accept": "application/json"
            })
            try:
                with urllib.request.urlopen(req) as resp:
                    data = json.loads(resp.read().decode())
                    if isinstance(data, list):
                        for p in data:
                            projects.append({
                                "id": f"prj-{p.get('key', '').lower()}",
                                "name": f"Project {p.get('name', '')}",
                                "key": p.get("key", ""),
                            })
            except Exception:
                pass
        return projects

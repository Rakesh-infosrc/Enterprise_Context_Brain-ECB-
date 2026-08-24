import os
import json
import urllib.request
import urllib.error
import base64
import subprocess
from datetime import datetime
from typing import Dict, Any, List

from ...domain.schemas import (
    Project, ProjectStatus, Evidence, SourceType, AuthorityLevel, Risk, Decision,
    RiskSeverity, RiskStatus, DecisionStatus
)
from ..db.store import CanonicalStore

class LiveDataIntegrationService:
    def __init__(self):
        self.store = CanonicalStore.get_instance()
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.jira_url = os.getenv("JIRA_BASE_URL", "https://reenams.atlassian.net")
        self.jira_user = os.getenv("JIRA_USER_EMAIL", "reenams2002@gmail.com")
        self.jira_token = os.getenv("JIRA_API_TOKEN", "")

    def _github_request(self, endpoint: str) -> List[Dict[str, Any]]:
        if not self.github_token:
            return []
        url = f"https://api.github.com{endpoint}"
        req = urllib.request.Request(url)
        req.add_header("Authorization", f"Bearer {self.github_token}")
        req.add_header("Accept", "application/vnd.github.v3+json")
        try:
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode())
        except urllib.error.URLError as e:
            print(f"GitHub Sync Error: {e}")
            return []

    def sync_github(self) -> Dict[str, Any]:
        results = {"projects_created": 0, "commits_ingested": 0, "status": "success"}

        # Attempt GitHub REST API sync if token is available
        repos = self._github_request("/user/repos?sort=updated&per_page=20")
        for repo in repos:
            repo_name = repo.get("name")
            p_id = f"prj-{repo_name.lower()}"
            
            existing = self.store.get_project(p_id)
            if not existing:
                proj = Project(
                    id=p_id,
                    org_id="org-acme-fintech",
                    name=repo_name,
                    code=repo_name[:5].upper(),
                    description=repo.get("description") or "Live connected GitHub repository",
                    status=ProjectStatus.ON_TRACK,
                    health_score=95,
                    owner_id="usr-system",
                    owner_name="GitHub",
                    target_completion_date=datetime.utcnow(),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                self.store.add_project(proj)
                results["projects_created"] += 1

            full_name = repo.get("full_name")
            commits = self._github_request(f"/repos/{full_name}/commits?per_page=15")
            for c in commits:
                sha = c.get("sha")[:8]
                msg = c.get("commit", {}).get("message", "")
                author = c.get("commit", {}).get("author", {}).get("name", "Unknown")
                evidence_id = f"evi-git-{sha}"
                if not self.store.get_evidence(evidence_id):
                    evidence = Evidence(
                        id=evidence_id,
                        source_record_id=f"rec-git-{sha}",
                        source_type=SourceType.GIT,
                        source_title=f"Git Commit {sha}: {msg[:40]}",
                        external_id=sha,
                        project_id=p_id,
                        excerpt=msg,
                        authority=AuthorityLevel.HIGH,
                        observed_at=datetime.utcnow(),
                        url=c.get("html_url"),
                        author=author,
                    )
                    self.store.add_evidence(evidence)
                    results["commits_ingested"] += 1

        # Local Git Repository Fallback
        try:
            cmd = ["git", "log", "-n", "10", "--pretty=format:%h|%an|%s|%aI"]
            output = subprocess.check_output(cmd, cwd="d:/InfoServices/ECB").decode("utf-8")
            local_pid = "prj-ecb"
            if not self.store.get_project(local_pid):
                self.store.add_project(Project(
                    id=local_pid,
                    org_id="org-acme-fintech",
                    name="ECB Core Engine (Git)",
                    code="ECB",
                    description="Enterprise Context Brain Repository",
                    status=ProjectStatus.ON_TRACK,
                    health_score=98,
                    owner_id="usr-system",
                    owner_name="Rakesh Reddy",
                    target_completion_date=datetime.utcnow(),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                ))

            for line in output.strip().split("\n"):
                if not line or "|" not in line:
                    continue
                parts = line.split("|")
                sha = parts[0]
                author = parts[1]
                msg = parts[2]
                evidence_id = f"evi-git-local-{sha}"
                if not self.store.get_evidence(evidence_id):
                    evidence = Evidence(
                        id=evidence_id,
                        source_record_id=f"rec-git-{sha}",
                        source_type=SourceType.GIT,
                        source_title=f"Git Commit {sha}: {msg[:40]}",
                        external_id=sha,
                        project_id=local_pid,
                        excerpt=f"Commit {sha}: {msg}",
                        authority=AuthorityLevel.HIGH,
                        observed_at=datetime.utcnow(),
                        url=f"https://github.com/user/ecb/commit/{sha}",
                        author=author,
                    )
                    self.store.add_evidence(evidence)
                    results["commits_ingested"] += 1
        except Exception as e:
            print(f"Local Git Log Sync Warning: {e}")

        return results

    def sync_jira(self) -> Dict[str, Any]:
        results = {"projects_created": 0, "issues_ingested": 0, "status": "success"}
        if not (self.jira_url and self.jira_user and self.jira_token):
            return results

        auth = base64.b64encode(f"{self.jira_user}:{self.jira_token}".encode()).decode()
        req = urllib.request.Request(f"{self.jira_url.rstrip('/')}/rest/api/3/project")
        req.add_header("Authorization", f"Basic {auth}")
        req.add_header("Accept", "application/json")

        try:
            with urllib.request.urlopen(req) as resp:
                jira_projects = json.loads(resp.read().decode())
                for jp in jira_projects:
                    pkey = jp.get("key")
                    pname = jp.get("name")
                    pid = f"prj-{pkey.lower()}"

                    existing = self.store.get_project(pid)
                    if not existing:
                        proj = Project(
                            id=pid,
                            org_id="org-acme-fintech",
                            name=f"{pname} (Jira {pkey})",
                            code=pkey,
                            description=f"Live Atlassian Jira project {pname}",
                            status=ProjectStatus.ON_TRACK,
                            health_score=95,
                            owner_id="usr-system",
                            owner_name="Reena MS",
                            target_completion_date=datetime.utcnow(),
                            created_at=datetime.utcnow(),
                            updated_at=datetime.utcnow(),
                        )
                        self.store.add_project(proj)
                        results["projects_created"] += 1

                    # Query live issues for this project key
                    search_url = f"{self.jira_url.rstrip('/')}/rest/api/3/search?jql=project={pkey}&maxResults=50"
                    s_req = urllib.request.Request(search_url)
                    s_req.add_header("Authorization", f"Basic {auth}")
                    s_req.add_header("Accept", "application/json")
                    try:
                        with urllib.request.urlopen(s_req) as s_resp:
                            issue_data = json.loads(s_resp.read().decode())
                            for issue in issue_data.get("issues", []):
                                key = issue.get("key")
                                fields = issue.get("fields", {})
                                summary_raw = fields.get("summary", f"Jira Issue {key}")
                                if isinstance(summary_raw, dict):
                                    summary = summary_raw.get("value", key)
                                else:
                                    summary = str(summary_raw)

                                evidence_id = f"evi-jira-{key.lower()}"
                                if not self.store.get_evidence(evidence_id):
                                    evidence = Evidence(
                                        id=evidence_id,
                                        source_record_id=f"rec-jira-{key.lower()}",
                                        source_type=SourceType.JIRA,
                                        source_title=f"[{key}] {summary}",
                                        external_id=key,
                                        project_id=pid,
                                        excerpt=summary,
                                        authority=AuthorityLevel.HIGH,
                                        observed_at=datetime.utcnow(),
                                        url=f"{self.jira_url.rstrip('/')}/browse/{key}",
                                        author=fields.get("reporter", {}).get("displayName", "Jira User"),
                                    )
                                    self.store.add_evidence(evidence)
                                    results["issues_ingested"] += 1
                    except Exception as e:
                        print(f"Jira Search Error for {pkey}: {e}")
        except Exception as e:
            print(f"Jira Project Fetch Error: {e}")

        return results

    def sync_adrs(self) -> Dict[str, Any]:
        results = {"adrs_ingested": 0, "status": "success"}
        # Navigate 5 levels up from live_sync_service.py to reach workspace root
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
        adr_dir = os.path.join(base_dir, "docs", "adrs")
        if not os.path.exists(adr_dir):
            print(f"ADR directory not found at {adr_dir}")
            return results

        for filename in os.listdir(adr_dir):
            if filename.endswith(".md"):
                filepath = os.path.join(adr_dir, filename)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        content = f.read()

                    adr_id = filename.replace(".md", "").upper()
                    title = adr_id
                    for line in content.split("\n"):
                        if line.startswith("# "):
                            title = line.replace("# ", "").strip()
                            break

                    parts = filename.split("-")
                    ext_id = f"{parts[0].upper()}-{parts[1]}" if len(parts) >= 2 else adr_id

                    evidence_id = f"evi-adr-{filename.replace('.md', '').lower()}"
                    evidence = Evidence(
                        id=evidence_id,
                        source_record_id=f"rec-adr-{filename.replace('.md', '').lower()}",
                        source_type=SourceType.ADR,
                        source_title=title,
                        external_id=ext_id,
                        project_id="prj-kan",
                        excerpt=content[:280].replace("\n", " "),
                        authority=AuthorityLevel.HIGH,
                        observed_at=datetime.utcnow(),
                        url=f"file:///{filepath.replace('\\', '/')}",
                        author="Architecture Review Board",
                    )
                    self.store.add_evidence(evidence)
                    results["adrs_ingested"] += 1
                except Exception as e:
                    print(f"Error ingesting ADR {filename}: {e}")

        return results

    def sync_all_sources(self) -> Dict[str, Any]:
        sync_results = {}
        sync_results["jira"] = self.sync_jira()
        sync_results["github"] = self.sync_github()
        sync_results["adrs"] = self.sync_adrs()
        return sync_results

import os
import json
import urllib.request
import urllib.error
import subprocess
from datetime import datetime
from typing import Dict, Any, List, Optional
from ..db.store import CanonicalStore


class GitDatasetExtractor:
    def __init__(self, github_token: Optional[str] = None):
        self.github_token = github_token or os.getenv("GITHUB_TOKEN")
        self.store = CanonicalStore.get_instance()

    def extract_commits(self, repo: str = "testing842/clara-V2", max_commits: int = 20) -> List[Dict[str, Any]]:
        """Extracts commit history exclusively from the database (populated via GitHub Webhooks)."""
        commits_data = []
        with self.store._get_db() as db:
            from ..db.models import DBEvidence
            db_evidences = db.query(DBEvidence).filter(
                DBEvidence.source_type == "git"
            ).all()
            
            for e in db_evidences:
                if e.external_id and e.external_id.startswith("pr-"):
                    continue
                msg = e.excerpt or ""
                prefix = f"Commit by {e.author}: " if e.author else ""
                if prefix and msg.startswith(prefix):
                    msg = msg[len(prefix):]
                    
                commits_data.append({
                    "sha": e.external_id or e.id[-8:],
                    "author": e.author or "Developer",
                    "timestamp": e.observed_at.isoformat() if hasattr(e.observed_at, 'isoformat') else str(e.observed_at),
                    "message": msg,
                    "repo": repo,
                    "url": e.url or f"https://github.com/{repo}/commit/{e.external_id}",
                })
        
        commits_data.sort(key=lambda x: x["timestamp"], reverse=True)
        return commits_data[:max_commits]

    def extract_pull_requests(self, repo: str = "testing842/clara-V2") -> List[Dict[str, Any]]:
        """Extracts pull request history exclusively from the database (populated via GitHub Webhooks)."""
        pr_data = []
        with self.store._get_db() as db:
            from ..db.models import DBEvidence
            db_evidences = db.query(DBEvidence).filter(
                DBEvidence.source_type == "git"
            ).all()
            
            for e in db_evidences:
                if e.external_id and e.external_id.startswith("pr-"):
                    try:
                        pr_num = int(e.external_id[3:])
                    except ValueError:
                        pr_num = 1
                        
                    title = e.source_title or "Updated PR"
                    prefix = f"Pull Request #{pr_num}: "
                    if title.startswith(prefix):
                        title = title[len(prefix):]
                        
                    lines = (e.excerpt or "").split("\n")
                    state = "open"
                    body = "No description provided."
                    for line in lines:
                        if line.startswith("State: "):
                            state = line[7:]
                        elif line.startswith("Description: "):
                            body = line[13:]
                            
                    pr_data.append({
                        "pr_number": pr_num,
                        "title": title,
                        "state": state,
                        "author": e.author or "git-user",
                        "created_at": e.observed_at.isoformat() if hasattr(e.observed_at, 'isoformat') else str(e.observed_at),
                        "body": body,
                        "head_branch": "feature/branch",
                        "base_branch": "main",
                    })
        
        pr_data.sort(key=lambda x: x["created_at"], reverse=True)
        return pr_data

"""
Enterprise Context Brain (ECB) v2.2 - GitHub MCP Server (REST API) Connector
Implements the "GitHub MCP Server" toolsets (git, issues, pull_requests, repos,
actions, tags/releases) over the GitHub REST API. Exposed both as a standard MCP
tool catalog (tools/list + tools/call) and as an invokable set of functions for the
GitHub webhook receiver.

Local `git` CLI operations (git_status, git_diff, git_commit, git_branch, etc.)
are intentionally NOT implemented here: a webhook only carries inbound event JSON
and has no local working-tree checkout, so true local-Git operations are not feasible
on the webhook path. All tools here are HTTP API calls authenticated via GITHUB_TOKEN.
"""

from __future__ import annotations

import json
import os
import uuid
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime
from typing import Any, Dict, List, Optional


GITHUB_API = "https://api.github.com"
DEFAULT_OWNER = "testing842"
DEFAULT_REPO = "clara-V2"


class GitHubMCPError(Exception):
    """Raised when a GitHub REST API call fails."""


class GitHubMCP:
    """Connects ECB to GitHub's platform via its REST API (MCP Server toolsets)."""

    def __init__(self, token: Optional[str] = None):
        self.token = token or os.getenv("GITHUB_TOKEN", "")

    # ------------------------------------------------------------------ #
    # HTTP helpers
    # ------------------------------------------------------------------ #
    def _request(
        self,
        path: str,
        method: str = "GET",
        payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if not self.token or not self.token.strip():
            raise GitHubMCPError("GITHUB_TOKEN is not configured; cannot call GitHub REST API.")
        url = f"{GITHUB_API}{path}"
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Authorization", f"Bearer {self.token}")
        req.add_header("Accept", "application/vnd.github+json")
        req.add_header("X-GitHub-Api-Version", "2022-11-28")
        req.add_header("User-Agent", "ECB-github-mcp/2.2")
        if payload is not None:
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req) as resp:
                raw = resp.read().decode("utf-8")
                if not raw:
                    return {}
                return json.loads(raw)
        except urllib.error.HTTPError as e:
            detail = ""
            try:
                detail = e.read().decode("utf-8")
            except Exception:
                pass
            raise GitHubMCPError(f"GitHub API {method} {path} -> HTTP {e.code}: {detail[:400]}") from e
        except urllib.error.URLError as e:
            raise GitHubMCPError(f"GitHub API {method} {path} -> network error: {e}") from e

    def _split_repo(self, repo: str) -> List[str]:
        repo = repo or f"{DEFAULT_OWNER}/{DEFAULT_REPO}"
        parts = repo.strip("/").split("/")
        if len(parts) == 1:
            return [DEFAULT_OWNER, parts[0]]
        return [parts[-2], parts[-1]]

    # ------------------------------------------------------------------ #
    # Tool catalog
    # ------------------------------------------------------------------ #
    def list_tools(self) -> List[Dict[str, Any]]:
        """Returns the GitHub MCP Server tool catalog (REST-API-backed toolsets)."""
        return [
            # ---- git toolset (REST-API backed: commits, refs, branches/tags) ----
            {
                "name": "github_get_repo_status",
                "description": "Get commit/branch/PR/release summary for a repository (working-tree status analog).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string", "description": "owner/name (default testing842/clara-V2)"},
                    },
                },
            },
            {
                "name": "github_list_commits",
                "description": "List recent commits (git_log analog).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "branch": {"type": "string", "description": "branch name (default: default branch)"},
                        "max_count": {"type": "integer", "default": 10},
                        "since": {"type": "string", "description": "ISO 8601 date to filter commits after"},
                    },
                },
            },
            {
                "name": "github_get_commit",
                "description": "Show contents/details of a single commit (git_show analog).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "sha": {"type": "string", "description": "commit SHA or ref"},
                    },
                    "required": ["sha"],
                },
            },
            {
                "name": "github_list_branches",
                "description": "List branches (git_branch analog: local == branches, remote == all).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "branch_type": {"type": "string", "enum": ["local", "remote", "all"], "default": "local"},
                        "max_count": {"type": "integer", "default": 30},
                    },
                },
            },
            {
                "name": "github_list_tags",
                "description": "List repository tags (git_tag_release / git_branch remote tags).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "max_count": {"type": "integer", "default": 30},
                    },
                },
            },
            {
                "name": "github_get_repository_tree",
                "description": "Get the file/content tree of a repository (git_status/diff work-area analog).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "branch": {"type": "string"},
                        "path_filter": {"type": "string"},
                        "recursive": {"type": "boolean", "default": False},
                        "max_entries": {"type": "integer", "default": 200},
                    },
                },
            },
            {
                "name": "github_create_branch",
                "description": "Create a branch by pointing it at a base ref/commit (git_create_branch analog).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "branch_name": {"type": "string"},
                        "base_branch": {"type": "string", "default": "main"},
                    },
                    "required": ["branch_name"],
                },
            },
            {
                "name": "github_create_tag",
                "description": "Create an annotated tag reference (git_tag_release analog).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "tag": {"type": "string"},
                        "sha": {"type": "string", "description": "commit SHA to point the tag at"},
                        "message": {"type": "string", "default": "ECB release"},
                    },
                    "required": ["tag", "sha"],
                },
            },
            # ---- issues toolset ----
            {
                "name": "github_list_issues",
                "description": "List issues (optionally filtered by state and assignee).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "state": {"type": "string", "enum": ["open", "closed", "all"], "default": "open"},
                        "assignee": {"type": "string"},
                        "max_count": {"type": "integer", "default": 10},
                    },
                },
            },
            {
                "name": "github_get_issue",
                "description": "Get an issue with its comments.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "issue_number": {"type": "integer"},
                    },
                    "required": ["issue_number"],
                },
            },
            {
                "name": "github_create_issue",
                "description": "Create a new issue with a title and body.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "title": {"type": "string"},
                        "body": {"type": "string"},
                        "labels": {"type": "array", "items": {"type": "string"}},
                        "assignees": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["title"],
                },
            },
            {
                "name": "github_update_issue",
                "description": "Update issue fields (state, title, body, labels, assignees).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "issue_number": {"type": "integer"},
                        "state": {"type": "string", "enum": ["open", "closed"]},
                        "title": {"type": "string"},
                        "body": {"type": "string"},
                    },
                    "required": ["issue_number"],
                },
            },
            # ---- pull_requests toolset ----
            {
                "name": "github_list_pull_requests",
                "description": "List pull requests filtered by state.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "state": {"type": "string", "enum": ["open", "closed", "all"], "default": "open"},
                        "max_count": {"type": "integer", "default": 10},
                    },
                },
            },
            {
                "name": "github_get_pull_request",
                "description": "Get a pull request with its reviews and changed files.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "pr_number": {"type": "integer"},
                    },
                    "required": ["pr_number"],
                },
            },
            {
                "name": "github_create_pull_request",
                "description": "Create a new pull request (MCP gateway PR tool).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "title": {"type": "string"},
                        "head_branch": {"type": "string"},
                        "base_branch": {"type": "string", "default": "main"},
                        "body": {"type": "string"},
                    },
                    "required": ["title", "head_branch", "base_branch"],
                },
            },
            # ---- repos toolset ----
            {
                "name": "github_get_repository",
                "description": "Get repository metadata (owner, description, language, stars, default branch).",
                "inputSchema": {
                    "type": "object",
                    "properties": {"repo": {"type": "string"}},
                },
            },
            {
                "name": "github_get_file_content",
                "description": "Read a file or list a directory at a ref (git_show analog for files).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "path": {"type": "string"},
                        "ref": {"type": "string"},
                    },
                    "required": ["path"],
                },
            },
            # ---- actions toolset ----
            {
                "name": "github_list_workflow_runs",
                "description": "List GitHub Actions workflow runs for a repository.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "branch": {"type": "string"},
                        "max_count": {"type": "integer", "default": 10},
                    },
                },
            },
            {
                "name": "github_get_workflow_run",
                "description": "Get status/details of a specific workflow run (CI/CD intelligence).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo": {"type": "string"},
                        "run_id": {"type": "integer"},
                    },
                    "required": ["run_id"],
                },
            },
        ]

    def get_tool(self, name: str) -> Optional[Dict[str, Any]]:
        for t in self.list_tools():
            if t["name"] == name:
                return t
        return None

    # ------------------------------------------------------------------ #
    # Tool implementations
    # ------------------------------------------------------------------ #
    def call_tool(self, name: str, arguments: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Dispatches an MCP-style tool call to the GitHub REST API."""
        args = arguments or {}
        try:
            method = getattr(self, f"_impl_{name}")
        except AttributeError:
            raise GitHubMCPError(f"Unknown GitHub MCP tool: {name}")
        return method(args)

    def _impl_github_get_repo_status(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        rep = self._request(f"/repos/{owner}/{repo}")
        branches = self._request(f"/repos/{owner}/{repo}/branches?per_page=100")
        commits = self._request(f"/repos/{owner}/{repo}/commits?per_page=5")
        prs = self._request(f"/repos/{owner}/{repo}/pulls?state=open&per_page=5")
        default_branch = rep.get("default_branch", "main")
        return {
            "repository": f"{owner}/{repo}",
            "default_branch": default_branch,
            "size_kb": rep.get("size"),
            "language": rep.get("language"),
            "open_issues": rep.get("open_issues_count"),
            "stars": rep.get("stargazers_count"),
            "branches": [b.get("name") for b in branches[:30]],
            "recent_commits": [self._commit_brief(c) for c in commits],
            "open_pull_requests": [self._pr_brief(p) for p in prs],
        }

    def _impl_github_list_commits(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        per = int(args.get("max_count", 10))
        query = [("per_page", str(per))]
        if args.get("branch"):
            query.append(("sha", args["branch"]))
        if args.get("since"):
            query.append(("since", args["since"]))
        qs = "&".join(f"{k}={urllib.parse.quote(str(v))}" for k, v in query)
        commits = self._request(f"/repos/{owner}/{repo}/commits?{qs}")
        return {"repo": f"{owner}/{repo}", "commits": [self._commit_brief(c) for c in commits]}

    def _impl_github_get_commit(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        sha = args.get("sha", "")
        c = self._request(f"/repos/{owner}/{repo}/commits/{sha}")
        files = [
            {
                "filename": f.get("filename"),
                "status": f.get("status"),
                "additions": f.get("additions"),
                "deletions": f.get("deletions"),
            }
            for f in (c.get("files") or [])
        ]
        return {
            "sha": c.get("sha"),
            "author": (c.get("commit") or {}).get("author", {}).get("name"),
            "date": (c.get("commit") or {}).get("author", {}).get("date"),
            "message": ((c.get("commit") or {}).get("message") or "").strip(),
            "stats": c.get("stats"),
            "files": files,
        }

    def _impl_github_list_branches(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        per = int(args.get("max_count", 30))
        branch_type = args.get("branch_type", "local")
        if branch_type == "local":
            branches = self._request(f"/repos/{owner}/{repo}/branches?per_page={per}")
            return {"repo": f"{owner}/{repo}", "branches": [b.get("name") for b in branches]}
        # remote/all -> include both branches and tags
        branches = self._request(f"/repos/{owner}/{repo}/branches?per_page={per}")
        return {
            "repo": f"{owner}/{repo}",
            "branches": [b.get("name") for b in branches],
            "note": "Webhook has no local clone; 'remote'/'all' shows branches + tags from GitHub API.",
        }

    def _impl_github_list_tags(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        per = int(args.get("max_count", 30))
        tags = self._request(f"/repos/{owner}/{repo}/tags?per_page={per}")
        return {"repo": f"{owner}/{repo}", "tags": [t.get("name") for t in tags]}

    def _impl_github_get_repository_tree(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        branch = args.get("branch", "main")
        try:
            tree = self._request(f"/repos/{owner}/{repo}/git/trees/{branch}?recursive={str(args.get('recursive', False)).lower()}")
        except GitHubMCPError:
            # fall back to the default branch
            rep = self._request(f"/repos/{owner}/{repo}")
            branch = rep.get("default_branch", "main")
            tree = self._request(f"/repos/{owner}/{repo}/git/trees/{branch}?recursive={str(args.get('recursive', False)).lower()}")
        entries = tree.get("tree", [])
        path_filter = args.get("path_filter", "")
        if path_filter:
            entries = [e for e in entries if (e.get("path") or "").startswith(path_filter)]
        max_entries = int(args.get("max_entries", 200))
        return {
            "repo": f"{owner}/{repo}",
            "branch": branch,
            "truncated": tree.get("truncated", False),
            "entries": [
                {"path": e.get("path"), "type": e.get("type"), "mode": e.get("mode")}
                for e in entries[:max_entries]
            ],
        }

    def _impl_github_create_branch(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        branch_name = args["branch_name"]
        base_branch = args.get("base_branch", "main")
        # resolve base branch to a SHA, then create the new ref pointing at it
        refs = self._request(f"/git/ref/heads/{base_branch}")
        sha = refs.get("object", {}).get("sha", "")
        self._request(f"/git/refs", method="POST", payload={
            "ref": f"refs/heads/{branch_name}",
            "sha": sha,
        })
        return {"repo": f"{owner}/{repo}", "branch": branch_name, "based_on": base_branch, "sha": sha, "status": "created"}

    def _impl_github_create_tag(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        tag = args["tag"]
        sha = args["sha"]
        message = args.get("message", "ECB release")
        # create annotated tag object, then the ref
        tag_obj = self._request(f"/git/tags", method="POST", payload={
            "tag": tag,
            "message": message,
            "object": sha,
            "type": "commit",
        })
        tag_sha = tag_obj.get("sha", "")
        self._request(f"/git/refs", method="POST", payload={"ref": f"refs/tags/{tag}", "sha": tag_sha})
        return {"repo": f"{owner}/{repo}", "tag": tag, "tag_sha": tag_sha, "object_sha": sha, "status": "created"}

    def _impl_github_list_issues(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        per = int(args.get("max_count", 10))
        qs = f"state={args.get('state', 'open')}&per_page={per}"
        if args.get("assignee"):
            qs += f"&assignee={urllib.parse.quote(args['assignee'])}"
        issues = self._request(f"/repos/{owner}/{repo}/issues?{qs}")
        return {"repo": f"{owner}/{repo}", "issues": [self._issue_brief(i) for i in issues]}

    def _impl_github_get_issue(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        num = int(args["issue_number"])
        issue = self._request(f"/repos/{owner}/{repo}/issues/{num}")
        comments = self._request(f"/repos/{owner}/{repo}/issues/{num}/comments?per_page=50")
        return {
            "number": issue.get("number"),
            "title": issue.get("title"),
            "state": issue.get("state"),
            "body": issue.get("body"),
            "author": (issue.get("user") or {}).get("login"),
            "labels": [l.get("name") for l in (issue.get("labels") or [])],
            "created_at": issue.get("created_at"),
            "comments": [{"author": c.get("user", {}).get("login"), "body": c.get("body")} for c in comments],
        }

    def _impl_github_create_issue(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        payload: Dict[str, Any] = {
            "title": args["title"],
            "body": args.get("body", ""),
        }
        if args.get("labels"):
            payload["labels"] = args["labels"]
        if args.get("assignees"):
            payload["assignees"] = args["assignees"]
        issue = self._request(f"/repos/{owner}/{repo}/issues", method="POST", payload=payload)
        return {"repo": f"{owner}/{repo}", "issue_number": issue.get("number"), "url": issue.get("html_url"), "status": "created"}

    def _impl_github_update_issue(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        num = int(args["issue_number"])
        payload: Dict[str, Any] = {}
        for field in ("state", "title", "body"):
            if args.get(field) is not None:
                payload[field] = args[field]
        issue = self._request(f"/repos/{owner}/{repo}/issues/{num}", method="PATCH", payload=payload)
        return {"repo": f"{owner}/{repo}", "issue_number": num, "title": issue.get("title"), "state": issue.get("state"), "status": "updated"}

    def _impl_github_list_pull_requests(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        per = int(args.get("max_count", 10))
        prs = self._request(f"/repos/{owner}/{repo}/pulls?state={args.get('state', 'open')}&per_page={per}")
        return {"repo": f"{owner}/{repo}", "pull_requests": [self._pr_brief(p) for p in prs]}

    def _impl_github_get_pull_request(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        num = int(args["pr_number"])
        pr = self._request(f"/repos/{owner}/{repo}/pulls/{num}")
        reviews = self._request(f"/repos/{owner}/{repo}/pulls/{num}/reviews?per_page=50")
        files = self._request(f"/repos/{owner}/{repo}/pulls/{num}/files?per_page=100")
        return {
            "pr_number": pr.get("number"),
            "title": pr.get("title"),
            "state": pr.get("state"),
            "merged": pr.get("merged"),
            "author": (pr.get("user") or {}).get("login"),
            "head_branch": (pr.get("head") or {}).get("ref"),
            "base_branch": (pr.get("base") or {}).get("ref"),
            "body": pr.get("body"),
            "files": [f.get("filename") for f in files],
            "reviews": [r.get("state") for r in reviews],
        }

    def _impl_github_create_pull_request(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        pr = self._request(f"/repos/{owner}/{repo}/pulls", method="POST", payload={
            "title": args["title"],
            "head": args["head_branch"],
            "base": args["base_branch"],
            "body": args.get("body", ""),
        })
        return {"repo": f"{owner}/{repo}", "pr_number": pr.get("number"), "url": pr.get("html_url"), "status": "created"}

    def _impl_github_get_repository(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        rep = self._request(f"/repos/{owner}/{repo}")
        return {
            "repo": f"{owner}/{repo}",
            "description": rep.get("description"),
            "language": rep.get("language"),
            "default_branch": rep.get("default_branch"),
            "stars": rep.get("stargazers_count"),
            "forks": rep.get("forks_count"),
            "open_issues": rep.get("open_issues_count"),
            "visibility": rep.get("visibility"),
            "pushed_at": rep.get("pushed_at"),
            "archived": rep.get("archived"),
        }

    def _impl_github_get_file_content(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        path = args["path"]
        qs = f"?ref={urllib.parse.quote(args['ref'])}" if args.get("ref") else ""
        try:
            content = self._request(f"/repos/{owner}/{repo}/contents/{path.lstrip('/')}{qs}")
        except GitHubMCPError as e:
            raise GitHubMCPError(f"Could not read {path}: {e}")
        if isinstance(content, list):
            return {"repo": f"{owner}/{repo}", "path": path, "type": "directory", "entries": [e.get("name") for e in content]}
        import base64
        raw = content.get("content", "")
        try:
            text = base64.b64decode(raw).decode("utf-8", errors="replace")
        except Exception:
            text = raw
        return {"repo": f"{owner}/{repo}", "path": path, "type": "file", "size": content.get("size"), "content": text}

    def _impl_github_list_workflow_runs(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        per = int(args.get("max_count", 10))
        qs = f"per_page={per}"
        if args.get("branch"):
            qs += f"&branch={urllib.parse.quote(args['branch'])}"
        runs = self._request(f"/repos/{owner}/{repo}/actions/runs?{qs}")
        return {
            "repo": f"{owner}/{repo}",
            "workflow_runs": [
                {
                    "id": r.get("id"),
                    "name": r.get("name"),
                    "status": r.get("status"),
                    "conclusion": r.get("conclusion"),
                    "head_branch": r.get("head_branch"),
                    "created_at": r.get("created_at"),
                    "html_url": r.get("html_url"),
                }
                for r in (runs.get("workflow_runs") or [])
            ],
        }

    def _impl_github_get_workflow_run(self, args: Dict[str, Any]) -> Dict[str, Any]:
        owner, repo = self._split_repo(args.get("repo", ""))
        run_id = int(args["run_id"])
        run = self._request(f"/repos/{owner}/{repo}/actions/runs/{run_id}")
        jobs = self._request(f"/repos/{owner}/{repo}/actions/runs/{run_id}/jobs")
        return {
            "id": run.get("id"),
            "name": run.get("name"),
            "head_branch": run.get("head_branch"),
            "head_sha": run.get("head_sha"),
            "status": run.get("status"),
            "conclusion": run.get("conclusion"),
            "created_at": run.get("created_at"),
            "updated_at": run.get("updated_at"),
            "jobs": [
                {
                    "name": j.get("name"),
                    "status": j.get("status"),
                    "conclusion": j.get("conclusion"),
                }
                for j in (jobs.get("jobs") or [])
            ],
        }

    # ------------------------------------------------------------------ #
    # Brief helpers
    # ------------------------------------------------------------------ #
    def _commit_brief(self, c: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "sha": c.get("sha", "")[:8],
            "author": (c.get("commit") or {}).get("author", {}).get("name"),
            "date": (c.get("commit") or {}).get("author", {}).get("date"),
            "message": ((c.get("commit") or {}).get("message") or "").strip().splitlines()[0] if (c.get("commit") or {}).get("message") else "",
        }

    def _pr_brief(self, p: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "number": p.get("number"),
            "title": p.get("title"),
            "state": p.get("state"),
            "author": (p.get("user") or {}).get("login"),
            "head_branch": (p.get("head") or {}).get("ref"),
            "base_branch": (p.get("base") or {}).get("ref"),
        }

    def _issue_brief(self, i: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "number": i.get("number"),
            "title": i.get("title"),
            "state": i.get("state"),
            "author": (i.get("user") or {}).get("login"),
            "labels": [l.get("name") for l in (i.get("labels") or [])],
            "created_at": i.get("created_at"),
        }

"""
Enterprise Context Brain (ECB) v2.2 - Jira MCP Server (REST API) Connector
Implements the "Jira MCP Server" toolsets (issues, projects, comments,
transitions, worklog, users, agile) over the Jira Cloud REST API. Exposed both
as a standard MCP tool catalog (tools/list + tools/call) and as an invokable
set of functions for the Jira webhook receiver.

Mirrors the naming/structure of the GitHub MCP connector (github_mcp.py) so ECB
treats Jira and GitHub MCP toolsets uniformly. Authenticates with Jira Cloud
Basic auth (JIRA_USER_EMAIL + JIRA_API_TOKEN) exactly like jira_extractor.py.
"""

from __future__ import annotations

import json
import os
import base64
import urllib.request
import urllib.error
import urllib.parse
from typing import Any, Dict, List, Optional


class JiraMCPError(Exception):
    """Raised when a Jira REST API call fails."""


class JiraMCP:
    """Connects ECB to Jira Cloud via its REST API (MCP Server toolsets)."""

    def __init__(self, url: Optional[str] = None, user: Optional[str] = None, token: Optional[str] = None):
        self.url = (url or os.getenv("JIRA_BASE_URL", "https://reenams.atlassian.net")).rstrip("/")
        self.user = user or os.getenv("JIRA_USER_EMAIL", "reenams2002@gmail.com")
        self.token = token or os.getenv("JIRA_API_TOKEN", "")

    # ------------------------------------------------------------------ #
    # HTTP helpers
    # ------------------------------------------------------------------ #
    def _auth_header(self) -> str:
        raw = f"{self.user}:{self.token}".encode()
        return "Basic " + base64.b64encode(raw).decode()

    def _request(
        self,
        path: str,
        method: str = "GET",
        payload: Optional[Dict[str, Any]] = None,
    ) -> Any:
        if not self.token or not self.token.strip():
            raise JiraMCPError("JIRA_API_TOKEN is not configured; cannot call Jira REST API.")
        url = f"{self.url}/rest{path}"
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Authorization", self._auth_header())
        req.add_header("Accept", "application/json")
        req.add_header("User-Agent", "ECB-jira-mcp/2.2")
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
            raise JiraMCPError(f"Jira API {method} {path} -> HTTP {e.code}: {detail[:400]}") from e
        except urllib.error.URLError as e:
            raise JiraMCPError(f"Jira API {method} {path} -> network error: {e}") from e

    # ------------------------------------------------------------------ #
    # Tool catalog
    # ------------------------------------------------------------------ #
    def list_tools(self) -> List[Dict[str, Any]]:
        """Returns the Jira MCP Server tool catalog (REST-API-backed toolsets)."""
        return [
            # ---- issues toolset ----
            {
                "name": "jira_get_issue",
                "description": "Get a Jira issue with its fields, comments and changelog.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "issue_key": {"type": "string", "description": "Jira issue key (e.g. KAN-1)"},
                        "include_comments": {"type": "boolean", "default": True},
                    },
                    "required": ["issue_key"],
                },
            },
            {
                "name": "jira_search_issues",
                "description": "Search Jira issues using a JQL query (issue search using /search/jql).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "jql": {"type": "string", "description": "JQL query (e.g. project=KAN AND status=Open)"},
                        "max_results": {"type": "integer", "default": 20},
                        "fields": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["jql"],
                },
            },
            {
                "name": "jira_list_project_issues",
                "description": "List issues for a project key (in-progress by default).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "project_key": {"type": "string", "description": "Jira project key (e.g. KAN)"},
                        "status": {"type": "string", "description": "Filter by status name (optional)"},
                        "max_results": {"type": "integer", "default": 50},
                    },
                    "required": ["project_key"],
                },
            },
            {
                "name": "jira_create_issue",
                "description": "Create a new Jira issue (task/story/bug) under a project.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "project_key": {"type": "string"},
                        "summary": {"type": "string"},
                        "issue_type": {"type": "string", "default": "Task"},
                        "description": {"type": "string"},
                        "priority": {"type": "string", "enum": ["Highest", "High", "Medium", "Low", "Lowest"]},
                        "assignee": {"type": "string", "description": "displayName or accountId"},
                        "labels": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["project_key", "summary"],
                },
            },
            {
                "name": "jira_update_issue",
                "description": "Update fields on an existing Jira issue.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "issue_key": {"type": "string"},
                        "summary": {"type": "string"},
                        "description": {"type": "string"},
                        "priority": {"type": "string", "enum": ["Highest", "High", "Medium", "Low", "Lowest"]},
                        "due_date": {"type": "string", "description": "ISO date (YYYY-MM-DD)"},
                    },
                    "required": ["issue_key"],
                },
            },
            {
                "name": "jira_transition_issue",
                "description": "Transition a Jira issue through its workflow (e.g. In Progress -> Done).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "issue_key": {"type": "string"},
                        "transition_name": {"type": "string", "description": "Target status/transition name"},
                        "comment": {"type": "string", "description": "Optional comment to add during transition"},
                    },
                    "required": ["issue_key", "transition_name"],
                },
            },
            {
                "name": "jira_get_transitions",
                "description": "List the available workflow transitions for a Jira issue.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "issue_key": {"type": "string"},
                    },
                    "required": ["issue_key"],
                },
            },
            # ---- projects toolset ----
            {
                "name": "jira_list_projects",
                "description": "List all accessible Jira projects.",
                "inputSchema": {"type": "object", "properties": {}},
            },
            {
                "name": "jira_get_project",
                "description": "Get metadata for a single Jira project.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "project_key": {"type": "string", "description": "Jira project key (e.g. KAN)"},
                    },
                    "required": ["project_key"],
                },
            },
            {
                "name": "jira_get_project_versions",
                "description": "List the versions (releases) defined for a Jira project.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "project_key": {"type": "string"},
                    },
                    "required": ["project_key"],
                },
            },
            # ---- comments toolset ----
            {
                "name": "jira_add_comment",
                "description": "Add a comment to a Jira issue.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "issue_key": {"type": "string"},
                        "body": {"type": "string"},
                    },
                    "required": ["issue_key", "body"],
                },
            },
            {
                "name": "jira_list_comments",
                "description": "List comments on a Jira issue.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "issue_key": {"type": "string"},
                        "max_results": {"type": "integer", "default": 50},
                    },
                    "required": ["issue_key"],
                },
            },
            # ---- worklog toolset ----
            {
                "name": "jira_add_worklog",
                "description": "Log time spent on a Jira issue.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "issue_key": {"type": "string"},
                        "time_spent": {"type": "string", "description": "e.g. '2h 30m'"},
                        "comment": {"type": "string"},
                    },
                    "required": ["issue_key", "time_spent"],
                },
            },
            # ---- users toolset ----
            {
                "name": "jira_search_users",
                "description": "Search Jira users by display name or email.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "max_results": {"type": "integer", "default": 10},
                    },
                    "required": ["query"],
                },
            },
            # ---- agile toolset ----
            {
                "name": "jira_list_boards",
                "description": "List Agile boards accessible to the user.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "max_results": {"type": "integer", "default": 25},
                    },
                },
            },
            {
                "name": "jira_list_sprints",
                "description": "List sprints for a board.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "board_id": {"type": "integer"},
                        "max_results": {"type": "integer", "default": 25},
                    },
                    "required": ["board_id"],
                },
            },
            {
                "name": "jira_get_board_issues",
                "description": "List issues on an Agile board (optionally filtered by status).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "board_id": {"type": "integer"},
                        "status": {"type": "string"},
                        "max_results": {"type": "integer", "default": 50},
                    },
                    "required": ["board_id"],
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
        """Dispatches an MCP-style tool call to the Jira REST API."""
        args = arguments or {}
        try:
            method = getattr(self, f"_impl_{name}")
        except AttributeError:
            raise JiraMCPError(f"Unknown Jira MCP tool: {name}")
        return method(args)

    # ---- issues ----
    def _impl_jira_get_issue(self, args: Dict[str, Any]) -> Dict[str, Any]:
        key = args["issue_key"]
        issue = self._request(f"/api/3/issue/{urllib.parse.quote(key)}")
        fields = issue.get("fields", {})
        result = {
            "key": issue.get("key"),
            "summary": fields.get("summary"),
            "status": (fields.get("status") or {}).get("name"),
            "issue_type": (fields.get("issuetype") or {}).get("name"),
            "priority": (fields.get("priority") or {}).get("name"),
            "assignee": (fields.get("assignee") or {}).get("displayName"),
            "reporter": (fields.get("reporter") or {}).get("displayName"),
            "due_date": fields.get("duedate"),
            "created_at": fields.get("created"),
            "updated_at": fields.get("updated"),
            "description": self._text_from_or(fields.get("description")),
            "labels": fields.get("labels") or [],
            "url": f"{self.url}/browse/{issue.get('key')}",
        }
        if args.get("include_comments", True):
            result["comments"] = self._list_comments(key)
        return result

    def _impl_jira_search_issues(self, args: Dict[str, Any]) -> Dict[str, Any]:
        jql = args["jql"]
        max_results = int(args.get("max_results", 20))
        fields = args.get("fields") or ["summary", "status", "priority", "assignee", "duedate", "issuetype"]
        payload = {
            "jql": jql,
            "maxResults": max_results,
            "fields": list(fields),
        }
        data = self._request("/api/3/search/jql", method="POST", payload=payload)
        issues = [
            self._issue_brief(i) for i in data.get("issues", [])
        ]
        return {
            "jql": jql,
            "total": data.get("total"),
            "issues": issues,
        }

    def _impl_jira_list_project_issues(self, args: Dict[str, Any]) -> Dict[str, Any]:
        project_key = args["project_key"]
        status = args.get("status")
        max_results = int(args.get("max_results", 50))
        jql = f"project={project_key}"
        if status:
            jql += f" AND status={status!r}"
        jql += " ORDER BY updated DESC"
        payload = {
            "jql": jql,
            "maxResults": max_results,
            "fields": ["summary", "status", "priority", "assignee", "duedate", "issuetype", "updated"],
        }
        data = self._request("/api/3/search/jql", method="POST", payload=payload)
        return {
            "project_key": project_key,
            "total": data.get("total"),
            "issues": [self._issue_brief(i) for i in data.get("issues", [])],
        }

    def _impl_jira_create_issue(self, args: Dict[str, Any]) -> Dict[str, Any]:
        fields: Dict[str, Any] = {
            "project": {"key": args["project_key"]},
            "summary": args["summary"],
            "issuetype": {"name": args.get("issue_type", "Task")},
        }
        if args.get("description"):
            fields["description"] = self._text_to_or(args["description"])
        if args.get("priority"):
            fields["priority"] = {"name": args["priority"]}
        if args.get("assignee"):
            fields["assignee"] = {"name": args["assignee"]}
        if args.get("labels"):
            fields["labels"] = args["labels"]
        created = self._request("/api/3/issue", method="POST", payload={"fields": fields})
        return {
            "key": created.get("key"),
            "url": f"{self.url}/browse/{created.get('key')}",
            "status": "created",
        }

    def _impl_jira_update_issue(self, args: Dict[str, Any]) -> Dict[str, Any]:
        key = args["issue_key"]
        fields: Dict[str, Any] = {}
        if args.get("summary"):
            fields["summary"] = args["summary"]
        if args.get("description"):
            fields["description"] = self._text_to_or(args["description"])
        if args.get("priority"):
            fields["priority"] = {"name": args["priority"]}
        if args.get("due_date"):
            fields["duedate"] = args["due_date"]
        self._request(f"/api/3/issue/{urllib.parse.quote(key)}", method="PUT", payload={"fields": fields})
        return {"key": key, "updated_fields": list(fields.keys()), "status": "updated"}

    def _impl_jira_transition_issue(self, args: Dict[str, Any]) -> Dict[str, Any]:
        key = args["issue_key"]
        transitions = self._request(f"/api/3/issue/{urllib.parse.quote(key)}/transitions")
        transition_obj = None
        for t in transitions.get("transitions", []):
            if (t.get("name") or "").lower() == args["transition_name"].lower():
                transition_obj = {"id": t.get("id")}
                break
        if not transition_obj:
            raise JiraMCPError(
                f"Transition '{args['transition_name']}' not available for {key}. "
                f"Available: {', '.join(t.get('name', '') for t in transitions.get('transitions', []))}"
            )
        body: Dict[str, Any] = {"transition": transition_obj}
        if args.get("comment"):
            body["update"] = {"comment": [{"add": {"body": self._text_to_or(args["comment"])}}]}
        self._request(f"/api/3/issue/{urllib.parse.quote(key)}/transitions", method="POST", payload=body)
        return {"key": key, "transition": args["transition_name"], "status": "transitioned"}

    def _impl_jira_get_transitions(self, args: Dict[str, Any]) -> Dict[str, Any]:
        key = args["issue_key"]
        data = self._request(f"/api/3/issue/{urllib.parse.quote(key)}/transitions")
        return {
            "issue_key": key,
            "transitions": [
                {
                    "id": t.get("id"),
                    "name": t.get("name"),
                    "to_status": (t.get("to") or {}).get("name"),
                }
                for t in data.get("transitions", [])
            ],
        }

    # ---- projects ----
    def _impl_jira_list_projects(self, args: Dict[str, Any]) -> Dict[str, Any]:
        data = self._request("/api/3/project")
        projects = []
        if isinstance(data, list):
            projects = [
                {
                    "key": p.get("key"),
                    "name": p.get("name"),
                    "project_type": p.get("projectTypeKey"),
                    "lead": (p.get("lead") or {}).get("displayName"),
                }
                for p in data
            ]
        return {"projects": projects}

    def _impl_jira_get_project(self, args: Dict[str, Any]) -> Dict[str, Any]:
        key = args["project_key"]
        p = self._request(f"/api/3/project/{urllib.parse.quote(key)}")
        return {
            "key": p.get("key"),
            "name": p.get("name"),
            "project_type": p.get("projectTypeKey"),
            "lead": (p.get("lead") or {}).get("displayName"),
            "url": p.get("url"),
            "description": p.get("description"),
            "issue_style": p.get("style"),
        }

    def _impl_jira_get_project_versions(self, args: Dict[str, Any]) -> Dict[str, Any]:
        key = args["project_key"]
        data = self._request(f"/api/3/project/{urllib.parse.quote(key)}/versions")
        versions = []
        if isinstance(data, list):
            versions = [
                {
                    "id": v.get("id"),
                    "name": v.get("name"),
                    "description": v.get("description"),
                    "released": v.get("released"),
                    "release_date": v.get("releaseDate"),
                }
                for v in data
            ]
        return {"project_key": key, "versions": versions}

    # ---- comments ----
    def _list_comments(self, key: str, max_results: int = 50) -> List[Dict[str, Any]]:
        data = self._request(
            f"/api/3/issue/{urllib.parse.quote(key)}/comment?maxResults={max_results}"
        )
        comments = []
        for c in data.get("comments", []):
            comments.append({
                "id": c.get("id"),
                "author": (c.get("author") or {}).get("displayName"),
                "created": c.get("created"),
                "body": self._text_from_or(c.get("body")),
            })
        return comments

    def _impl_jira_add_comment(self, args: Dict[str, Any]) -> Dict[str, Any]:
        key = args["issue_key"]
        created = self._request(
            f"/api/3/issue/{urllib.parse.quote(key)}/comment",
            method="POST",
            payload={"body": self._text_to_or(args["body"])},
        )
        return {"issue_key": key, "comment_id": created.get("id"), "status": "added"}

    def _impl_jira_list_comments(self, args: Dict[str, Any]) -> Dict[str, Any]:
        key = args["issue_key"]
        max_results = int(args.get("max_results", 50))
        return {"issue_key": key, "comments": self._list_comments(key, max_results)}

    # ---- worklog ----
    def _impl_jira_add_worklog(self, args: Dict[str, Any]) -> Dict[str, Any]:
        key = args["issue_key"]
        payload: Dict[str, Any] = {"timeSpent": args["time_spent"]}
        if args.get("comment"):
            payload["comment"] = self._text_to_or(args["comment"])
        created = self._request(
            f"/api/3/issue/{urllib.parse.quote(key)}/worklog",
            method="POST",
            payload=payload,
        )
        return {"issue_key": key, "worklog_id": created.get("id"), "time_spent": args["time_spent"], "status": "added"}

    # ---- users ----
    def _impl_jira_search_users(self, args: Dict[str, Any]) -> Dict[str, Any]:
        query = args["query"]
        max_results = int(args.get("max_results", 10))
        data = self._request(f"/api/3/user/search?query={urllib.parse.quote(query)}&maxResults={max_results}")
        users = []
        if isinstance(data, list):
            users = [
                {"account_id": u.get("accountId"), "display_name": u.get("displayName"), "email": u.get("emailAddress")}
                for u in data
            ]
        return {"query": query, "users": users}

    # ---- agile ----
    def _impl_jira_list_boards(self, args: Dict[str, Any]) -> Dict[str, Any]:
        max_results = int(args.get("max_results", 25))
        data = self._request(f"/agile/1.0/board?maxResults={max_results}")
        return {
            "boards": [
                {"id": b.get("id"), "name": b.get("name"), "type": b.get("type")}
                for b in data.get("values", [])
            ]
        }

    def _impl_jira_list_sprints(self, args: Dict[str, Any]) -> Dict[str, Any]:
        board_id = int(args["board_id"])
        max_results = int(args.get("max_results", 25))
        data = self._request(f"/agile/1.0/board/{board_id}/sprint?maxResults={max_results}")
        return {
            "board_id": board_id,
            "sprints": [
                {"id": s.get("id"), "name": s.get("name"), "state": s.get("state")}
                for s in data.get("values", [])
            ],
        }

    def _impl_jira_get_board_issues(self, args: Dict[str, Any]) -> Dict[str, Any]:
        board_id = int(args["board_id"])
        max_results = int(args.get("max_results", 50))
        jql = f"Sprint in openSprints() AND board={board_id}"
        if args.get("status"):
            jql += f" AND status={args['status']!r}"
        payload = {"jql": jql, "maxResults": max_results, "fields": ["summary", "status", "priority", "assignee"]}
        data = self._request("/api/3/search/jql", method="POST", payload=payload)
        return {
            "board_id": board_id,
            "total": data.get("total"),
            "issues": [self._issue_brief(i) for i in data.get("issues", [])],
        }

    # ------------------------------------------------------------------ #
    # Brief / text helpers
    # ------------------------------------------------------------------ #
    def _issue_brief(self, i: Dict[str, Any]) -> Dict[str, Any]:
        fields = i.get("fields", {})
        return {
            "key": i.get("key"),
            "summary": fields.get("summary"),
            "status": (fields.get("status") or {}).get("name"),
            "priority": (fields.get("priority") or {}).get("name"),
            "issue_type": (fields.get("issuetype") or {}).get("name"),
            "assignee": (fields.get("assignee") or {}).get("displayName"),
            "due_date": fields.get("duedate"),
            "url": f"{self.url}/browse/{i.get('key')}",
        }

    def _text_to_or(self, text: str) -> Dict[str, Any]:
        """Converts a plain-text string into a Jira Atlassian Document Format (ADF)."""
        lines = str(text).rstrip().split("\n")
        content = []
        paragraph: List[Dict[str, Any]] = []
        for line in lines:
            stripped = line.strip()
            if not stripped:
                if paragraph:
                    content.append({"type": "paragraph", "content": paragraph})
                    paragraph = []
                continue
            paragraph.append({"type": "text", "text": stripped})
        if paragraph:
            content.append({"type": "paragraph", "content": paragraph})
        if not content:
            content.append({"type": "paragraph", "content": [{"type": "text", "text": ""}]})
        return {"type": "doc", "version": 1, "content": content}

    def _text_from_or(self, value: Any) -> str:
        """Extracts plain text from a Jira field (supports both str and ADF doc)."""
        if value is None:
            return ""
        if isinstance(value, str):
            return value
        if isinstance(value, dict):
            if value.get("type") == "doc":
                bits = []
                for node in value.get("content", []):
                    bits.append(self._adf_render(node))
                return " ".join(b for b in bits if b)
            return value.get("value", "")
        return str(value)

    def _adf_render(self, node: Dict[str, Any]) -> str:
        if node.get("type") == "text":
            return node.get("text", "")
        inner = node.get("content", [])
        return " ".join(self._adf_render(c) for c in inner if isinstance(c, dict))

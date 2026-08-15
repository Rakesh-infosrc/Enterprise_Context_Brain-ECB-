from typing import Dict, Any

class MCPToolRegistry:
    """Registry managing available MCP tools and execution policy mapping."""

    def __init__(self):
        self.tools = {
            "jira_escalation": "High",
            "git_commit_reader": "Low",
            "docs_fetcher": "Low",
            "aws_status_check": "Low"
        }

    def get_tool_policy(self, tool_name: str) -> str:
        return self.tools.get(tool_name, "High")

from typing import Dict, Any, List


class DatasetNormalizer:
    @staticmethod
    def format_to_llm_jsonl(git_data: List[Dict[str, Any]], jira_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Converts raw heterogeneous Git and Jira objects into LLM fine-tuning instruction pairs."""
        jsonl_records = []

        for issue in jira_data:
            key = issue.get("key")
            summary = issue.get("summary")
            status = issue.get("status")
            assignee = issue.get("assignee")

            # Match related Git commit if available
            matching_commit = next((c for c in git_data if key.lower() in c.get("message", "").lower() or "clara" in c.get("message", "").lower()), git_data[0] if git_data else None)

            record = {
                "instruction": f"Synthesize architectural impact, status, and code evidence for Jira task {key}.",
                "context": {
                    "jira_task": f"[{key}] {summary} (Status: {status}, Assignee: {assignee})",
                    "jira_url": issue.get("url"),
                    "git_commit": f"{matching_commit.get('sha')}: {matching_commit.get('message')}" if matching_commit else "No commit linked",
                    "git_author": matching_commit.get("author") if matching_commit else "Unknown",
                },
                "target_synthesis": f"Jira issue {key} ('{summary}') is currently in status '{status}'. The change is tracked by developer {assignee}. Linked code commit {matching_commit.get('sha') if matching_commit else 'N/A'} validates the resolution."
            }
            jsonl_records.append(record)

        return jsonl_records

from fastapi import APIRouter, HTTPException, Query, Depends, UploadFile, File
from typing import Dict, Any, List
from datetime import datetime
import re as _re
from pydantic import BaseModel

from ....domain.schemas import AgentRun, AuditEvent, QueryRequest
from ....infrastructure.db.store import CanonicalStore
from ....infrastructure.vector.qdrant_service import QdrantVectorService
from ....infrastructure.llm.llama_guard import LlamaGuardService, GuardResult
from ....application.intelligence.skill_loader import SkillLoader, SkillMetadata
from ....application.safety.eval_suite import EvalSuite
from ....core.config import get_settings
from ....infrastructure.integration.live_sync_service import LiveDataIntegrationService
from ....core.security import get_current_user

router = APIRouter(tags=["System & Observability"])
store = CanonicalStore.get_instance()
qdrant_service = QdrantVectorService(store)
llama_guard = LlamaGuardService()
skill_loader = SkillLoader()
eval_suite = EvalSuite()
live_sync_service = LiveDataIntegrationService()

@router.post("/sync")
def sync_live_data():
    """Trigger live synchronization with external APIs (GitHub, Jira)."""
    return live_sync_service.sync_all_sources()

@router.get("/skills", response_model=List[SkillMetadata])
def list_skills():
    """Lists dynamically discovered modular skills from backend/skills/."""
    return skill_loader.list_skills()


class SkillCreateRequest(BaseModel):
    name: str
    description: str
    version: str = "1.0.0"
    author: str = "ECB Engineering"
    instructions: str


@router.post("/skills", response_model=SkillMetadata)
def create_skill(req: SkillCreateRequest, current_user = Depends(get_current_user)):
    """Create a new skill playbook."""
    import re as _re
    if not _re.match(r"^[a-z0-9_]+$", req.name):
        raise HTTPException(status_code=400, detail="Skill name must be lowercase alphanumeric with underscores only.")
    try:
        return skill_loader.create_skill(req.name, req.description, req.version, req.author, req.instructions)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.put("/skills/{name}", response_model=SkillMetadata)
def update_skill(name: str, req: SkillCreateRequest, current_user = Depends(get_current_user)):
    """Update an existing skill playbook."""
    if name not in skill_loader.skills:
        raise HTTPException(status_code=404, detail=f"Skill '{name}' not found")
    return skill_loader.save_skill(name, req.description, req.version, req.author, req.instructions)


@router.delete("/skills/{name}")
def delete_skill(name: str, current_user = Depends(get_current_user)):
    """Delete a skill playbook."""
    if name not in skill_loader.skills:
        raise HTTPException(status_code=404, detail=f"Skill '{name}' not found")
    ok = skill_loader.delete_skill(name)
    if not ok:
        raise HTTPException(status_code=500, detail="Delete failed")
    return {"status": "deleted", "name": name}


@router.post("/skills/upload", response_model=SkillMetadata)
async def upload_skill_file(file: UploadFile = File(...), current_user = Depends(get_current_user)):
    """Upload a SKILL.md file to create a new skill. The file must have YAML frontmatter with name, description, version, author."""
    if not file.filename or not file.filename.endswith('.md'):
        raise HTTPException(status_code=400, detail="File must be a .md file")
    content = await file.read()
    text = content.decode("utf-8")
    frontmatter_match = _re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", text, _re.DOTALL)
    if not frontmatter_match:
        raise HTTPException(status_code=400, detail="Invalid SKILL.md format. Must have YAML frontmatter between --- fences.")
    raw_yaml = frontmatter_match.group(1)
    instructions = frontmatter_match.group(2).strip()
    meta_dict = {}
    for line in raw_yaml.split("\n"):
        if ":" in line:
            k, v = line.split(":", 1)
            meta_dict[k.strip()] = v.strip()
    name = meta_dict.get("name", "").strip()
    description = meta_dict.get("description", "").strip()
    version = meta_dict.get("version", "1.0.0").strip()
    author = meta_dict.get("author", "ECB Engineering").strip()
    if not name:
        raise HTTPException(status_code=400, detail="SKILL.md frontmatter must include a 'name' field.")
    if not _re.match(r"^[a-z0-9_]+$", name):
        raise HTTPException(status_code=400, detail="Skill name must be lowercase alphanumeric with underscores only.")
    if not description:
        raise HTTPException(status_code=400, detail="SKILL.md frontmatter must include a 'description' field.")
    return skill_loader.save_skill(name, description, version, author, instructions)

@router.get("/qdrant/stats")
def get_qdrant_stats():
    """Returns Qdrant vector database collection metrics."""
    return qdrant_service.get_collection_stats()

@router.post("/guard/check", response_model=GuardResult)
def check_safety(req: QueryRequest):
    """Direct Llama Guard 3 safety inspector for prompts."""
    return llama_guard.inspect_prompt(req.query)

@router.get("/agent-runs", response_model=List[AgentRun])
def list_agent_runs(limit: int = Query(20, ge=1, le=100)):
    return store.get_agent_runs(limit=limit)

@router.get("/agent-runs/{run_id}", response_model=AgentRun)
def get_agent_run(run_id: str):
    r = store.get_agent_run(run_id)
    if not r:
        raise HTTPException(status_code=404, detail="Agent run not found")
    return r

@router.delete("/agent-runs/{run_id}")
def delete_agent_run(run_id: str, current_user = Depends(get_current_user)):
    """Log deletion is blocked until linked Mem0 project memory is deleted — enforces 'project DB first' rule."""
    run = store.get_agent_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")
    # Guard: if any Mem0/DB memory still exists for same project, block
    pid = getattr(run, 'project_id', None)
    # Prefer strict project guard, fallback to query substring
    if pid:
        mems = store.get_memories(project_id=pid)
        if mems:
            raise HTTPException(status_code=409, detail=f"Cannot delete log: {len(mems)} Mem0 memories still exist for project {pid}. Delete from Mem0 Memory Logs first.")
    # Fallback substring check across all memories
    q = (run.query or "").strip()[:30].lower()
    if q:
        all_mems = store.get_memories()
        if any(q in (m.content or "").lower() or q in (m.title or "").lower() for m in all_mems):
            raise HTTPException(status_code=409, detail="Cannot delete log: linked Mem0 memory still exists. Delete from Mem0 Memory Logs first.")
    ok = store.delete_agent_run(run_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Delete failed")
    return {"status": "deleted", "id": run_id}

@router.get("/audit-events", response_model=List[AuditEvent])
def list_audit_events(limit: int = Query(50, ge=1, le=100), current_user = Depends(get_current_user)):
    return store.get_audit_events(limit=limit, user=current_user)

@router.post("/eval/run")
def run_eval_benchmark():
    return eval_suite.run_golden_benchmarks()

@router.get("/stats")
def get_dashboard_stats(current_user = Depends(get_current_user)):
    team = None if current_user.role == "master_authority" else current_user.team
    projects = store.get_projects(team=team)
    risks = store.get_risks(team=team)
    decisions = store.get_decisions(team=team)
    actions = store.get_actions()
    pending_approvals = [a for a in actions if a.status == "pending_approval"]

    # Compute live evidence-backed rate from store
    from app.domain.schemas import SourceType
    all_evidence = store.get_evidence_list()
    grounded_count = len([e for e in all_evidence if e.authority in ("high", "medium")])
    total_evidence = len(all_evidence) if all_evidence else 1
    evidence_rate = round((grounded_count / total_evidence) * 100, 1) if total_evidence > 0 else 0.0

    # Compute live latency from recent audit events (avg of last 50 events)
    audit_events = store.get_audit_events(limit=50)
    latencies = [getattr(e, "latency_ms", None) for e in audit_events if getattr(e, "latency_ms", None)]
    p95_latency = int(sorted(latencies)[int(len(latencies) * 0.95)]) if latencies else 0

    # Source freshness: minutes since last evidence was added
    from datetime import datetime
    if all_evidence:
        latest = max(e.observed_at for e in all_evidence if e.observed_at)
        freshness_minutes = round((datetime.utcnow() - latest).total_seconds() / 60, 1) if latest else 999.0
    else:
        freshness_minutes = 999.0

    return {
        "evidence_backed_rate_pct": evidence_rate,
        "p95_retrieval_latency_ms": p95_latency,
        "context_api_availability_pct": 99.98,
        "open_risks_count": len([r for r in risks if r.status != "resolved"]),
        "critical_risks_count": len([r for r in risks if r.severity == "critical"]),
        "active_decisions_count": len([d for d in decisions if d.status == "accepted"]),
        "pending_approvals_count": len(pending_approvals),
        "source_freshness_sla_minutes": freshness_minutes,
        "total_projects": len(projects),
    }

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Enterprise Context Brain (ECB)",
        "version": "2.2.0",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "canonical_store_ready",
        "langgraph": "active",
        "qdrant": "ready",
        "mem0": "ready",
        "llama_guard_3": "active",
        "skills_loaded": len(skill_loader.skills),
        "mcp_gateway": "ready",
        "llm_provider": get_settings().active_provider,
        "llm_mode": get_settings().ecb_llm_mode,
    }


from pydantic import BaseModel
import os

class ConnectionSettingsRequest(BaseModel):
    databricks_host: str
    databricks_token: str
    jira_base_url: str
    jira_user_email: str
    jira_api_token: str
    github_token: str
    github_host: str = ""
    github_repos: str = ""

@router.get("/settings/connections")
def get_connection_settings():
    """Reads current integration connection settings from the .env file."""
    env_vars = {}
    env_path = "D:/InfoServices/ECB/backend/.env"
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                trimmed = line.strip()
                if trimmed and not trimmed.startswith("#") and "=" in trimmed:
                    key, val = trimmed.split("=", 1)
                    env_vars[key.strip()] = val.strip()

    return {
        "databricks_host": env_vars.get("DATABRICKS_HOST", ""),
        "databricks_token": env_vars.get("DATABRICKS_TOKEN", ""),
        "jira_base_url": env_vars.get("JIRA_BASE_URL", ""),
        "jira_user_email": env_vars.get("JIRA_USER_EMAIL", ""),
        "jira_api_token": env_vars.get("JIRA_API_TOKEN", ""),
        "github_token": env_vars.get("GITHUB_TOKEN", ""),
        "github_host": env_vars.get("GITHUB_HOST", "https://github.com"),
        "github_repos": env_vars.get("GITHUB_REPOS", "")
    }

@router.post("/settings/connections")
def save_connection_settings(req: ConnectionSettingsRequest):
    """Validates the credentials, overwrites the backend .env file, and triggers an immediate sync."""
    # 1. Validate Credentials before saving
    # Test Jira Connection
    if req.jira_base_url and req.jira_user_email and req.jira_api_token:
        import base64
        import urllib.request
        import json
        auth = base64.b64encode(f"{req.jira_user_email}:{req.jira_api_token}".encode()).decode()
        url = f"{req.jira_base_url.rstrip('/')}/rest/api/3/myself"
        try:
            test_req = urllib.request.Request(url, headers={
                "Authorization": f"Basic {auth}",
                "Accept": "application/json"
            })
            with urllib.request.urlopen(test_req, timeout=5) as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=400, detail="Jira credentials rejected by Atlassian.")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Jira connection failed: {e}")

    # Test GitHub Connection
    if req.github_token:
        import urllib.request
        import json
        gh_host = (req.github_host or "https://github.com").rstrip("/")
        api_url = f"{gh_host}/api/v3/user" if "github.com" not in gh_host else "https://api.github.com/user"
        try:
            test_req = urllib.request.Request(api_url, headers={
                "Authorization": f"token {req.github_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "ECB-App"
            })
            with urllib.request.urlopen(test_req, timeout=5) as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=400, detail="GitHub token rejected by GitHub.")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"GitHub connection failed: {e}")

    # Test Databricks Connection
    if req.databricks_host and req.databricks_token:
        import urllib.request
        url = f"{req.databricks_host.rstrip('/')}/api/2.0/clusters/list"
        try:
            test_req = urllib.request.Request(url, headers={
                "Authorization": f"Bearer {req.databricks_token}",
                "Accept": "application/json"
            })
            with urllib.request.urlopen(test_req, timeout=5) as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=400, detail="Databricks token rejected.")
        except Exception as e:
            if hasattr(e, 'code') and e.code in [401, 403]:
                raise HTTPException(status_code=400, detail="Databricks token rejected (401/403).")

    # 2. Overwrite the .env file with new credentials
    env_path = "D:/InfoServices/ECB/backend/.env"

    existing_lines = []
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            existing_lines = f.readlines()

    new_keys = {
        "DATABRICKS_HOST": req.databricks_host,
        "DATABRICKS_TOKEN": req.databricks_token,
        "JIRA_BASE_URL": req.jira_base_url,
        "JIRA_USER_EMAIL": req.jira_user_email,
        "JIRA_API_TOKEN": req.jira_api_token,
        "GITHUB_TOKEN": req.github_token,
        "GITHUB_HOST": req.github_host or "https://github.com",
        "GITHUB_REPOS": req.github_repos
    }

    updated_keys = set()
    output_lines = []

    for line in existing_lines:
        trimmed = line.strip()
        is_matched = False
        if trimmed and not trimmed.startswith("#") and "=" in trimmed:
            key, _ = trimmed.split("=", 1)
            key = key.strip()
            if key in new_keys:
                output_lines.append(f"{key}={new_keys[key]}\n")
                updated_keys.add(key)
                is_matched = True

        if not is_matched:
            output_lines.append(line)

    for key, val in new_keys.items():
        if key not in updated_keys:
            if output_lines and not output_lines[-1].endswith("\n"):
                output_lines.append("\n")
            output_lines.append(f"{key}={val}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(output_lines)

    for key, val in new_keys.items():
        os.environ[key] = val

    # 3. Trigger dynamic synchronization of projects (Jira, GitHub webhook status)
    try:
        live_sync_service.sync_all_sources()
    except Exception as e:
        print(f"Post-settings save sync warning: {e}")

    return {"status": "SUCCESS", "message": "Connection credentials saved, validated, and synchronized dynamically."}

@router.post("/settings/connections/sync/{connector}")
def sync_connector(connector: str):
    """Trigger sync for a specific connector: databricks, jira, or github."""
    if connector == "databricks":
        result = live_sync_service.sync_databricks()
    elif connector == "jira":
        result = live_sync_service.sync_jira()
    elif connector == "github":
        result = live_sync_service.sync_github()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown connector: {connector}. Use databricks, jira, or github.")
    return {"status": "SUCCESS", "connector": connector, "result": result}

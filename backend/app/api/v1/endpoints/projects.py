from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional

from ....domain.schemas import Project, Risk, Decision
from ....infrastructure.db.store import CanonicalStore
from ....core.security import get_current_user

router = APIRouter(tags=["Projects & Portfolio"])
store = CanonicalStore.get_instance()

@router.get("/projects", response_model=List[Project])
def get_projects(current_user = Depends(get_current_user)):
    # Managers, PMs, system admins, and master authorities see all projects
    if current_user.role in ["master_authority", "project_manager", "manager", "system_administrator"]:
        team = None
    else:
        team = current_user.team
    return store.get_projects(team=team)

@router.get("/projects/{project_id}", response_model=Project)
def get_project_detail(project_id: str, current_user = Depends(get_current_user)):
    if current_user.role in ["master_authority", "project_manager", "manager", "system_administrator"]:
        team = None
    else:
        team = current_user.team
    p = store.get_project(project_id, team=team)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found or access restricted")
    return p

@router.delete("/projects/{project_id}")
def delete_project(project_id: str, current_user = Depends(get_current_user)):
    if current_user.role not in ["master_authority", "project_manager", "manager", "system_administrator"]:
        raise HTTPException(status_code=403, detail="Access denied. Only managers or administrators can disconnect projects.")
    p = store.get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    store.delete_project(project_id)
    return {"status": "SUCCESS", "message": f"Project {project_id} deleted successfully."}

@router.get("/risks", response_model=List[Risk])
def get_all_risks(project_id: Optional[str] = Query(None), current_user = Depends(get_current_user)):
    if current_user.role in ["master_authority", "project_manager", "manager", "system_administrator"]:
        team = None
    else:
        team = current_user.team
    return store.get_risks(project_id=project_id, team=team)

@router.get("/projects/{project_id}/risks", response_model=List[Risk])
def get_project_risks(project_id: str, current_user = Depends(get_current_user)):
    if current_user.role in ["master_authority", "project_manager", "manager", "system_administrator"]:
        team = None
    else:
        team = current_user.team
    return store.get_risks(project_id=project_id, team=team)

@router.get("/decisions", response_model=List[Decision])
def get_all_decisions(project_id: Optional[str] = Query(None), current_user = Depends(get_current_user)):
    if current_user.role in ["master_authority", "project_manager", "manager", "system_administrator"]:
        team = None
    else:
        team = current_user.team
    return store.get_decisions(project_id=project_id, team=team)

@router.get("/projects/{project_id}/decisions", response_model=List[Decision])
def get_project_decisions(project_id: str, current_user = Depends(get_current_user)):
    if current_user.role in ["master_authority", "project_manager", "manager", "system_administrator"]:
        team = None
    else:
        team = current_user.team
    return store.get_decisions(project_id=project_id, team=team)

@router.get("/architecture-docs")
def get_architecture_docs():
    import os
    base_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".."))
    doc_dir = os.path.join(base_root, "Architecture Docs")
    docs = [{"id": "all", "title": "All Architecture Docs", "filename": "all"}]
    if os.path.exists(doc_dir):
        for fn in sorted(os.listdir(doc_dir)):
            if fn.endswith(".md"):
                doc_id = f"doc-{fn.replace('.md', '').lower()}"
                clean_title = fn.replace(".md", "").replace("_", " ").title()
                docs.append({
                    "id": doc_id,
                    "title": clean_title,
                    "filename": fn
                })
    return docs

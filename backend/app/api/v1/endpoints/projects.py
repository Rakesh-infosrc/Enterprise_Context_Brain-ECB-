from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from ....domain.schemas import Project, Risk, Decision
from ....infrastructure.db.store import CanonicalStore

router = APIRouter(tags=["Projects & Portfolio"])
store = CanonicalStore.get_instance()

@router.get("/projects", response_model=List[Project])
def get_projects():
    return store.get_projects()

@router.get("/projects/{project_id}", response_model=Project)
def get_project_detail(project_id: str):
    p = store.get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p

@router.get("/risks", response_model=List[Risk])
def get_all_risks(project_id: Optional[str] = Query(None)):
    return store.get_risks(project_id=project_id)

@router.get("/projects/{project_id}/risks", response_model=List[Risk])
def get_project_risks(project_id: str):
    return store.get_risks(project_id=project_id)

@router.get("/decisions", response_model=List[Decision])
def get_all_decisions(project_id: Optional[str] = Query(None)):
    return store.get_decisions(project_id=project_id)

@router.get("/projects/{project_id}/decisions", response_model=List[Decision])
def get_project_decisions(project_id: str):
    return store.get_decisions(project_id=project_id)

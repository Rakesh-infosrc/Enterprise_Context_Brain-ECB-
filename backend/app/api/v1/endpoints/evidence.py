from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional

from ....domain.schemas import Evidence, MemoryItem
from ....infrastructure.db.store import CanonicalStore
from ....infrastructure.memory.mem0_memory import Mem0MemoryService, Mem0MemoryItem
from ....core.security import get_current_user

router = APIRouter(tags=["Evidence & Memory"])
store = CanonicalStore.get_instance()
mem0_service = Mem0MemoryService(store)

@router.get("/evidence", response_model=List[Evidence])
def get_all_evidence(project_id: Optional[str] = Query(None), current_user = Depends(get_current_user)):
    team = None if current_user.role == "master_authority" else current_user.team
    return store.get_evidence_list(project_id=project_id, team=team)

@router.get("/evidence/{evidence_id}", response_model=Evidence)
def get_evidence_detail(evidence_id: str, current_user = Depends(get_current_user)):
    team = None if current_user.role == "master_authority" else current_user.team
    ev = store.get_evidence(evidence_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")
    if team and ev.project_id:
        proj = store.get_project(ev.project_id, team=team)
        if not proj:
            raise HTTPException(status_code=403, detail="Access denied to this team resource")
    return ev

@router.get("/memories", response_model=List[MemoryItem])
def get_memories(project_id: Optional[str] = Query(None), current_user = Depends(get_current_user)):
    team = None if current_user.role == "master_authority" else current_user.team
    return store.get_memories(project_id=project_id, team=team)

@router.get("/contradictions")
def get_contradictions(project_id: Optional[str] = Query(None), current_user = Depends(get_current_user)):
    """Returns evidence items that have detected conflicts/contradictions."""
    team = None if current_user.role == "master_authority" else current_user.team
    all_evidence = store.get_evidence_list(project_id=project_id, team=team)
    conflicts = []
    for e in all_evidence:
        if e.conflict_summary:
            conflicts.append({
                "id": e.id,
                "project_id": e.project_id,
                "source_title": e.source_title,
                "conflict_summary": e.conflict_summary,
                "source_type": e.source_type.value if hasattr(e.source_type, 'value') else str(e.source_type),
                "observed_at": e.observed_at.isoformat() if e.observed_at else None,
                "url": e.url,
                "authority": e.authority.value if hasattr(e.authority, 'value') else str(e.authority),
            })
    return {"contradictions": conflicts, "total": len(conflicts)}

@router.get("/mem0/memories", response_model=List[Mem0MemoryItem])
def list_mem0_memories(user_id: Optional[str] = Query(None), project_id: Optional[str] = Query(None), current_user = Depends(get_current_user)):
    """Queries dynamic Mem0 long-term memory store."""
    target_user_id = user_id
    if current_user.role != "master_authority":
        if current_user.role == "manager":
            if not target_user_id:
                target_user_id = current_user.id
        else:
            target_user_id = current_user.id
            
    if target_user_id or project_id:
        return mem0_service.search_memories(query="", user_id=target_user_id, project_id=project_id, limit=20)
    return mem0_service.get_all()

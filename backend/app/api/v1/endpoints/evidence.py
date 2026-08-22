from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from ....domain.schemas import Evidence, MemoryItem
from ....infrastructure.db.store import CanonicalStore
from ....infrastructure.memory.mem0_memory import Mem0MemoryService, Mem0MemoryItem

router = APIRouter(tags=["Evidence & Memory"])
store = CanonicalStore.get_instance()
mem0_service = Mem0MemoryService(store)

@router.get("/evidence", response_model=List[Evidence])
def get_all_evidence(project_id: Optional[str] = Query(None)):
    return store.get_evidence_list(project_id=project_id)

@router.get("/evidence/{evidence_id}", response_model=Evidence)
def get_evidence_detail(evidence_id: str):
    ev = store.get_evidence(evidence_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return ev

@router.get("/memories", response_model=List[MemoryItem])
def get_memories(project_id: Optional[str] = Query(None)):
    return store.get_memories(project_id=project_id)

@router.get("/mem0/memories", response_model=List[Mem0MemoryItem])
def list_mem0_memories(user_id: Optional[str] = Query(None), project_id: Optional[str] = Query(None)):
    """Queries dynamic Mem0 long-term memory store."""
    if user_id or project_id:
        return mem0_service.search_memories(query="", user_id=user_id, project_id=project_id, limit=20)
    return mem0_service.get_all()

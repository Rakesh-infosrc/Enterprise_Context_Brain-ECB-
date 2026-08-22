"""
Enterprise Context Brain (ECB) v2.2 - Mem0 Dynamic Long-Term Memory Service
Maintains dynamic semantic, episodic, procedural, decision, and experiential
memories with continuous learning from user interactions and resolution patterns.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import uuid
from pydantic import BaseModel
from ...domain.schemas import MemoryType, MemoryItem
from ..db.store import CanonicalStore


class Mem0MemoryItem(BaseModel):
    id: str
    user_id: str
    project_id: Optional[str] = None
    type: MemoryType
    title: str
    content: str
    confidence: float = 0.95
    decay_half_life_days: int = 180
    validity_from: datetime
    validity_to: Optional[datetime] = None
    tags: List[str] = []
    metadata: Dict[str, Any] = {}


class Mem0MemoryService:
    def __init__(self, store: Optional[CanonicalStore] = None):
        self.store = store or CanonicalStore.get_instance()
        self.memories: Dict[str, Mem0MemoryItem] = {}
        self._init_from_canonical()

    def _init_from_canonical(self):
        canonical_mems = self.store.get_memories()
        for m in canonical_mems:
            mem0_item = Mem0MemoryItem(
                id=m.id,
                user_id="usr-sarah-jenkins",
                project_id=m.project_id,
                type=m.type,
                title=m.title,
                content=m.content,
                confidence=m.confidence,
                validity_from=m.validity_from,
                validity_to=m.validity_to,
                tags=[m.type.value, m.project_id or "global"],
                metadata=m.metadata,
            )
            self.memories[mem0_item.id] = mem0_item

    def add_memory(
        self,
        user_id: str,
        content: str,
        memory_type: MemoryType = MemoryType.EPISODIC,
        title: Optional[str] = None,
        project_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Mem0MemoryItem:
        """Stores a new dynamic memory learned from an agent interaction or approval."""
        mem_id = f"mem0-{uuid.uuid4().hex[:8]}"
        item = Mem0MemoryItem(
            id=mem_id,
            user_id=user_id,
            project_id=project_id,
            type=memory_type,
            title=title or f"Learned {memory_type.value.capitalize()} Memory",
            content=content,
            confidence=0.98,
            validity_from=datetime.utcnow(),
            tags=[memory_type.value, project_id or "general"],
            metadata=metadata or {},
        )
        self.memories[mem_id] = item
        return item

    def search_memories(
        self,
        query: str,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        memory_type: Optional[MemoryType] = None,
        limit: int = 5,
    ) -> List[Mem0MemoryItem]:
        """Searches long-term memory matching query terms and scope."""
        q_words = set(query.lower().split())
        scored = []

        for m in self.memories.values():
            if user_id and m.user_id != user_id:
                continue
            if project_id and m.project_id and m.project_id != project_id:
                continue
            if memory_type and m.type != memory_type:
                continue

            text = f"{m.title} {m.content}".lower()
            text_words = set(text.split())
            overlap = len(q_words.intersection(text_words)) / max(1, len(q_words))
            
            # Confidence weighting
            final_score = (overlap * 0.7) + (m.confidence * 0.3)
            if overlap > 0:
                scored.append((final_score, m))

        scored.sort(key=lambda x: x[0], reverse=True)
        if not scored:
            return list(self.memories.values())[:limit]
        return [m for _, m in scored[:limit]]

    def get_all(self) -> List[Mem0MemoryItem]:
        return list(self.memories.values())

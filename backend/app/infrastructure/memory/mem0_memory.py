"""
Enterprise Context Brain (ECB) v2.2 - Mem0 Dynamic Long-Term Memory Service
Maintains dynamic semantic, episodic, procedural, decision, and experiential
memories with continuous learning from user interactions and resolution patterns.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import uuid
import os
from pydantic import BaseModel
from mem0 import MemoryClient
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
        self.api_key = os.getenv("MEM0_API_KEY")
        if self.api_key:
            try:
                self.client = MemoryClient(api_key=self.api_key)
            except Exception:
                self.client = None
        else:
            self.client = None
        self._init_from_canonical()

    def _init_from_canonical(self):
        self.memories = {}
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

        # Save to live Mem0 cloud client if configured
        if self.client:
            try:
                self.client.add(
                    content=content,
                    user_id=user_id or "usr-sarah-jenkins",
                    metadata={
                        "type": memory_type.value,
                        "title": item.title,
                        "project_id": project_id or "",
                        "tags": item.tags
                    }
                )
            except Exception:
                pass

        # Save to database
        m_item = MemoryItem(
            id=item.id,
            org_id="org-acme-fintech",
            project_id=item.project_id or "",
            type=item.type,
            title=item.title,
            content=item.content,
            confidence=item.confidence,
            validity_from=item.validity_from,
            validity_to=None,
            metadata=item.metadata
        )
        self.store.add_memory(m_item)

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
        self._init_from_canonical()
        if self.client:
            try:
                res = self.client.search(
                    query=query,
                    user_id=user_id or "usr-sarah-jenkins",
                    limit=limit
                )
                mem0_items = []
                for item in res:
                    m_id = item.get("id", f"mem0-{uuid.uuid4().hex[:8]}")
                    m_type = MemoryType.EPISODIC
                    try:
                        m_type = MemoryType(item.get("metadata", {}).get("type", memory_type.value if memory_type else "episodic"))
                    except Exception:
                        pass
                    
                    mem0_items.append(Mem0MemoryItem(
                        id=m_id,
                        user_id=item.get("user_id", user_id or "usr-sarah-jenkins"),
                        project_id=item.get("metadata", {}).get("project_id", project_id),
                        type=m_type,
                        title=item.get("metadata", {}).get("title", f"Learned {m_type.value.capitalize()} Memory"),
                        content=item.get("memory", ""),
                        confidence=0.98,
                        validity_from=datetime.utcnow(),
                        tags=item.get("metadata", {}).get("tags", [m_type.value]),
                        metadata=item.get("metadata", {})
                    ))
                return mem0_items
            except Exception:
                pass

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
        self._init_from_canonical()
        return list(self.memories.values())

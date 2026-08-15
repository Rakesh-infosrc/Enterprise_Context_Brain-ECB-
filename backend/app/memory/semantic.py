from typing import List, Dict, Any
from app.memory.base import BaseMemoryStore

class SemanticMemoryStore(BaseMemoryStore):
    """Stable organizational facts (e.g. Project uses Databricks)."""
    async def add_memory(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        return memory_data

    async def search_memory(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        return []

class EpisodicMemoryStore(BaseMemoryStore):
    """Events and historical milestones (e.g. Deployment failed on Aug 11)."""
    async def add_memory(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        return memory_data

    async def search_memory(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        return []

class ProceduralMemoryStore(BaseMemoryStore):
    """Standard operating procedures & deployment playbooks."""
    async def add_memory(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        return memory_data

    async def search_memory(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        return []

class DecisionMemoryStore(BaseMemoryStore):
    """Structured Decision Memory index and superseded link graph."""
    async def add_memory(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        return memory_data

    async def search_memory(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        return []

class ExperientialMemoryStore(BaseMemoryStore):
    """Lessons learned from outcomes and post-mortems."""
    async def add_memory(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        return memory_data

    async def search_memory(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        return []

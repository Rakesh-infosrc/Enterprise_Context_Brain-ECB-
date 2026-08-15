from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseMemoryStore(ABC):
    """Abstract Base Class for Organizational Memory Stores."""

    @abstractmethod
    async def add_memory(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def search_memory(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        pass

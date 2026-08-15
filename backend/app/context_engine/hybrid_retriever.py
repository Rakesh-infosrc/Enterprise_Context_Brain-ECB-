from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.memory import OrganizationalMemory
from app.db.models.decision import DecisionMemory

class HybridRetriever:
    """Executes hybrid retrieval: Semantic search + Structured metadata filtering."""

    async def retrieve_context(self, db: AsyncSession, project_code: str, query: str) -> Dict[str, Any]:
        # Retrieve memories
        mem_stmt = select(OrganizationalMemory).where(
            OrganizationalMemory.project_code == project_code
        )
        mem_result = await db.execute(mem_stmt)
        memories = mem_result.scalars().all()

        # Retrieve decisions
        dec_stmt = select(DecisionMemory).where(
            DecisionMemory.project_code == project_code
        )
        dec_result = await db.execute(dec_stmt)
        decisions = dec_result.scalars().all()

        memory_list = [
            {
                "id": m.id,
                "type": m.memory_type,
                "content": m.content,
                "source_type": m.source_type,
                "source_id": m.source_id,
                "trust_level": m.source_trust_level
            }
            for m in memories
        ]

        decision_list = [
            {
                "id": d.id,
                "decision": d.decision,
                "owner": d.owner,
                "reason": d.reason,
                "alternatives": d.alternatives,
                "evidence": d.evidence,
                "status": d.status,
                "confidence": d.confidence
            }
            for d in decisions
        ]

        return {
            "memories": memory_list,
            "decisions": decision_list
        }

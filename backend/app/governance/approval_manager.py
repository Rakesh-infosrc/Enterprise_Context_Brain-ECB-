from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.approval import ActionApproval

class ApprovalManager:
    """Manages the Human-in-the-Loop approval lifecycle."""

    async def create_approval_request(
        self, db: AsyncSession, action_type: str, target_system: str, risk_level: str, payload: Dict[str, Any], evidence_summary: str
    ) -> ActionApproval:
        approval = ActionApproval(
            action_type=action_type,
            target_system=target_system,
            risk_level=risk_level,
            payload=payload,
            evidence_summary=evidence_summary,
            status="PENDING"
        )
        db.add(approval)
        await db.commit()
        await db.refresh(approval)
        return approval

    async def list_pending(self, db: AsyncSession) -> List[ActionApproval]:
        stmt = select(ActionApproval).where(ActionApproval.status == "PENDING")
        result = await db.execute(stmt)
        return result.scalars().all()

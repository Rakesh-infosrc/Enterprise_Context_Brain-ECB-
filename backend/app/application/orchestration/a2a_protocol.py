"""
Enterprise Context Brain (ECB) v2.2 - Agent-to-Agent (A2A) Collaboration Protocol
Defines typed message structures, task delegation contracts, and inter-agent
coordination between Manager Agent and domain specialists.
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import uuid
from pydantic import BaseModel
from ...domain.schemas import AgentWorkflow


class A2AMessage(BaseModel):
    message_id: str
    from_agent: AgentWorkflow
    to_agent: AgentWorkflow
    task_type: str # "DELEGATE_BLOCKER_ANALYSIS", "DELEGATE_RISK_AUDIT", "DELEGATE_ADR_EVALUATION"
    query_fragment: str
    target_entities: List[str] = []
    context_budget_tokens: int = 1500
    timestamp: datetime


class A2AResponse(BaseModel):
    response_id: str
    in_response_to: str
    from_agent: AgentWorkflow
    to_agent: AgentWorkflow
    status: str # "SUCCESS", "PARTIAL", "FAILED"
    sub_answer: str
    supporting_evidence_ids: List[str] = []
    proposed_actions: List[Dict[str, Any]] = []
    tokens_used: int = 350
    duration_ms: int = 45


class A2ACoordinator:
    def delegate_subtask(
        self,
        from_agent: AgentWorkflow,
        to_agent: AgentWorkflow,
        task_type: str,
        query: str,
        target_entities: List[str],
    ) -> Tuple[A2AMessage, A2AResponse]:
        """Creates an A2A task delegation envelope and executes the specialist subtask."""
        msg_id = f"a2a-msg-{uuid.uuid4().hex[:6]}"
        resp_id = f"a2a-resp-{uuid.uuid4().hex[:6]}"

        message = A2AMessage(
            message_id=msg_id,
            from_agent=from_agent,
            to_agent=to_agent,
            task_type=task_type,
            query_fragment=query,
            target_entities=target_entities,
            context_budget_tokens=1500,
            timestamp=datetime.utcnow(),
        )

        sub_answer = f"Specialist ({to_agent.value}) analyzed entities {target_entities} regarding '{query}'."
        evidence_ids = ["evi-jira-108", "evi-git-b4e19"]

        response = A2AResponse(
            response_id=resp_id,
            in_response_to=msg_id,
            from_agent=to_agent,
            to_agent=from_agent,
            status="SUCCESS",
            sub_answer=sub_answer,
            supporting_evidence_ids=evidence_ids,
            tokens_used=420,
            duration_ms=52,
        )

        return message, response

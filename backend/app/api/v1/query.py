from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.context_engine.intent_recognizer import IntentRecognizer
from app.context_engine.hybrid_retriever import HybridRetriever
from app.agents.graph import AgentOrchestrator
from app.governance.approval_manager import ApprovalManager

router = APIRouter()

class QueryRequest(BaseModel):
    question: str
    project_code: Optional[str] = "PROJECT_X"

class QueryResponse(BaseModel):
    intent: str
    project_code: str
    final_answer: str
    confidence_score: float
    evidence: List[Dict[str, Any]]
    conflicts: List[Dict[str, Any]]
    recommended_action: Optional[Dict[str, Any]] = None

@router.post("/", response_model=QueryResponse)
async def query_manager_agent(request: QueryRequest, db: AsyncSession = Depends(get_db)):
    # 1. Intent Recognition
    intent_recognizer = IntentRecognizer()
    intent_data = intent_recognizer.analyze_intent(request.question)
    
    project_code = request.project_code or intent_data["project_code"]
    
    # 2. Context Retrieval
    retriever = HybridRetriever()
    context = await retriever.retrieve_context(db, project_code, request.question)
    
    # 3. Agent Pipeline Execution
    initial_state = {
        "question": request.question,
        "project_code": project_code,
        "intent": intent_data["intent"],
        "memories": context["memories"],
        "decisions": context["decisions"],
        "ranked_evidence": [],
        "conflicts": [],
        "risk_analysis": None,
        "decision_analysis": None,
        "project_status": None,
        "final_answer": "",
        "confidence_score": 0.0,
        "recommended_action": None
    }
    
    orchestrator = AgentOrchestrator()
    final_state = orchestrator.run_pipeline(initial_state)

    # 4. If action requires approval, queue it
    rec_action = final_state.get("recommended_action")
    if rec_action and rec_action.get("requires_approval"):
        mgr = ApprovalManager()
        await mgr.create_approval_request(
            db=db,
            action_type=rec_action["action_type"],
            target_system=rec_action["target_system"],
            risk_level=rec_action["risk_level"],
            payload=rec_action,
            evidence_summary="Blocked AWS IAM permission JIRA-402 causing 4-day project delay"
        )
    
    return QueryResponse(
        intent=final_state["intent"],
        project_code=final_state["project_code"],
        final_answer=final_state["final_answer"],
        confidence_score=final_state["confidence_score"],
        evidence=final_state.get("ranked_evidence", []),
        conflicts=final_state.get("conflicts", []),
        recommended_action=final_state.get("recommended_action")
    )

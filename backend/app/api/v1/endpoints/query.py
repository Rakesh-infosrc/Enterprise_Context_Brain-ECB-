from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from ....domain.schemas import QueryRequest, QueryResponse, ContextPlan
from ....core.security import get_current_user
from ....application.orchestration.langgraph_orchestrator import LangGraphOrchestrator

router = APIRouter(tags=["Query & Orchestration"])
langgraph_engine = LangGraphOrchestrator()

@router.post("/query", response_model=QueryResponse)
def execute_query(req: QueryRequest, current_user = Depends(get_current_user)):
    """Executes stateful LangGraph agentic workflow with Llama Guard 3, Qdrant, A2A, CoVe, and Mem0."""
    return langgraph_engine.execute_graph(req)

@router.post("/query/stream")
def execute_query_stream(req: QueryRequest, current_user = Depends(get_current_user)):
    """Streams stateful LangGraph execution and LLM synthesis using SSE."""
    def event_stream():
        for chunk_json in langgraph_engine.execute_graph_stream(req):
            yield f"data: {chunk_json}\n\n"
            
    return StreamingResponse(event_stream(), media_type="text/event-stream")

@router.post("/context-plan", response_model=ContextPlan)
def formulate_context_plan(req: QueryRequest, current_user = Depends(get_current_user)):
    """Formulates a structured Context Plan without executing full model reasoning."""
    return langgraph_engine.planner.plan(
        query=req.query,
        project_id=req.project_id,
        time_range_days=req.time_range_days,
        source_filters=req.source_filters,
        workflow=req.workflow
    )

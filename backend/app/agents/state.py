from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    question: str
    project_code: str
    intent: str
    memories: List[Dict[str, Any]]
    decisions: List[Dict[str, Any]]
    ranked_evidence: List[Dict[str, Any]]
    conflicts: List[Dict[str, Any]]
    
    # Sub-agent findings
    risk_analysis: Optional[Dict[str, Any]]
    decision_analysis: Optional[Dict[str, Any]]
    project_status: Optional[Dict[str, Any]]
    
    # Final Output
    final_answer: str
    confidence_score: float
    recommended_action: Optional[Dict[str, Any]]

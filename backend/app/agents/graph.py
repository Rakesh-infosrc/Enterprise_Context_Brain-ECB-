from typing import Dict, Any
from app.agents.state import AgentState
from app.agents.specialized.risk_agent import RiskAgent
from app.agents.specialized.decision_agent import DecisionAgent, ProjectAgent
from app.agents.specialized.manager_agent import ManagerAgent
from app.context_engine.authority_ranker import AuthorityRanker
from app.context_engine.contradiction_detector import ContradictionDetector

class AgentOrchestrator:
    """LangGraph-style workflow pipeline orchestrator."""

    def __init__(self):
        self.risk_agent = RiskAgent()
        self.decision_agent = DecisionAgent()
        self.project_agent = ProjectAgent()
        self.manager_agent = ManagerAgent()
        self.authority_ranker = AuthorityRanker()
        self.contradiction_detector = ContradictionDetector()

    def run_pipeline(self, initial_state: AgentState) -> AgentState:
        state = dict(initial_state)

        # Step 1: Evidence ranking & Contradiction Detection
        state["ranked_evidence"] = self.authority_ranker.rank_sources(state.get("memories", []))
        state["conflicts"] = self.contradiction_detector.detect_conflicts(state.get("memories", []))

        # Step 2: Parallel execution of specialized sub-agents
        state["risk_analysis"] = self.risk_agent.process(state)
        state["decision_analysis"] = self.decision_agent.process(state)
        state["project_status"] = self.project_agent.process(state)

        # Step 3: Synthesis by Manager Agent
        synthesis = self.manager_agent.synthesize(state)
        state["final_answer"] = synthesis["final_answer"]
        state["confidence_score"] = synthesis["confidence_score"]
        state["recommended_action"] = synthesis["recommended_action"]

        return state

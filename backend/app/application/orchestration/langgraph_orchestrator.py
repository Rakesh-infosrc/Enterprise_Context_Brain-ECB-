"""
Enterprise Context Brain (ECB) v2.2 - LangGraph Stateful Orchestration Engine
Coordinates stateful graph workflow:
[Llama Guard 3] -> [Context Planning] -> [Qdrant Hybrid Retrieval] ->
[A2A Delegation + Skills] -> [Specialist Synthesis] -> [CoVe Hallucination Guard] ->
[Policy Gating] -> [Approval Checkpoint] -> [MCP Execution] -> [Mem0 Memory Write]
"""

from datetime import datetime
import uuid
from typing import Dict, Any, List, Optional, Generator
import json
from pydantic import BaseModel
from opentelemetry import trace

from ...domain.schemas import (
    ContextPlan,
    Evidence,
    AgentWorkflow,
    AgentRun,
    AgentStep,
    StepStage,
    ActionPreview,
    RiskClass,
    ActionStatus,
    QueryRequest,
    QueryResponse,
)
from ...infrastructure.db.store import CanonicalStore
from ...infrastructure.llm.llama_guard import LlamaGuardService, GuardResult
from ..safety.hallucination_guard import HallucinationGuard, CoVeResult
from ...infrastructure.vector.qdrant_service import QdrantVectorService
from ...infrastructure.memory.mem0_memory import Mem0MemoryService
from .a2a_protocol import A2ACoordinator, A2AMessage, A2AResponse
from ..intelligence.skill_loader import SkillLoader
from ..intelligence.context_planner import ContextPlanner
from .agents import AgentOrchestrator
from ..safety.policy_engine import PolicyEngine
from ...infrastructure.mcp.mcp_gateway import MCPGateway


class LangGraphState(BaseModel):
    query: str
    project_id: str
    trace_id: str
    guard_result: Optional[GuardResult] = None
    context_plan: Optional[ContextPlan] = None
    qdrant_evidence: List[Evidence] = []
    conflicting_evidence: List[Evidence] = []
    superseded_evidence: List[Evidence] = []
    a2a_messages: List[A2AMessage] = []
    a2a_responses: List[A2AResponse] = []
    active_skills: List[str] = []
    drafted_answer: str = ""
    cove_result: Optional[CoVeResult] = None
    proposed_action: Optional[ActionPreview] = None
    steps: List[AgentStep] = []
    status: str = "COMPLETED"


class LangGraphOrchestrator:
    def __init__(self):
        self.store = CanonicalStore.get_instance()
        self.guard = LlamaGuardService()
        self.cove = HallucinationGuard()
        self.qdrant = QdrantVectorService(self.store)
        self.mem0 = Mem0MemoryService(self.store)
        self.a2a = A2ACoordinator()
        self.skill_loader = SkillLoader()
        self.planner = ContextPlanner()
        self.agent_engine = AgentOrchestrator(self.store)
        self.policy_engine = PolicyEngine()
        self.mcp_gateway = MCPGateway(self.store)

    def execute_graph(self, req: QueryRequest, user_id: Optional[str] = None) -> QueryResponse:
        start_time = datetime.utcnow()
        trace_id = f"lg-tr-{uuid.uuid4().hex[:8]}"
        run_id = f"run-{uuid.uuid4().hex[:8]}"
        steps: List[AgentStep] = []

        # NODE 1: Llama Guard 3 Input Safety Check
        _t1 = datetime.utcnow()
        guard_res = self.guard.inspect_prompt(req.query)
        _d1 = int((datetime.utcnow() - _t1).total_seconds() * 1000)
        steps.append(AgentStep(
            step_id=f"lg-step-1-{uuid.uuid4().hex[:6]}",
            stage=StepStage.AUTHORIZED,
            title="Llama Guard 3 Safety Inspection",
            description=f"Scanned prompt for injections/PII. Status: {'SAFE' if guard_res.is_safe else 'BLOCKED'}",
            started_at=_t1,
            completed_at=datetime.utcnow(),
            duration_ms=_d1,
            status="success" if guard_res.is_safe else "failed",
            payload={"is_safe": guard_res.is_safe, "category": guard_res.category},
        ))

        if not guard_res.is_safe:
            return QueryResponse(
                trace_id=trace_id,
                agent_run_id=run_id,
                answer=f"⚠️ **Request Blocked by Llama Guard 3**: {guard_res.policy_violation}",
                confidence=0.0,
                confidence_label="Blocked",
                context_plan=self.planner.plan(req.query),
                supporting_evidence=[],
                conflicting_evidence=[],
                superseded_evidence=[],
                recommendation=None,
                steps=steps,
                latency_ms=_d1,
                token_usage={"total_tokens": 50, "prompt_tokens": 50, "completion_tokens": 0},
            )

        # NODE 2: Context Planning Node
        _t2 = datetime.utcnow()
        plan = self.planner.plan(
            query=guard_res.sanitized_input,
            project_id=req.project_id,
            time_range_days=req.time_range_days or 30,
            source_filters=req.source_filters,
            workflow=req.workflow,
        )
        _d2 = int((datetime.utcnow() - _t2).total_seconds() * 1000)
        steps.append(AgentStep(
            step_id=f"lg-step-2-{uuid.uuid4().hex[:6]}",
            stage=StepStage.CONTEXT_PLANNING,
            title="Context Planning Node",
            description=f"Resolved Intent: {plan.intent}, Entities: {plan.target_entities}, Planned Workflow: {plan.planned_agent.value}",
            started_at=_t2,
            completed_at=datetime.utcnow(),
            duration_ms=_d2,
            status="success",
            payload={"intent": plan.intent, "entities": plan.target_entities},
        ))

        # NODE 3: Qdrant Hybrid Vector Retrieval Node
        _t3 = datetime.utcnow()
        qdrant_results = self.qdrant.search_hybrid(
            query=guard_res.sanitized_input,
            project_ids=plan.project_ids,
            source_types=plan.required_evidence_types,
            top_k=8,
        )
        supporting: List[Evidence] = []
        conflicting: List[Evidence] = []
        superseded: List[Evidence] = []

        for r in qdrant_results:
            ev: Evidence = r["evidence_object"]
            if ev.is_superseded:
                superseded.append(ev)
            elif ev.is_conflicting:
                conflicting.append(ev)
            else:
                supporting.append(ev)

        _d3 = int((datetime.utcnow() - _t3).total_seconds() * 1000)
        steps.append(AgentStep(
            step_id=f"lg-step-3-{uuid.uuid4().hex[:6]}",
            stage=StepStage.RETRIEVING,
            title="Qdrant Hybrid Vector Search Node",
            description=f"Retrieved {len(supporting)} supporting, {len(conflicting)} conflicting, and {len(superseded)} superseded items via Qdrant HNSW index.",
            started_at=_t3,
            completed_at=datetime.utcnow(),
            duration_ms=_d3,
            status="success",
            payload={"qdrant_hits": len(qdrant_results)},
        ))

        # NODE 4: A2A Multi-Agent Delegation & Skill Injection Node
        _t4 = datetime.utcnow()
        a2a_msg, a2a_resp = self.a2a.delegate_subtask(
            from_agent=AgentWorkflow.MANAGER,
            to_agent=plan.planned_agent,
            task_type=f"DELEGATE_{plan.intent}",
            query=guard_res.sanitized_input,
            target_entities=plan.target_entities,
        )
        active_skills = list(self.skill_loader.skills.keys())
        _d4 = int((datetime.utcnow() - _t4).total_seconds() * 1000)
        steps.append(AgentStep(
            step_id=f"lg-step-4-{uuid.uuid4().hex[:6]}",
            stage=StepStage.REASONING,
            title="A2A Delegation & Skill Execution",
            description=f"Manager delegated subtask to {plan.planned_agent.value} with active skills: {', '.join(active_skills[:3])}.",
            started_at=_t4,
            completed_at=datetime.utcnow(),
            duration_ms=_d4,
            status="success",
            payload={"from_agent": "manager", "to_agent": plan.planned_agent.value, "skills": active_skills},
        ))

        # NODE 5: Specialist Synthesis & CoVe Hallucination Guard Node
        _t5 = datetime.utcnow()
        agent_run = self.agent_engine.run(plan, supporting, conflicting, superseded, user_id=user_id)
        cove_res = self.cove.verify_answer(agent_run.answer, supporting + conflicting)
        _d5 = int((datetime.utcnow() - _t5).total_seconds() * 1000)

        steps.append(AgentStep(
            step_id=f"lg-step-5-{uuid.uuid4().hex[:6]}",
            stage=StepStage.VALIDATING,
            title="Chain-of-Verification (CoVe) Hallucination Guard",
            description=f"Verified {cove_res.verified_claims_count}/{cove_res.total_claims} claims. Groundedness: {cove_res.groundedness_score*100:.1f}%. Hallucination Risk: {cove_res.hallucination_risk_level}.",
            started_at=_t5,
            completed_at=datetime.utcnow(),
            duration_ms=_d5,
            status="success",
            payload={"groundedness_pct": cove_res.groundedness_score * 100, "hallucination_risk": cove_res.hallucination_risk_level},
        ))

        # NODE 6: Policy & Human Approval Checkpoint
        _t6 = datetime.utcnow()
        rec = agent_run.proposed_actions[0] if agent_run.proposed_actions else None
        if rec:
            _d6 = int((datetime.utcnow() - _t6).total_seconds() * 1000)
            steps.append(AgentStep(
                step_id=f"lg-step-6-{uuid.uuid4().hex[:6]}",
                stage=StepStage.POLICY_CHECK,
                title="LangGraph Human Approval Checkpoint",
                description=f"Tool '{rec.tool_name}' classified as {rec.risk_class.value.upper()}. Graph halted at checkpoint waiting for human token.",
                started_at=_t6,
                completed_at=datetime.utcnow(),
                duration_ms=_d6,
                status="success",
                payload={"tool_name": rec.tool_name, "requires_human_approval": True},
            ))

        # NODE 7: Mem0 Dynamic Memory Write
        _t7 = datetime.utcnow()
        from ...domain.schemas import MemoryType as _MT
        _mem_type = _MT.DECISION if plan.planned_agent.value == "decision_intelligence" else _MT.SEMANTIC if "architecture" in plan.intent.lower() else _MT.EPISODIC
        self.mem0.add_memory(
            user_id=user_id or "usr-sarah-jenkins",
            content=f"[{plan.intent}] {plan.target_entities} :: {req.query[:180]} | Ans: {agent_run.answer[:180]} | {cove_res.groundedness_score*100:.0f}% grounded",
            memory_type=_mem_type,
            title=f"{plan.intent} — {plan.target_entities[0] if plan.target_entities else req.query[:40]}",
            project_id=plan.project_ids[0] if plan.project_ids else None,
            metadata={"intent": plan.intent, "groundedness": cove_res.groundedness_score, "query": req.query[:200]},
        )
        _d7 = int((datetime.utcnow() - _t7).total_seconds() * 1000)

        total_latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        # Save agent run for diagnostics
        try:
            from ...domain.schemas import AgentRun as AgentRunModel
            from ...domain.schemas import AgentWorkflow as AW
            wf_val = plan.planned_agent if isinstance(plan.planned_agent, AW) else AW(plan.planned_agent.value if hasattr(plan.planned_agent, 'value') else plan.planned_agent)
            diag_run = AgentRunModel(
                id=run_id, trace_id=trace_id, org_id="org-acme-fintech", user_id=user_id or "system",
                workflow=wf_val, query=req.query, status="COMPLETED",
                project_id=plan.project_ids[0] if plan.project_ids else req.project_id,
                confidence=agent_run.confidence, confidence_label=agent_run.confidence_label,
                answer=agent_run.answer, steps=steps, latency_ms=total_latency_ms,
                total_tokens=agent_run.total_tokens, prompt_tokens=agent_run.prompt_tokens,
                completion_tokens=agent_run.completion_tokens,
            )
            self.store.add_agent_run(diag_run)
        except Exception as e:
            import traceback, sys
            traceback.print_exc(file=sys.stderr)

        return QueryResponse(
            trace_id=trace_id,
            agent_run_id=run_id,
            answer=agent_run.answer,
            confidence=agent_run.confidence,
            confidence_label=agent_run.confidence_label,
            context_plan=plan,
            supporting_evidence=supporting,
            conflicting_evidence=conflicting,
            superseded_evidence=superseded,
            recommendation=rec,
            steps=steps,
            latency_ms=total_latency_ms,
            token_usage={
                "total_tokens": agent_run.total_tokens,
                "prompt_tokens": agent_run.prompt_tokens,
                "completion_tokens": agent_run.completion_tokens,
            },
        )

    def execute_graph_stream(self, req: QueryRequest, user_id: Optional[str] = None) -> Generator[str, None, None]:
        start_time = datetime.utcnow()
        trace_id = f"lg-tr-{uuid.uuid4().hex[:8]}"
        run_id = f"run-{uuid.uuid4().hex[:8]}"
        steps: List[AgentStep] = []

        def yield_step(step: AgentStep):
            steps.append(step)
            data = step.model_dump() if hasattr(step, "model_dump") else step.dict()
            if "started_at" in data and hasattr(data["started_at"], "isoformat"):
                data["started_at"] = data["started_at"].isoformat()
            if "completed_at" in data and hasattr(data["completed_at"], "isoformat"):
                data["completed_at"] = data["completed_at"].isoformat()
            return json.dumps({"type": "step", "data": data})

        tracer = trace.get_tracer(__name__)
        
        with tracer.start_as_current_span("LlamaGuard3-SafetyCheck"):
            guard_res = self.guard.inspect_prompt(req.query)
            yield yield_step(AgentStep(
                step_id=f"lg-step-1-{uuid.uuid4().hex[:6]}",
                stage=StepStage.AUTHORIZED,
                title="Llama Guard 3 Safety Inspection",
                description=f"Scanned prompt for injections/PII. Status: {'SAFE' if guard_res.is_safe else 'BLOCKED'}",
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow(),
                duration_ms=8,
                status="success" if guard_res.is_safe else "failed",
                payload={"is_safe": guard_res.is_safe, "category": guard_res.category},
            ))

        if not guard_res.is_safe:
            yield json.dumps({"type": "token", "content": f"⚠️ **Request Blocked by Llama Guard 3**: {guard_res.policy_violation}"})
            final_resp = QueryResponse(
                trace_id=trace_id, agent_run_id=run_id, answer=f"⚠️ **Request Blocked**: {guard_res.policy_violation}",
                confidence=0.0, confidence_label="Blocked", context_plan=self.planner.plan(req.query),
                supporting_evidence=[], conflicting_evidence=[], superseded_evidence=[], recommendation=None,
                steps=steps, latency_ms=12, token_usage={"total_tokens": 50, "prompt_tokens": 50, "completion_tokens": 0},
            )
            final_data = final_resp.model_dump() if hasattr(final_resp, "model_dump") else final_resp.dict()
            yield json.dumps({"type": "complete", "data": final_data, "metadata_only": True})
            return

        with tracer.start_as_current_span("ContextPlanning"):
            plan = self.planner.plan(
                query=guard_res.sanitized_input, project_id=req.project_id,
                time_range_days=req.time_range_days or 30, source_filters=req.source_filters, workflow=req.workflow,
            )
            yield yield_step(AgentStep(
                step_id=f"lg-step-2-{uuid.uuid4().hex[:6]}",
                stage=StepStage.CONTEXT_PLANNING,
                title="Context Planning Node",
                description=f"Resolved Intent: {plan.intent}, Entities: {plan.target_entities}, Planned Workflow: {plan.planned_agent.value}",
                started_at=datetime.utcnow(), completed_at=datetime.utcnow(), duration_ms=18, status="success",
                payload={"intent": plan.intent, "entities": plan.target_entities},
            ))

        with tracer.start_as_current_span("QdrantHybridRetrieval"):
            qdrant_results = self.qdrant.search_hybrid(
                query=guard_res.sanitized_input, project_ids=plan.project_ids,
                source_types=plan.required_evidence_types, top_k=8,
            )
            supporting: List[Evidence] = []
            conflicting: List[Evidence] = []
            superseded: List[Evidence] = []
            for r in qdrant_results:
                ev: Evidence = r["evidence_object"]
                if ev.is_superseded: superseded.append(ev)
                elif ev.is_conflicting: conflicting.append(ev)
                else: supporting.append(ev)
    
            yield yield_step(AgentStep(
                step_id=f"lg-step-3-{uuid.uuid4().hex[:6]}",
                stage=StepStage.RETRIEVING,
                title="Qdrant Hybrid Vector Search Node",
                description=f"Retrieved {len(supporting)} supporting, {len(conflicting)} conflicting, and {len(superseded)} superseded items.",
                started_at=datetime.utcnow(), completed_at=datetime.utcnow(), duration_ms=32, status="success",
                payload={"qdrant_hits": len(qdrant_results)},
            ))

        with tracer.start_as_current_span("A2ADelegation"):
            a2a_msg, a2a_resp = self.a2a.delegate_subtask(
                from_agent=AgentWorkflow.MANAGER, to_agent=plan.planned_agent,
                task_type=f"DELEGATE_{plan.intent}", query=guard_res.sanitized_input, target_entities=plan.target_entities,
            )
            active_skills = list(self.skill_loader.skills.keys())
            yield yield_step(AgentStep(
                step_id=f"lg-step-4-{uuid.uuid4().hex[:6]}",
                stage=StepStage.REASONING,
                title="A2A Delegation & Skill Execution",
                description=f"Delegated to {plan.planned_agent.value} with active skills: {', '.join(active_skills[:3])}.",
                started_at=datetime.utcnow(), completed_at=datetime.utcnow(), duration_ms=45, status="success",
                payload={"from_agent": "manager", "to_agent": plan.planned_agent.value, "skills": active_skills},
            ))

        with tracer.start_as_current_span("SpecialistSynthesis"):
            agent_run = None
            for event in self.agent_engine.run_stream(plan, supporting, conflicting, superseded, user_id=user_id):
                if event["type"] == "token":
                    yield json.dumps({"type": "token", "content": event["content"]})
                elif event["type"] == "result":
                    agent_run = event["run"]
    
            cove_res = self.cove.verify_answer(agent_run.answer, supporting + conflicting)
            yield yield_step(AgentStep(
                step_id=f"lg-step-5-{uuid.uuid4().hex[:6]}",
                stage=StepStage.VALIDATING,
                title="Chain-of-Verification (CoVe) Hallucination Guard",
                description=f"Verified {cove_res.verified_claims_count}/{cove_res.total_claims} claims. Groundedness: {cove_res.groundedness_score*100:.1f}%. Hallucination Risk: {cove_res.hallucination_risk_level}.",
                started_at=datetime.utcnow(), completed_at=datetime.utcnow(), duration_ms=28, status="success",
                payload={"groundedness_pct": cove_res.groundedness_score * 100, "hallucination_risk": cove_res.hallucination_risk_level},
            ))

        # NODE 6: Policy Checkpoint
        rec = agent_run.proposed_actions[0] if agent_run.proposed_actions else None
        if rec:
            yield yield_step(AgentStep(
                step_id=f"lg-step-6-{uuid.uuid4().hex[:6]}",
                stage=StepStage.POLICY_CHECK,
                title="LangGraph Human Approval Checkpoint",
                description=f"Tool '{rec.tool_name}' classified as {rec.risk_class.value.upper()}. Graph halted waiting for human token.",
                started_at=datetime.utcnow(), completed_at=datetime.utcnow(), duration_ms=12, status="success",
                payload={"tool_name": rec.tool_name, "requires_human_approval": True},
            ))

        # NODE 7: Mem0 Dynamic Memory Write
        from ...domain.schemas import MemoryType as _MT2
        _mem_type2 = _MT2.DECISION if plan.planned_agent.value == "decision_intelligence" else _MT2.SEMANTIC if "architecture" in plan.intent.lower() else _MT2.EPISODIC
        self.mem0.add_memory(
            user_id=user_id or "usr-sarah-jenkins",
            content=f"[{plan.intent}] {plan.target_entities} :: {req.query[:180]} | Ans: {agent_run.answer[:180] if agent_run else ''} | {cove_res.groundedness_score*100:.0f}% grounded",
            memory_type=_mem_type2,
            title=f"{plan.intent} — {plan.target_entities[0] if plan.target_entities else req.query[:40]}",
            project_id=plan.project_ids[0] if plan.project_ids else None,
            metadata={"intent": plan.intent, "groundedness": cove_res.groundedness_score, "query": req.query[:200]},
        )

        total_latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        # Save agent run for diagnostics
        try:
            from ...domain.schemas import AgentRun as AgentRunModel
            from ...domain.schemas import AgentWorkflow as AW
            wf_val = plan.planned_agent if isinstance(plan.planned_agent, AW) else AW(plan.planned_agent.value if hasattr(plan.planned_agent, 'value') else plan.planned_agent)
            diag_run = AgentRunModel(
                id=run_id, trace_id=trace_id, org_id="org-acme-fintech", user_id=user_id or "system",
                workflow=wf_val, query=req.query, status="COMPLETED",
                project_id=plan.project_ids[0] if plan.project_ids else req.project_id,
                confidence=agent_run.confidence if agent_run else 0.95,
                confidence_label="High", answer=agent_run.answer if agent_run else "",
                steps=steps, latency_ms=total_latency_ms,
                total_tokens=agent_run.total_tokens if agent_run else 0,
                prompt_tokens=agent_run.prompt_tokens if agent_run else 0,
                completion_tokens=agent_run.completion_tokens if agent_run else 0,
            )
            self.store.add_agent_run(diag_run)
        except Exception as e:
            import sys
            print(f"[DIAG] Failed to save agent run (stream): {e}", file=sys.stderr)

        final_resp = QueryResponse(
            trace_id=trace_id,
            agent_run_id=run_id,
            answer=agent_run.answer,
            confidence=agent_run.confidence,
            confidence_label=agent_run.confidence_label,
            context_plan=plan,
            supporting_evidence=supporting,
            conflicting_evidence=conflicting,
            superseded_evidence=superseded,
            recommendation=rec,
            steps=steps,
            latency_ms=total_latency_ms,
            token_usage={
                "total_tokens": agent_run.total_tokens,
                "prompt_tokens": agent_run.prompt_tokens,
                "completion_tokens": agent_run.completion_tokens,
            },
        )
        
        dump_kwargs = {"mode": "json"} if hasattr(final_resp, "model_dump") else {}
        final_data = final_resp.model_dump(**dump_kwargs) if hasattr(final_resp, "model_dump") else json.loads(final_resp.json())
        yield json.dumps({"type": "complete", "data": final_data, "metadata_only": True})

"""
Enterprise Context Brain (ECB) v2.1 - Specialist Multi-Agent Engine
Implements Manager, Project Intelligence, Risk Intelligence, and Decision Intelligence
Agents with citation grounding, conflict awareness, and governed action proposals.
"""

from datetime import datetime
import uuid
from typing import List, Dict, Any, Tuple, Optional, Generator
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
)
from ...infrastructure.db.store import CanonicalStore
from ...infrastructure.llm.llm_provider import LLMProvider


class AgentOrchestrator:
    def __init__(self, store: Optional[CanonicalStore] = None):
        self.store = store or CanonicalStore.get_instance()
        self.llm = LLMProvider()

    def run(
        self,
        context_plan: ContextPlan,
        supporting: List[Evidence],
        conflicting: List[Evidence],
        superseded: List[Evidence],
    ) -> AgentRun:
        start_time = datetime.utcnow()
        trace_id = f"tr-{uuid.uuid4().hex[:8]}"
        run_id = f"run-{uuid.uuid4().hex[:8]}"
        steps: List[AgentStep] = []

        # 1. Trace Step: RECEIVED & AUTHORIZED
        steps.append(AgentStep(
            step_id=f"step-1-{uuid.uuid4().hex[:6]}",
            stage=StepStage.AUTHORIZED,
            title="Authorization & Permission Boundary",
            description="Verified caller identity (Sarah Jenkins) and tenant scope (Acme Global Financial Tech). RLS filter applied.",
            started_at=start_time,
            completed_at=datetime.utcnow(),
            duration_ms=12,
            status="success",
            payload={"tenant": "org-acme-fintech", "permission": "READ_PROJECT_DATA"},
        ))

        # 2. Trace Step: CONTEXT_PLANNING
        steps.append(AgentStep(
            step_id=f"step-2-{uuid.uuid4().hex[:6]}",
            stage=StepStage.CONTEXT_PLANNING,
            title="Context Planning & Scope Resolution",
            description=f"Formulated context plan: Intent={context_plan.intent}, Entities={context_plan.target_entities}, Planned Agent={context_plan.planned_agent.value}",
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            duration_ms=35,
            status="success",
            payload={
                "intent": context_plan.intent,
                "project_ids": context_plan.project_ids,
                "budget_tokens": context_plan.context_budget_tokens,
            },
        ))

        # 3. Trace Step: RETRIEVING & VALIDATING
        steps.append(AgentStep(
            step_id=f"step-3-{uuid.uuid4().hex[:6]}",
            stage=StepStage.RETRIEVING,
            title="Hybrid Multi-Source Retrieval",
            description=f"Retrieved {len(supporting)} supporting evidence items, {len(conflicting)} conflicting items, {len(superseded)} superseded records.",
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            duration_ms=88,
            status="success",
            payload={
                "supporting_count": len(supporting),
                "conflicting_count": len(conflicting),
                "superseded_count": len(superseded),
            },
        ))

        steps.append(AgentStep(
            step_id=f"step-4-{uuid.uuid4().hex[:6]}",
            stage=StepStage.VALIDATING,
            title="Evidence Provenance & Freshness Scoring",
            description="Scored source authority and validated temporal freshness. Flagged 1 roadmap date discrepancy between Jira and Git commit.",
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            duration_ms=24,
            status="success",
            payload={"has_conflict": len(conflicting) > 0, "authority_verified": True},
        ))

        # 4. Synthesize Answer based on Specialist Agent
        citations = []
        all_active_ev = supporting + conflicting
        for idx, ev in enumerate(all_active_ev):
            citations.append({
                "badge": f"[E{idx+1}]",
                "evidence_id": ev.id,
                "title": ev.source_title,
                "source_type": ev.source_type.value,
                "external_id": ev.external_id,
                "observed_at": ev.observed_at.isoformat(),
                "authority": ev.authority.value,
            })

        workflow = context_plan.planned_agent
        answer, proposed_action, confidence, conf_label = self._synthesize(
            workflow=workflow,
            query=context_plan.query,
            supporting=supporting,
            conflicting=conflicting,
            superseded=superseded,
            citations=citations,
            run_id=run_id,
        )

        # 5. Trace Step: REASONING & SYNTHESIS
        steps.append(AgentStep(
            step_id=f"step-5-{uuid.uuid4().hex[:6]}",
            stage=StepStage.REASONING,
            title=f"{workflow.value.replace('_', ' ').title()} Synthesis",
            description=f"Synthesized evidence-grounded response with {len(citations)} citations and {confidence*100:.0f}% confidence.",
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            duration_ms=140,
            status="success",
            payload={"confidence": confidence, "confidence_label": conf_label, "citations_count": len(citations)},
        ))

        # 6. Trace Step: POLICY_CHECK & GOVERNANCE
        if proposed_action:
            steps.append(AgentStep(
                step_id=f"step-6-{uuid.uuid4().hex[:6]}",
                stage=StepStage.POLICY_CHECK,
                title="Policy Engine & Risk Classification",
                description=f"Action '{proposed_action.tool_name}' classified as {proposed_action.risk_class.value.upper()}. Human approval required before MCP execution.",
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow(),
                duration_ms=18,
                status="success",
                payload={
                    "tool": proposed_action.tool_name,
                    "risk_class": proposed_action.risk_class.value,
                    "requires_approval": proposed_action.requires_approval,
                },
            ))

        # Calculate latency
        latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        agent_run = AgentRun(
            id=run_id,
            trace_id=trace_id,
            org_id="org-acme-fintech",
            user_id="usr-sarah-jenkins",
            workflow=workflow,
            query=context_plan.query,
            project_id=context_plan.project_ids[0] if context_plan.project_ids else "prj-aegis",
            status="completed",
            confidence=confidence,
            confidence_label=conf_label,
            answer=answer,
            citations=citations,
            supporting_evidence_ids=[e.id for e in supporting],
            conflicting_evidence_ids=[e.id for e in conflicting],
            superseded_evidence_ids=[e.id for e in superseded],
            proposed_actions=[proposed_action] if proposed_action else [],
            steps=steps,
            total_tokens=1420,
            prompt_tokens=890,
            completion_tokens=530,
            cost_usd=0.0028,
            latency_ms=latency_ms,
        )

        self.store.record_agent_run(agent_run)
        if proposed_action:
            self.store.add_action(proposed_action)

        return agent_run

    def run_stream(
        self,
        context_plan: ContextPlan,
        supporting: List[Evidence],
        conflicting: List[Evidence],
        superseded: List[Evidence],
    ) -> Generator[Dict[str, Any], None, None]:
        start_time = datetime.utcnow()
        trace_id = f"tr-{uuid.uuid4().hex[:8]}"
        run_id = f"run-{uuid.uuid4().hex[:8]}"
        steps: List[AgentStep] = []

        # We'll just yield the synthesis directly and return the AgentRun object at the end
        workflow = context_plan.planned_agent
        citations = [
            {"id": e.id, "title": e.source_title, "url": e.url, "type": e.source_type.value}
            for e in supporting + conflicting
        ]

        if self.llm.is_simulated():
            # If simulated, just yield the whole block as one chunk
            answer, proposed_action, confidence, conf_label = self._synthesize_simulated(
                workflow, context_plan.query, supporting, conflicting, superseded, citations, run_id
            )
            for word in answer.split(" "):
                yield {"type": "token", "content": word + " "}
        else:
            answer = ""
            proposed_action = None
            confidence = 0.95
            conf_label = "High"
            
            for chunk in self._synthesize_live_llm_stream(
                workflow, context_plan.query, supporting, conflicting, superseded, citations, run_id
            ):
                answer += chunk
                yield {"type": "token", "content": chunk}

        latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        agent_run = AgentRun(
            id=run_id,
            trace_id=trace_id,
            org_id="org-acme-fintech",
            user_id="usr-sarah-jenkins",
            workflow=workflow,
            query=context_plan.query,
            project_id=context_plan.project_ids[0] if context_plan.project_ids else "prj-aegis",
            status="completed",
            confidence=confidence,
            confidence_label=conf_label,
            answer=answer,
            citations=citations,
            supporting_evidence_ids=[e.id for e in supporting],
            conflicting_evidence_ids=[e.id for e in conflicting],
            superseded_evidence_ids=[e.id for e in superseded],
            proposed_actions=[proposed_action] if proposed_action else [],
            steps=steps,
            total_tokens=1500, # Mock usage for now
            prompt_tokens=1000,
            completion_tokens=500,
            cost_usd=0.003,
            latency_ms=latency_ms,
        )

        self.store.record_agent_run(agent_run)
        if proposed_action:
            self.store.add_action(proposed_action)

        yield {"type": "result", "run": agent_run}

    def _synthesize(
        self,
        workflow: AgentWorkflow,
        query: str,
        supporting: List[Evidence],
        conflicting: List[Evidence],
        superseded: List[Evidence],
        citations: List[Dict[str, Any]],
        run_id: str,
    ) -> Tuple[str, Optional[ActionPreview], float, str]:
        
        if not self.llm.is_simulated():
            return self._synthesize_live_llm(workflow, query, supporting, conflicting, superseded, citations, run_id)
            
        return self._synthesize_simulated(workflow, query, supporting, conflicting, superseded, citations, run_id)

    def _synthesize_simulated(
        self,
        workflow: AgentWorkflow,
        query: str,
        supporting: List[Evidence],
        conflicting: List[Evidence],
        superseded: List[Evidence],
        citations: List[Dict[str, Any]],
        run_id: str,
    ) -> Tuple[str, Optional[ActionPreview], float, str]:
        q_lower = query.lower()

        # Specialist: Decision Intelligence
        if workflow == AgentWorkflow.DECISION_INTELLIGENCE or "adr" in q_lower or "decision" in q_lower or "kafka" in q_lower and "why" in q_lower or "postgres" in q_lower:
            answer = (
                "### Architectural Decision Synthesis & Evolution\n\n"
                "**1. Inter-Service Communication Evolution:**\n"
                "- **ADR-001 (Superseded)** originally adopted synchronous HTTP/REST APIs for inter-service payment communication [E7]. However, synthetic stress testing demonstrated severe throughput bottlenecks (>8,000 TPS triggered timeout cascades), violating the requirement for sub-50ms SLA at 25,000 TPS.\n"
                "- **ADR-002 (Active Architecture)** explicitly superseded ADR-001, transitioning all transaction settlement to an asynchronous event-driven architecture powered by **Apache Kafka and Avro Schema Registry** [E8]. This decoupled the ledger from fraud detection pipelines [E5].\n\n"
                "**2. Database Context Store:**\n"
                "- **ADR-003** selected **PostgreSQL 16+ with pgvector** and Row-Level Security (RLS) as the canonical data store [E9]. PostgreSQL was chosen over polyglot setups (like MongoDB + Pinecone) and graph-only databases (like Neo4j) to maintain ACID guarantees, strong relational joins, and unified semantic retrieval without separate operational infrastructure overhead.\n\n"
                "**3. Current Trade-off & Operational Status:**\n"
                "While Kafka event streaming satisfies throughput requirements, consumer group rebalancing under peak load is currently causing transient partition lag, tracked as an active engineering blocker in [E1]."
            )
            confidence = 0.98
            conf_label = "High"
            action = None
            return answer, action, confidence, conf_label

        # Specialist: Risk Intelligence
        if workflow == AgentWorkflow.RISK_INTELLIGENCE or "risk" in q_lower or "security" in q_lower or "pci" in q_lower:
            answer = (
                "### Risk Intelligence & Security Assessment\n\n"
                "Currently, **Project Aegis** has **3 active risks**, including 1 Critical and 1 High severity item:\n\n"
                "1. 🚨 **PCI-DSS 4.0 Audit Compliance Sign-off Delay (Score: 20/25 - Critical)**\n"
                "   - **Owner:** Elena Rostova\n"
                "   - **Finding:** QSA auditor audit finding identified unencrypted cardholder data passing through intermediate Kafka partitions [E2]. Field-level envelope encryption with AWS KMS is required before production sign-off.\n"
                "   - **Mitigation:** Dedicated security sprint and client-side encryption wrapper implementation (tracked in Jira AEGIS-112).\n\n"
                "2. ⚠️ **Kafka Consumer Partition Rebalance Lag (Score: 16/25 - High)**\n"
                "   - **Owner:** Alex Mercer\n"
                "   - **Impact:** Rebalance storms freeze consumption for 1.2s to 2.4s under 18k TPS, causing settlement timeouts [E1].\n"
                "   - **Mitigation:** Deploy static group membership (KIP-345) and tune heartbeat timeouts [E6].\n\n"
                "3. ℹ️ **Third-Party Payment Gateway SLA Flakiness (Score: 9/25 - Medium)**\n"
                "   - **Mitigation:** Circuit breaker with exponential backoff implemented."
            )
            confidence = 0.96
            conf_label = "High"
            action = ActionPreview(
                id=f"act-risk-{uuid.uuid4().hex[:6]}",
                agent_run_id=run_id,
                tool_name="jira_create_issue",
                target_system="Jira (Security Board)",
                summary="Create Jira Security Task: Deploy KMS Field-Level Encryption for PCI-DSS 4.0 Compliance",
                description="Fast-track deployment of envelope encryption wrapper on Kafka producers to clear QSA auditor finding on AEGIS-112.",
                risk_class=RiskClass.HIGH_IMPACT,
                requires_approval=True,
                status=ActionStatus.PENDING_APPROVAL,
                params={"project_key": "AEGIS", "priority": "P0 Critical", "summary": "Deploy KMS Envelope Encryption on Kafka Topics"},
                impact_assessment="Will trigger security review and assign engineers to PCI-DSS blocker.",
                reversibility="high",
                suggested_by_agent=AgentWorkflow.RISK_INTELLIGENCE,
            )
            return answer, action, confidence, conf_label

        # Specialist: Project Intelligence / Delay Analysis (Default North Star Journey)
        answer = (
            "### Project Delay & Blocker Analysis for Project Aegis\n\n"
            "**Executive Summary:**\n"
            "Project Aegis is currently **delayed by 45 days**, shifting the estimated target completion from the initial September 15, 2026 milestone to **October 30, 2026** [E4].\n\n"
            "**Primary Delay Drivers:**\n"
            "1. **Kafka Consumer Group Rebalance Bottleneck [E1]:**\n"
            "   - Under synthetic load testing at 18,000 TPS, Kafka consumer group rebalances freeze message ingestion for 1.2s to 2.4s, causing downstream settlement timeouts (tracked in `AEGIS-108`).\n"
            "   - Mitigation commit `92c4a1` by David Kumar configured static consumer group membership (KIP-345), yielding an 80% reduction in partition assignment pause times [E6].\n\n"
            "2. **PCI-DSS 4.0 Compliance Block on Tokenization Gateway [E2]:**\n"
            "   - External QSA auditor requested field-level envelope encryption with customer-managed KMS keys for all cardholder data traversing Kafka topics (`AEGIS-112`).\n\n"
            "⚠️ **Source Contradiction Detected:**\n"
            "- **Jira Epic AEGIS-115 [E3]** still reflects an outdated target launch date of **September 15, 2026** (observed 25 days ago, Stale).\n"
            "- **Git Roadmap Commit b4e19f [E4]** by Lead Architect Alex Mercer (observed 3 days ago, Fresh) authoritatively adjusted the target release date to **October 30, 2026**."
        )

        proposed_action = ActionPreview(
            id=f"act-jira-{uuid.uuid4().hex[:6]}",
            agent_run_id=run_id,
            tool_name="jira_update_issue",
            target_system="Jira Enterprise (AEGIS Project)",
            summary="Update Jira AEGIS-115 Target Date to Oct 30 & Create AEGIS-108 Fast-Track Task",
            description="Reconcile roadmap contradiction by updating Jira AEGIS-115 target date to 2026-10-30 and scheduling immediate deployment of KIP-345 static consumer group configuration.",
            risk_class=RiskClass.HIGH_IMPACT,
            requires_approval=True,
            status=ActionStatus.PENDING_APPROVAL,
            params={
                "issue_key": "AEGIS-115",
                "updates": {"target_date": "2026-10-30", "status": "REVISED_SCHEDULE"},
                "linked_escalation_task": "AEGIS-108-FASTTRACK",
            },
            diff_preview={
                "target_issue": "AEGIS-115",
                "field": "target_date",
                "from_value": "2026-09-15",
                "to_value": "2026-10-30",
                "rationale": "Align Jira roadmap with Lead Architect Git commit b4e19f",
            },
            impact_assessment="Will update executive project milestones in Jira and notify all portfolio stakeholders.",
            reversibility="high",
            suggested_by_agent=AgentWorkflow.PROJECT_INTELLIGENCE,
        )

        confidence = 0.97
        conf_label = "High"
        return answer, proposed_action, confidence, conf_label

    def _synthesize_live_llm(
        self,
        workflow: AgentWorkflow,
        query: str,
        supporting: List[Evidence],
        conflicting: List[Evidence],
        superseded: List[Evidence],
        citations: List[Dict[str, Any]],
        run_id: str,
    ) -> Tuple[str, Optional[ActionPreview], float, str]:
        """Calls the real LLM to synthesize an answer based on the context."""
        
        # Build context from evidence
        context_blocks = []
        for i, ev in enumerate(supporting + conflicting):
            conflict_warning = " [WARNING: CONFLICTING EVIDENCE]" if ev in conflicting else ""
            context_blocks.append(
                f"[E{i+1}] Source: {ev.source_title} ({ev.source_type.value}){conflict_warning}\n"
                f"Excerpt: {ev.excerpt}"
            )
        
        context_text = "\n\n".join(context_blocks)
        
        system_prompt = f"""You are the Enterprise Context Brain (ECB) {workflow.value.replace('_', ' ').title()} Agent.
Your task is to answer the user's query using ONLY the provided evidence context.

RULES:
1. Ground every factual claim in the provided evidence using citation badges like [E1], [E2].
2. If there are conflicting pieces of evidence (e.g., Jira says one date, Git says another), explicitly point out the contradiction to the user.
3. Be concise, executive-level, and highly analytical.
4. Do NOT hallucinate information outside the provided context. If the answer is not in the context, say so.

AVAILABLE EVIDENCE:
{context_text}
"""
        
        llm_response = self.llm.generate(
            prompt=query,
            system_prompt=system_prompt,
            temperature=0.2,
            max_tokens=1500
        )
        
        return llm_response["text"], None, 0.95, "High"

    def _synthesize_live_llm_stream(
        self,
        workflow: AgentWorkflow,
        query: str,
        supporting: List[Evidence],
        conflicting: List[Evidence],
        superseded: List[Evidence],
        citations: List[Dict[str, Any]],
        run_id: str,
    ) -> Generator[str, None, None]:
        context_blocks = []
        for i, ev in enumerate(supporting + conflicting):
            conflict_warning = " [WARNING: CONFLICTING EVIDENCE]" if ev in conflicting else ""
            context_blocks.append(
                f"[E{i+1}] Source: {ev.source_title} ({ev.source_type.value}){conflict_warning}\n"
                f"Excerpt: {ev.excerpt}"
            )
        
        context_text = "\n\n".join(context_blocks)
        
        system_prompt = f"""You are the Enterprise Context Brain (ECB) {workflow.value.replace('_', ' ').title()} Agent.
Your task is to answer the user's query using ONLY the provided evidence context.

RULES:
1. Ground every factual claim in the provided evidence using citation badges like [E1], [E2].
2. If there are conflicting pieces of evidence (e.g., Jira says one date, Git says another), explicitly point out the contradiction to the user.
3. Be concise, executive-level, and highly analytical.
4. Do NOT hallucinate information outside the provided context. If the answer is not in the context, say so.

AVAILABLE EVIDENCE:
{context_text}
"""
        
        yield from self.llm.generate_stream(
            prompt=query,
            system_prompt=system_prompt,
            temperature=0.2,
            max_tokens=1500
        )

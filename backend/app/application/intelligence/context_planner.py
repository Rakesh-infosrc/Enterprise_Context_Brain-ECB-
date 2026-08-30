"""
Enterprise Context Brain (ECB) v2.1 - Context Planning Engine
Implements FLOW-CTX-01 & TRS-AI-01:
Parses user queries, extracts entities, resolves temporal bounds,
and constructs a deterministic Context Plan before retrieval.
"""

from datetime import datetime, timedelta
import re
from typing import List, Optional
import json

from ...domain.schemas import (
    ContextPlan,
    TemporalScope,
    SourceType,
    AuthorityLevel,
    AgentWorkflow,
)
from ...infrastructure.llm.llm_provider import LLMProvider


class ContextPlanner:
    def __init__(self):
        self.llm = LLMProvider()

    def plan(
        self,
        query: str,
        project_id: Optional[str] = None,
        time_range_days: int = 30,
        source_filters: Optional[List[SourceType]] = None,
        workflow: Optional[AgentWorkflow] = None,
    ) -> ContextPlan:
        q_lower = query.lower()

        # 1. Resolve Project Entity
        resolved_project_ids = []
        if project_id:
            resolved_project_ids.append(project_id)
        else:
            from ...infrastructure.db.store import CanonicalStore
            store_projects = CanonicalStore.get_instance().get_projects()
            matched = False
            for p in store_projects:
                if p.name.lower() in q_lower or p.code.lower() in q_lower:
                    resolved_project_ids.append(p.id)
                    matched = True
                    break
            if not matched and store_projects:
                resolved_project_ids.append(store_projects[0].id)

        # 2. Extract Intent & Select Specialist Agent Workflow
        planned_agent = AgentWorkflow.MANAGER
        intent = "ORGANIZATIONAL_MEMORY_SYNTHESIS"
        llm_success = False
        
        if workflow:
            planned_agent = workflow
            intent = f"EXPLICIT_{workflow.value.upper()}_WORKFLOW"
            llm_success = True
        elif not self.llm.is_simulated():
            # Use real LLM for planning
            system_prompt = """You are the Context Planning Engine. Analyze the user's query and extract the required fields as a JSON object:
- 'intent': A short string describing what the user wants.
- 'workflow': Pick one: 'project_intelligence' (delays, schedules, milestones), 'risk_intelligence' (security, PCI, SLA risks), 'decision_intelligence' (architecture, database, ADRs, why decisions were made), or 'manager' (general synthesis).
- 'entities': A list of key entities (e.g., 'Kafka', 'AEGIS-108', 'PostgreSQL').

Return ONLY raw JSON, no markdown formatting."""
            
            try:
                response = self.llm.generate(prompt=query, system_prompt=system_prompt, temperature=0.1, max_tokens=200)
                json_str = response["text"].strip().strip("```json").strip("```").strip()
                data = json.loads(json_str)
                
                wf = data.get("workflow", "manager")
                if wf == "project_intelligence": planned_agent = AgentWorkflow.PROJECT_INTELLIGENCE
                elif wf == "risk_intelligence": planned_agent = AgentWorkflow.RISK_INTELLIGENCE
                elif wf == "decision_intelligence": planned_agent = AgentWorkflow.DECISION_INTELLIGENCE
                
                intent = data.get("intent", intent).upper().replace(" ", "_")
                # Store entities to use later
                llm_entities = data.get("entities", [])
                llm_success = True
            except Exception as e:
                pass # fallback below
        
        if not llm_success:
            if any(w in q_lower for w in ["delay", "why is", "block", "late", "timeline", "milestone", "sprint", "schedule"]):
                planned_agent = AgentWorkflow.PROJECT_INTELLIGENCE
                intent = "PROJECT_DELAY_AND_BLOCKER_ANALYSIS"
            elif any(w in q_lower for w in ["risk", "severity", "incident", "vulnerability", "breach", "sla", "pci"]):
                planned_agent = AgentWorkflow.RISK_INTELLIGENCE
                intent = "RISK_AND_SECURITY_ASSESSMENT"
            elif any(w in q_lower for w in ["adr", "decision", "why was", "architecture", "database", "kafka", "rest", "postgres"]):
                planned_agent = AgentWorkflow.DECISION_INTELLIGENCE
                intent = "ARCHITECTURE_DECISION_AND_RATIONALE"

        # 3. Resolve Temporal Scope
        now = datetime.utcnow()
        from_date = now - timedelta(days=time_range_days)
        temporal_scope = TemporalScope(
            from_date=from_date,
            to_date=now,
            freshness_threshold_days=time_range_days,
        )

        # 4. Resolve Target Evidence Types
        if source_filters:
            required_sources = source_filters
        else:
            required_sources = [
                SourceType.JIRA,
                SourceType.GIT,
                SourceType.ADR,
                SourceType.DOCUMENT,
            ]
            if "chat" in q_lower or "slack" in q_lower or "discussed" in q_lower:
                required_sources.append(SourceType.SLACK)
            if any(k in q_lower for k in ["databricks", "catalog", "unity", "workspace", "cluster", "warehouse", "delta", "notebook"]):
                if SourceType.DATABRICKS not in required_sources:
                    required_sources.append(SourceType.DATABRICKS)

        # 5. Extract Named Entities
        target_entities = []
        if not self.llm.is_simulated() and 'llm_entities' in locals() and llm_entities:
            target_entities = llm_entities
        else:
            for ent in ["Kafka", "PostgreSQL", "PCI-DSS", "REST", "AEGIS-108", "AEGIS-112", "AEGIS-115", "ADR-001", "ADR-002", "Alex Mercer", "Sarah Jenkins"]:
                if ent.lower() in q_lower:
                    target_entities.append(ent)
            if not target_entities:
                target_entities = ["Project Aegis", "Core Settlement Engine"]

        # 6. Calculate Context Budget
        # Base budget: 3500 tokens; expanded to 5000 if multi-entity or decision comparison
        budget_tokens = 5000 if len(target_entities) > 2 or planned_agent == AgentWorkflow.DECISION_INTELLIGENCE else 3500

        return ContextPlan(
            query=query,
            intent=intent,
            project_ids=resolved_project_ids,
            temporal_scope=temporal_scope,
            target_entities=target_entities,
            required_evidence_types=required_sources,
            authority_minimum=AuthorityLevel.LOW,
            context_budget_tokens=budget_tokens,
            planned_agent=planned_agent,
            security_context={"tenant": "org-acme-fintech", "permission_level": "READ_PROJECT_DATA"},
        )

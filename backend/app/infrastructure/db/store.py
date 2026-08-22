"""
Enterprise Context Brain (ECB) v2.2 - SQLite Data Store
Persistent relational repository using SQLAlchemy and SQLite.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext

from ...domain.schemas import (
    Organization, User, Source, SourceRecord, Evidence, MemoryItem, Project, Risk, Decision,
    ActionPreview, Approval, AuditEvent, AgentRun, ActionStatus
)
from .models import (
    Base, DBOrganization, DBUser, DBSource, DBProject, DBRisk, DBDecision,
    DBSourceRecord, DBEvidence, DBMemoryItem, DBActionPreview, DBAuditEvent, DBAgentRun
)
from .fixtures import generate_fixtures

DATABASE_URL = "sqlite:///./ecb_database.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Seed with fixtures if empty
    with SessionLocal() as db:
        if not db.query(DBOrganization).first():
            data = generate_fixtures()
            
            # Org
            db.add(DBOrganization(
                id=data["organization"].id,
                name=data["organization"].name,
                policy_profile=data["organization"].policy_profile
            ))
            
            # Users
            for u in data["users"]:
                hashed_pw = pwd_context.hash("password123")
                db.add(DBUser(id=u.id, name=u.name, email=u.email, role=u.role, org_id=u.org_id, hashed_password=hashed_pw))
                
            # Projects
            for p in data["projects"]:
                db.add(DBProject(id=p.id, name=p.name, status=p.status.value, owner_id=p.owner_id))
                
            # Sources
            for s in data["sources"]:
                db.add(DBSource(id=s.id, name=s.name, type=s.type.value, is_connected=s.is_connected))
                
            # Source Records
            for r in data["source_records"]:
                db.add(DBSourceRecord(id=r.id, source_id=r.source_id, title=r.title, url=r.metadata.get("url"), author=r.metadata.get("author"), project_id=r.project_id, source_type=r.source_type.value))
                
            # Evidence
            for e in data["evidence_items"]:
                db.add(DBEvidence(id=e.id, record_id=e.source_record_id, excerpt=e.excerpt, is_conflicting=e.is_conflicting, is_superseded=e.is_superseded))

            # Risks
            for rk in data["risks"]:
                db.add(DBRisk(id=rk.id, title=rk.title, severity=rk.severity.value, score=rk.score, owner_id=rk.owner, project_id=rk.project_id, description=rk.description, mitigation=rk.mitigation_plan))

            # Decisions
            for dc in data["decisions"]:
                db.add(DBDecision(id=dc.id, title=dc.title, status=dc.status.value, project_id=dc.project_id, rationale=dc.rationale))

            # Pending Actions
            for act in data["pending_actions"]:
                db.add(DBActionPreview(id=act.id, tool_name=act.tool_name, risk_class=act.risk_class.value, requires_approval=act.requires_approval, status=act.status.value))

            # Audit Events
            for aud in data["audit_events"]:
                db.add(DBAuditEvent(id=aud.id, user_id=aud.actor_id, action=aud.action_type, details=aud.details))
                
            db.commit()

class CanonicalStore:
    _instance: Optional["CanonicalStore"] = None

    def __init__(self):
        init_db()
        fixtures = generate_fixtures()
        self.users = {u.id: u for u in fixtures["users"]}
        self.actions = {a.id: a for a in fixtures["pending_actions"]}
        self.audit_events: List[AuditEvent] = list(fixtures["audit_events"])

    @classmethod
    def get_instance(cls) -> "CanonicalStore":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def reset(self):
        Base.metadata.drop_all(bind=engine)
        init_db()
        fixtures = generate_fixtures()
        self.users = {u.id: u for u in fixtures["users"]}
        self.actions = {a.id: a for a in fixtures["pending_actions"]}
        self.audit_events: List[AuditEvent] = list(fixtures["audit_events"])

    def _get_db(self) -> Session:
        return SessionLocal()

    # --- Project Queries ---
    def get_projects(self) -> List[Project]:
        fixtures = generate_fixtures()
        return fixtures["projects"]

    def get_project(self, project_id: str) -> Optional[Project]:
        fixtures = generate_fixtures()
        return next((p for p in fixtures["projects"] if p.id == project_id), None)

    # --- Risk Queries ---
    def get_risks(self, project_id: Optional[str] = None) -> List[Risk]:
        fixtures = generate_fixtures()
        risks = fixtures["risks"]
        if project_id:
            return [r for r in risks if r.project_id == project_id]
        return risks

    def get_risk(self, risk_id: str) -> Optional[Risk]:
        fixtures = generate_fixtures()
        return next((r for r in fixtures["risks"] if r.id == risk_id), None)

    # --- Decision Queries ---
    def get_decisions(self, project_id: Optional[str] = None) -> List[Decision]:
        fixtures = generate_fixtures()
        decisions = fixtures["decisions"]
        if project_id:
            return [d for d in decisions if d.project_id == project_id]
        return decisions

    def get_decision(self, decision_id: str) -> Optional[Decision]:
        fixtures = generate_fixtures()
        return next((d for d in fixtures["decisions"] if d.id == decision_id), None)

    # --- Evidence Queries ---
    def get_evidence_list(self, project_id: Optional[str] = None) -> List[Evidence]:
        fixtures = generate_fixtures()
        items = fixtures["evidence_items"]
        if project_id:
            return [e for e in items if e.project_id == project_id]
        return items

    def get_evidence(self, evidence_id: str) -> Optional[Evidence]:
        fixtures = generate_fixtures()
        return next((e for e in fixtures["evidence_items"] if e.id == evidence_id), None)

    def add_evidence(self, evidence: Evidence) -> Evidence:
        with self._get_db() as db:
            db.add(DBEvidence(id=evidence.id, record_id=evidence.source_record_id, excerpt=evidence.excerpt, is_conflicting=evidence.is_conflicting, is_superseded=evidence.is_superseded))
            db.commit()
            return evidence

    # --- Action & Approval Mutations ---
    def get_actions(self) -> List[ActionPreview]:
        return list(self.actions.values())

    def get_action(self, action_id: str) -> Optional[ActionPreview]:
        return self.actions.get(action_id)

    def add_action(self, action: ActionPreview) -> ActionPreview:
        self.actions[action.id] = action
        with self._get_db() as db:
            db.add(DBActionPreview(id=action.id, tool_name=action.tool_name, risk_class=action.risk_class.value if hasattr(action.risk_class, 'value') else str(action.risk_class), requires_approval=action.requires_approval, status=action.status.value if hasattr(action.status, 'value') else str(action.status)))
            db.commit()
        return action

    def update_action_status(self, action_id: str, status: ActionStatus) -> Optional[ActionPreview]:
        act = self.actions.get(action_id)
        if act:
            act.status = status
            with self._get_db() as db:
                a = db.query(DBActionPreview).filter(DBActionPreview.id == action_id).first()
                if a:
                    a.status = status.value if hasattr(status, 'value') else str(status)
                    db.commit()
        return act

    def record_approval(self, approval: Approval) -> None:
        act = self.actions.get(approval.action_id)
        if act:
            act.status = ActionStatus.APPROVED if approval.decision == "approved" else ActionStatus.REJECTED
            with self._get_db() as db:
                a = db.query(DBActionPreview).filter(DBActionPreview.id == approval.action_id).first()
                if a:
                    a.status = act.status.value
                    db.commit()

    # --- Audit Ledger ---
    def add_audit_event(self, event: AuditEvent) -> AuditEvent:
        self.audit_events.insert(0, event)
        with self._get_db() as db:
            db.add(DBAuditEvent(id=event.id, user_id=event.actor_id, action=event.action_type, details=event.details))
            db.commit()
            return event

    def get_audit_events(self, limit: int = 50) -> List[AuditEvent]:
        return self.audit_events[:limit]

    # --- Agent Runs ---
    def record_agent_run(self, run: AgentRun) -> AgentRun:
        with self._get_db() as db:
            db.add(DBAgentRun(id=run.id, trace_id=run.trace_id, workflow=run.workflow.value if hasattr(run.workflow, 'value') else str(run.workflow), query=run.query, status=run.status, answer=run.answer))
            db.commit()
            return run

    def get_agent_runs(self, limit: int = 20) -> List[AgentRun]:
        with self._get_db() as db:
            runs = db.query(DBAgentRun).order_by(DBAgentRun.created_at.desc()).limit(limit).all()
            return [AgentRun(id=r.id, trace_id=r.trace_id, org_id="org-acme-fintech", user_id="usr-sarah-jenkins", workflow=r.workflow, query=r.query, project_id="prj-aegis", status=r.status, confidence=0.95, confidence_label="High", answer=r.answer or "", citations=[], supporting_evidence_ids=[], conflicting_evidence_ids=[], superseded_evidence_ids=[], proposed_actions=[], steps=[], total_tokens=1000, prompt_tokens=600, completion_tokens=400, cost_usd=0.002, latency_ms=150) for r in runs]

    def get_agent_run(self, run_id: str) -> Optional[AgentRun]:
        with self._get_db() as db:
            r = db.query(DBAgentRun).filter(DBAgentRun.id == run_id).first()
            if r:
                return AgentRun(id=r.id, trace_id=r.trace_id, org_id="org-acme-fintech", user_id="usr-sarah-jenkins", workflow=r.workflow, query=r.query, project_id="prj-aegis", status=r.status, confidence=0.95, confidence_label="High", answer=r.answer or "", citations=[], supporting_evidence_ids=[], conflicting_evidence_ids=[], superseded_evidence_ids=[], proposed_actions=[], steps=[], total_tokens=1000, prompt_tokens=600, completion_tokens=400, cost_usd=0.002, latency_ms=150)
            return None

    # --- Sources ---
    def get_sources(self) -> List[Source]:
        fixtures = generate_fixtures()
        return fixtures["sources"]

    # --- Memory ---
    def get_memories(self, project_id: Optional[str] = None) -> List[MemoryItem]:
        fixtures = generate_fixtures()
        mems = fixtures["memory_items"]
        if project_id:
            return [m for m in mems if m.project_id == project_id]
        return mems
            
    def add_memory(self, memory: MemoryItem) -> MemoryItem:
        with self._get_db() as db:
            db.add(DBMemoryItem(id=memory.id, type=memory.type.value if hasattr(memory.type, "value") else str(memory.type), content=memory.content, project_id=memory.project_id))
            db.commit()
            return memory

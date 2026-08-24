"""
Enterprise Context Brain (ECB) v2.2 - SQLite Data Store
Persistent relational repository using SQLAlchemy and SQLite.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
import uuid

from ...domain.schemas import (
    Organization, User, Source, SourceRecord, Evidence, MemoryItem, Project, Risk, Decision,
    ActionPreview, Approval, AuditEvent, AgentRun, ActionStatus, ProjectStatus, RiskStatus,
    RiskSeverity, DecisionStatus, AuthorityLevel, SourceType
)
from .models import (
    Base, DBOrganization, DBUser, DBSource, DBProject, DBRisk, DBDecision,
    DBSourceRecord, DBEvidence, DBMemoryItem, DBActionPreview, DBAuditEvent, DBAgentRun
)

DATABASE_URL = "sqlite:///./ecb_database.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db():
    Base.metadata.create_all(bind=engine)
    
    with SessionLocal() as db:
        if not db.query(DBOrganization).first():
            org_id = "org-acme-fintech"
            db.add(DBOrganization(
                id=org_id,
                name="Acme Global Financial Technologies",
                policy_profile="enterprise_strict"
            ))
            hashed_pw = pwd_context.hash("password123")
            db.add(DBUser(id="usr-sarah-jenkins", name="Sarah Jenkins", email="sarah.jenkins@acmefin.com", role="project_manager", org_id=org_id, hashed_password=hashed_pw))
            db.add(DBUser(id="usr-alex-mercer", name="Alex Mercer", email="alex.mercer@acmefin.com", role="engineering_lead", org_id=org_id, hashed_password=hashed_pw))
            db.add(DBUser(id="usr-admin", name="System Admin", email="admin@acmefin.com", role="system_administrator", org_id=org_id, hashed_password=hashed_pw))
            db.commit()

        # Projects are populated 100% dynamically from live Atlassian Jira REST API & GitHub API webhooks

class CanonicalStore:
    _instance: Optional["CanonicalStore"] = None

    def __init__(self):
        init_db()

    @classmethod
    def get_instance(cls) -> "CanonicalStore":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def reset(self):
        Base.metadata.drop_all(bind=engine)
        init_db()

    def _get_db(self) -> Session:
        return SessionLocal()

    # --- Project Queries ---
    def get_projects(self) -> List[Project]:
        with self._get_db() as db:
            db_projects = db.query(DBProject).all()
            return [self._map_project(p) for p in db_projects]

    def get_project(self, project_id: str) -> Optional[Project]:
        with self._get_db() as db:
            p = db.query(DBProject).filter(DBProject.id == project_id).first()
            return self._map_project(p) if p else None
            
    def add_project(self, project: Project) -> Project:
        with self._get_db() as db:
            existing = db.query(DBProject).filter(DBProject.id == project.id).first()
            if existing:
                existing.name = project.name
                existing.status = project.status.value if hasattr(project.status, 'value') else project.status
            else:
                db.add(DBProject(id=project.id, name=project.name, status=project.status.value if hasattr(project.status, 'value') else project.status, owner_id=project.owner_id))
            db.commit()
            return project

    def _map_project(self, p: DBProject) -> Project:
        try:
            status = ProjectStatus(p.status)
        except (ValueError, KeyError, AttributeError):
            status = ProjectStatus.ON_TRACK
        return Project(
            id=p.id, org_id="org-acme-fintech", name=p.name, code=p.name[:5].upper(),
            description="Live connected project", status=status,
            health_score=100, owner_id=p.owner_id, owner_name="System", target_completion_date=datetime.utcnow(),
            created_at=datetime.utcnow(), updated_at=datetime.utcnow()
        )

    # --- Risk Queries ---
    def get_risks(self, project_id: Optional[str] = None) -> List[Risk]:
        with self._get_db() as db:
            query = db.query(DBRisk)
            if project_id: query = query.filter(DBRisk.project_id == project_id)
            return [self._map_risk(r) for r in query.all()]

    def get_risk(self, risk_id: str) -> Optional[Risk]:
        with self._get_db() as db:
            r = db.query(DBRisk).filter(DBRisk.id == risk_id).first()
            return self._map_risk(r) if r else None
            
    def add_risk(self, risk: Risk) -> Risk:
        with self._get_db() as db:
            existing = db.query(DBRisk).filter(DBRisk.id == risk.id).first()
            if existing:
                existing.status = risk.status.value if hasattr(risk.status, 'value') else risk.status
                existing.severity = risk.severity.value if hasattr(risk.severity, 'value') else risk.severity
                existing.title = risk.title
                existing.score = risk.score
                existing.probability = risk.probability
                existing.impact = risk.impact
                existing.description = risk.description
            else:
                db.add(DBRisk(id=risk.id, title=risk.title, severity=risk.severity.value if hasattr(risk.severity, 'value') else risk.severity, score=risk.score, probability=risk.probability, impact=risk.impact, owner_id=risk.owner, project_id=risk.project_id, description=risk.description, mitigation=risk.mitigation_plan, status=risk.status.value if hasattr(risk.status, 'value') else risk.status))
            db.commit()
            return risk

    def _map_risk(self, r: DBRisk) -> Risk:
        prob = getattr(r, 'probability', 3) or 3
        imp = getattr(r, 'impact', 3) or 3
        return Risk(
            id=r.id, project_id=r.project_id or "", title=r.title, description=r.description or "",
            severity=RiskSeverity(r.severity), probability=prob, impact=imp, score=r.score or (prob * imp * 4), owner=r.owner_id,
            status=RiskStatus(r.status), mitigation_plan=r.mitigation or "", identified_at=datetime.utcnow(), last_reviewed_at=datetime.utcnow()
        )

    # --- Decision Queries ---
    def get_decisions(self, project_id: Optional[str] = None) -> List[Decision]:
        with self._get_db() as db:
            query = db.query(DBDecision)
            if project_id: query = query.filter(DBDecision.project_id == project_id)
            return [self._map_decision(d) for d in query.all()]

    def get_decision(self, decision_id: str) -> Optional[Decision]:
        with self._get_db() as db:
            d = db.query(DBDecision).filter(DBDecision.id == decision_id).first()
            return self._map_decision(d) if d else None
            
    def add_decision(self, decision: Decision) -> Decision:
        with self._get_db() as db:
            existing = db.query(DBDecision).filter(DBDecision.id == decision.id).first()
            if not existing:
                db.add(DBDecision(id=decision.id, title=decision.title, status=decision.status.value if hasattr(decision.status, 'value') else decision.status, project_id=decision.project_id, rationale=decision.rationale))
            db.commit()
            return decision

    def _map_decision(self, d: DBDecision) -> Decision:
        return Decision(
            id=d.id, project_id=d.project_id or "", title=d.title, context="", decision_summary=d.title,
            rationale=d.rationale or "", status=DecisionStatus(d.status), decided_by="System", decided_at=datetime.utcnow()
        )

    # --- Evidence Queries ---
    def get_evidence_list(self, project_id: Optional[str] = None) -> List[Evidence]:
        with self._get_db() as db:
            query = db.query(DBEvidence)
            if project_id: query = query.filter(DBEvidence.project_id == project_id)
            return [self._map_evidence(e) for e in query.all()]

    def get_evidence(self, evidence_id: str) -> Optional[Evidence]:
        with self._get_db() as db:
            e = db.query(DBEvidence).filter(DBEvidence.id == evidence_id).first()
            return self._map_evidence(e) if e else None

    def add_evidence(self, evidence: Evidence) -> Evidence:
        with self._get_db() as db:
            rec = db.query(DBSourceRecord).filter(DBSourceRecord.id == evidence.source_record_id).first()
            if not rec:
                db.add(DBSourceRecord(
                    id=evidence.source_record_id,
                    source_id="src-jira-live",
                    title=evidence.source_title,
                    url=evidence.url,
                    author=evidence.author,
                    project_id=evidence.project_id,
                    source_type=evidence.source_type.value if hasattr(evidence.source_type, 'value') else evidence.source_type
                ))
                db.commit()

            existing = db.query(DBEvidence).filter(DBEvidence.id == evidence.id).first()
            if existing:
                existing.excerpt = evidence.excerpt
                existing.is_conflicting = evidence.is_conflicting
                existing.is_superseded = evidence.is_superseded
            else:
                db.add(DBEvidence(
                    id=evidence.id,
                    record_id=evidence.source_record_id,
                    excerpt=evidence.excerpt,
                    is_conflicting=evidence.is_conflicting,
                    is_superseded=evidence.is_superseded,
                    source_type=evidence.source_type.value if hasattr(evidence.source_type, 'value') else evidence.source_type,
                    source_title=evidence.source_title,
                    external_id=evidence.external_id,
                    project_id=evidence.project_id,
                    authority=evidence.authority.value if hasattr(evidence.authority, 'value') else evidence.authority,
                    url=evidence.url,
                    author=evidence.author
                ))
            db.commit()
            return evidence

    def _map_evidence(self, e: DBEvidence) -> Evidence:
        return Evidence(
            id=e.id, source_record_id=e.record_id or "", source_type=SourceType(e.source_type or "document"),
            source_title=e.source_title or "", external_id=e.external_id or "", project_id=e.project_id or "",
            excerpt=e.excerpt, authority=AuthorityLevel(e.authority or "medium"), observed_at=datetime.utcnow(),
            url=e.url, author=e.author, is_conflicting=e.is_conflicting, is_superseded=e.is_superseded
        )

    # --- Sources ---
    def get_sources(self) -> List[Source]:
        with self._get_db() as db:
            return [Source(id=s.id, org_id="org-acme-fintech", type=SourceType(s.type), name=s.name, is_connected=s.is_connected) for s in db.query(DBSource).all()]
            
    def add_source(self, source: Source) -> Source:
        with self._get_db() as db:
            existing = db.query(DBSource).filter(DBSource.id == source.id).first()
            if not existing:
                db.add(DBSource(id=source.id, name=source.name, type=source.type.value if hasattr(source.type, 'value') else source.type, is_connected=source.is_connected))
            db.commit()
            return source

    # --- Actions & Audit Events ---
    def get_actions(self) -> List[ActionPreview]:
        with self._get_db() as db:
            return [ActionPreview(id=a.id, agent_run_id="", tool_name=a.tool_name, target_system="", summary=a.tool_name, description="", risk_class=a.risk_class, requires_approval=a.requires_approval, status=ActionStatus(a.status), impact_assessment="", reversibility="", suggested_by_agent="manager") for a in db.query(DBActionPreview).all()]

    def get_action(self, action_id: str) -> Optional[ActionPreview]:
        for a in self.get_actions():
            if a.id == action_id:
                return a
        return None
            
    def add_audit_event(self, event: AuditEvent) -> AuditEvent:
        with self._get_db() as db:
            db.add(DBAuditEvent(id=event.id, user_id=event.actor_id, action=event.action_type, details=event.details))
            db.commit()
            return event

    def get_audit_events(self, limit: int = 50) -> List[AuditEvent]:
        with self._get_db() as db:
            return [AuditEvent(id=a.id, org_id="org-acme-fintech", actor_id=a.user_id, actor_name=a.user_id, action_type=a.action, entity_type="system", entity_id="", policy_result="ALLOWED", trace_id="", details=a.details or {}) for a in db.query(DBAuditEvent).order_by(DBAuditEvent.timestamp.desc()).limit(limit).all()]

    def record_agent_run(self, agent_run: Any) -> Any:
        with self._get_db() as db:
            run_id = getattr(agent_run, "id", None) or f"run-{uuid.uuid4().hex[:8]}"
            wf = getattr(agent_run, "workflow", "auto")
            wf_str = wf.value if hasattr(wf, "value") else str(wf)
            st = getattr(agent_run, "status", "SUCCESS")
            st_str = st.value if hasattr(st, "value") else str(st)
            db_run = DBAgentRun(
                id=run_id,
                trace_id=getattr(agent_run, "trace_id", "") or f"tr-{uuid.uuid4().hex[:8]}",
                workflow=wf_str,
                query=getattr(agent_run, "query", ""),
                status=st_str,
                answer=getattr(agent_run, "answer", "")
            )
            db.add(db_run)
            db.commit()
            return agent_run

    def add_action(self, action: Any) -> Any:
        with self._get_db() as db:
            action_id = getattr(action, "id", None) or f"act-{uuid.uuid4().hex[:8]}"
            rc = getattr(action, "risk_class", "LOW")
            rc_str = rc.value if hasattr(rc, "value") else str(rc)
            st = getattr(action, "status", "PENDING_APPROVAL")
            st_str = st.value if hasattr(st, "value") else str(st)
            db_act = DBActionPreview(
                id=action_id,
                tool_name=getattr(action, "tool_name", "action"),
                risk_class=rc_str,
                requires_approval=getattr(action, "requires_approval", True),
                status=st_str
            )
            db.add(db_act)
            db.commit()
            return action

    def get_agent_runs(self, limit: int = 20) -> List[AgentRun]:
        with self._get_db() as db:
            return [AgentRun(id=r.id, trace_id=r.trace_id, org_id="org-acme-fintech", user_id="system", workflow=r.workflow, query=r.query, status=r.status, confidence=0.95, confidence_label="High", answer=r.answer or "") for r in db.query(DBAgentRun).order_by(DBAgentRun.created_at.desc()).limit(limit).all()]
            
    def get_memories(self, project_id: Optional[str] = None) -> List[MemoryItem]:
        with self._get_db() as db:
            return []

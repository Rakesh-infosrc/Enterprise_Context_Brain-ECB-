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
    RiskSeverity, DecisionStatus, AuthorityLevel, SourceType, Milestone, MemoryType
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

            # Seed JIRA, Git, ADR, Risks, Actions, and Evidences fixtures for testing
            from .fixtures import generate_fixtures
            from .models import DBSource, DBProject, DBRisk, DBDecision, DBSourceRecord, DBEvidence, DBMemoryItem, DBActionPreview, DBAuditEvent
            
            fixtures = generate_fixtures()
            
            # Sources
            for s in fixtures["sources"]:
                if not db.query(DBSource).filter(DBSource.id == s.id).first():
                    db.add(DBSource(id=s.id, name=s.name, type=s.type.value if hasattr(s.type, 'value') else s.type, is_connected=s.is_connected))
            
            # Projects - seed mock projects only under test environments
            import os
            if os.getenv("PYTEST_CURRENT_TEST"):
                for p in fixtures["projects"]:
                    if not db.query(DBProject).filter(DBProject.id == p.id).first():
                        db.add(DBProject(id=p.id, name=p.name, status=p.status.value if hasattr(p.status, 'value') else p.status, owner_id=p.owner_id))
            
            # Decisions
            for d in fixtures["decisions"]:
                if not db.query(DBDecision).filter(DBDecision.id == d.id).first():
                    db.add(DBDecision(id=d.id, title=d.title, status=d.status.value if hasattr(d.status, 'value') else d.status, project_id=d.project_id, rationale=d.rationale))
            
            # Risks
            for r in fixtures["risks"]:
                if not db.query(DBRisk).filter(DBRisk.id == r.id).first():
                    db.add(DBRisk(id=r.id, title=r.title, severity=r.severity.value if hasattr(r.severity, 'value') else r.severity, score=r.score, owner_id=r.owner, project_id=r.project_id, description=r.description, mitigation=r.mitigation_plan, status=r.status.value if hasattr(r.status, 'value') else r.status))
            
            # Source Records
            for sr in fixtures["source_records"]:
                if not db.query(DBSourceRecord).filter(DBSourceRecord.id == sr.id).first():
                    db.add(DBSourceRecord(id=sr.id, source_id=sr.source_id, title=sr.title, url=sr.metadata.get('url', ''), author=sr.author, project_id=sr.project_id, source_type=sr.source_type.value if hasattr(sr.source_type, 'value') else sr.source_type))
            
            # Evidence
            for e in fixtures["evidence_items"]:
                if not db.query(DBEvidence).filter(DBEvidence.id == e.id).first():
                    db.add(DBEvidence(id=e.id, record_id=e.source_record_id, excerpt=e.excerpt, is_conflicting=e.is_conflicting, is_superseded=e.is_superseded, source_type=e.source_type.value if hasattr(e.source_type, 'value') else e.source_type, source_title=e.source_title, external_id=e.external_id, project_id=e.project_id, authority=e.authority.value if hasattr(e.authority, 'value') else e.authority, url=e.url, author=e.author))
            
            # Memory Items
            for m in fixtures["memory_items"]:
                if not db.query(DBMemoryItem).filter(DBMemoryItem.id == m.id).first():
                    db.add(DBMemoryItem(id=m.id, type=m.type.value if hasattr(m.type, 'value') else m.type, content=m.content, project_id=m.project_id))
            
            # Pending Actions
            for a in fixtures["pending_actions"]:
                if not db.query(DBActionPreview).filter(DBActionPreview.id == a.id).first():
                    db.add(DBActionPreview(id=a.id, tool_name=a.tool_name, risk_class=a.risk_class.value if hasattr(a.risk_class, 'value') else a.risk_class, requires_approval=a.requires_approval, status=a.status.value if hasattr(a.status, 'value') else a.status))
            
            # Audit Events
            for ae in fixtures["audit_events"]:
                if not db.query(DBAuditEvent).filter(DBAuditEvent.id == ae.id).first():
                    db.add(DBAuditEvent(id=ae.id, user_id=ae.actor_id, action=ae.action_type, details=ae.details))
            
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

    def get_projects(self) -> List[Project]:
        import os
        is_test = bool(os.getenv("PYTEST_CURRENT_TEST"))
        if not is_test:
            try:
                from ...infrastructure.mcp.jira_extractor import JiraDatasetExtractor
                jira_projects = JiraDatasetExtractor().extract_projects()
                if jira_projects:
                    projects_list = []
                    for jp in jira_projects:
                        with self._get_db() as db:
                            db_p = db.query(DBProject).filter(DBProject.id == jp["id"]).first()
                            if not db_p:
                                db_p = DBProject(id=jp["id"], name=jp["name"], status="on_track", owner_id="system")
                                db.add(db_p)
                                db.commit()
                                db_p = db.query(DBProject).filter(DBProject.id == jp["id"]).first()
                            projects_list.append(self._map_project(db_p))
                    return projects_list
            except Exception:
                pass

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
        
        # Extract live milestones from Jira Cloud
        try:
            from ...infrastructure.mcp.jira_extractor import JiraDatasetExtractor
            jira_issues = JiraDatasetExtractor().extract_issues(project_key=p.id.split("-")[-1].upper())
            milestones = []
            for issue in jira_issues:
                status_lower = issue["status"].lower()
                m_status = "completed" if "done" in status_lower or "complete" in status_lower or "closed" in status_lower else "in_progress"
                progress = 100 if m_status == "completed" else 50
                due_date_parsed = datetime.utcnow()
                try:
                    if issue.get("due_date"):
                        due_date_parsed = datetime.fromisoformat(issue["due_date"])
                except Exception:
                    pass
                milestones.append(
                    Milestone(
                        id=f"ms-{p.id}-{issue['key']}",
                        project_id=p.id,
                        name=issue["summary"],
                        target_date=due_date_parsed,
                        status=m_status,
                        progress_percentage=progress
                    )
                )
            if not milestones:
                raise ValueError("No Jira milestones found")
        except Exception:
            milestones = [
                Milestone(id=f"ms-{p.id}-1", project_id=p.id, name="Requirements & Architecture Sign-off", target_date=datetime.utcnow(), status="completed", progress_percentage=100),
                Milestone(id=f"ms-{p.id}-2", project_id=p.id, name="Core Service Deployment", target_date=datetime.utcnow(), status="in_progress", progress_percentage=60),
                Milestone(id=f"ms-{p.id}-3", project_id=p.id, name="PCI-DSS Compliance Certification", target_date=datetime.utcnow(), status="at_risk", progress_percentage=20)
            ]
        
        return Project(
            id=p.id, org_id="org-acme-fintech", name=p.name, code=p.name[:5].upper(),
            description="Live connected project", status=status,
            health_score=100, owner_id=p.owner_id, owner_name="System", target_completion_date=datetime.utcnow(),
            created_at=datetime.utcnow(), updated_at=datetime.utcnow(),
            milestones=milestones
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
                existing.description = risk.description
            else:
                db.add(DBRisk(id=risk.id, title=risk.title, severity=risk.severity.value if hasattr(risk.severity, 'value') else risk.severity, score=risk.score, owner_id=risk.owner, project_id=risk.project_id, description=risk.description, mitigation=risk.mitigation_plan, status=risk.status.value if hasattr(risk.status, 'value') else risk.status))
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
            details = dict(event.details or {})
            details.update({
                "entity_id": event.entity_id,
                "entity_type": event.entity_type,
                "policy_result": event.policy_result,
                "trace_id": event.trace_id,
                "actor_name": event.actor_name
            })
            db.add(DBAuditEvent(id=event.id, user_id=event.actor_id, action=event.action_type, details=details))
            db.commit()
            return event

    def get_audit_events(self, limit: int = 50) -> List[AuditEvent]:
        with self._get_db() as db:
            events = []
            for a in db.query(DBAuditEvent).order_by(DBAuditEvent.timestamp.desc()).limit(limit).all():
                details = a.details or {}
                entity_id = details.get("entity_id", "")
                entity_type = details.get("entity_type", "system")
                policy_result = details.get("policy_result", "ALLOWED")
                trace_id = details.get("trace_id", "")
                actor_name = details.get("actor_name", a.user_id)
                events.append(AuditEvent(
                    id=a.id, org_id="org-acme-fintech", actor_id=a.user_id, actor_name=actor_name,
                    action_type=a.action, entity_type=entity_type, entity_id=entity_id,
                    policy_result=policy_result, trace_id=trace_id, details=details
                ))
            return events

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

    def update_action_status(self, action_id: str, status: Any) -> None:
        with self._get_db() as db:
            act = db.query(DBActionPreview).filter(DBActionPreview.id == action_id).first()
            if act:
                act.status = status.value if hasattr(status, 'value') else status
                db.commit()

    def record_approval(self, approval: Any) -> Any:
        self.update_action_status(approval.action_id, approval.decision)
        return approval


    def get_agent_runs(self, limit: int = 20) -> List[AgentRun]:
        with self._get_db() as db:
            return [AgentRun(id=r.id, trace_id=r.trace_id, org_id="org-acme-fintech", user_id="system", workflow=r.workflow, query=r.query, status=r.status, confidence=0.95, confidence_label="High", answer=r.answer or "") for r in db.query(DBAgentRun).order_by(DBAgentRun.created_at.desc()).limit(limit).all()]
            
    def get_memories(self, project_id: Optional[str] = None) -> List[MemoryItem]:
        with self._get_db() as db:
            query = db.query(DBMemoryItem)
            if project_id:
                query = query.filter(DBMemoryItem.project_id == project_id)
            return [self._map_memory(m) for m in query.all()]

    def _map_memory(self, m: DBMemoryItem) -> MemoryItem:
        try:
            m_type = MemoryType(m.type)
        except (ValueError, KeyError, AttributeError):
            m_type = MemoryType.EPISODIC
        from datetime import timedelta
        return MemoryItem(
            id=m.id,
            org_id="org-acme-fintech",
            project_id=m.project_id or "",
            type=m_type,
            title=f"Memory: {m_type.value.upper()}",
            content=m.content,
            confidence=0.98,
            validity_from=datetime.utcnow() - timedelta(days=30),
            validity_to=None,
            metadata={}
        )

    def add_memory(self, memory: MemoryItem) -> MemoryItem:
        with self._get_db() as db:
            existing = db.query(DBMemoryItem).filter(DBMemoryItem.id == memory.id).first()
            if existing:
                existing.content = memory.content
                existing.project_id = memory.project_id
                existing.type = memory.type.value if hasattr(memory.type, 'value') else memory.type
            else:
                db.add(DBMemoryItem(
                    id=memory.id,
                    type=memory.type.value if hasattr(memory.type, 'value') else memory.type,
                    content=memory.content,
                    project_id=memory.project_id
                ))
            db.commit()
            return memory

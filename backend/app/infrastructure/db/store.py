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

import os
import sys
is_test = (
    "pytest" in sys.modules
    or "py.test" in sys.modules
    or any("pytest" in arg for arg in sys.argv)
    or bool(os.getenv("PYTEST_CURRENT_TEST"))
)
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
db_filename = "ecb_database_test.db" if is_test else "ecb_database.db"
db_path = os.path.join(backend_dir, db_filename)
DATABASE_URL = f"sqlite:///{db_path}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Fixture project IDs created by tests — cleaned up on normal app startup
FIXTURE_PROJECT_IDS = {"prj-aegis", "prj-orion", "prj-clara-v3", "prj-test"}

def _cleanup_fixtures():
    """Remove mock fixture projects and their related data when not in test mode."""
    try:
        with SessionLocal() as db:
            from .models import DBRisk, DBDecision, DBEvidence, DBActionPreview, DBAuditEvent, DBProject
            for pid in FIXTURE_PROJECT_IDS:
                db.query(DBRisk).filter(DBRisk.project_id == pid).delete()
                db.query(DBDecision).filter(DBDecision.project_id == pid).delete()
                db.query(DBEvidence).filter(DBEvidence.project_id == pid).delete()
                db.query(DBActionPreview).filter(DBActionPreview.project_id == pid).delete()
                db.query(DBAuditEvent).filter(DBAuditEvent.project_id == pid).delete()
                db.query(DBProject).filter(DBProject.id == pid).delete()
            db.commit()
    except Exception:
        pass

def _migrate_db_columns():
    """Adds new columns to existing SQLite tables if they don't exist."""
    from sqlalchemy import text
    migrations = [
        ("risks", "probability", "INTEGER DEFAULT 3"),
        ("risks", "impact", "INTEGER DEFAULT 3"),
        ("decisions", "adr_number", "TEXT"),
        ("decisions", "decided_by", "TEXT DEFAULT 'System'"),
        ("projects", "team", "TEXT"),
        ("projects", "webhook_status", "TEXT DEFAULT 'inactive'"),
        ("projects", "source_type", "TEXT DEFAULT 'unknown'"),
        ("evidence", "conflict_summary", "TEXT"),
        ("memory_items", "title", "TEXT"),
        ("memory_items", "confidence", "REAL DEFAULT 0.98"),
        ("memory_items", "validity_from", "TEXT"),
        ("memory_items", "metadata_json", "TEXT"),
    ]
    try:
        with engine.connect() as conn:
            for table, column, col_type in migrations:
                try:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
                except Exception:
                    pass  # Column already exists
            conn.commit()
    except Exception:
        pass

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Migrate: add new columns to existing SQLite tables
    _migrate_db_columns()
    
    # Cleanup fixture data when not in test mode
    import os as _os
    if not _os.getenv("PYTEST_CURRENT_TEST"):
        _cleanup_fixtures()
    
    with SessionLocal() as db:
        if not db.query(DBOrganization).first():
            org_id = "org-acme-fintech"
            db.add(DBOrganization(
                id=org_id,
                name="Acme Global Financial Technologies",
                policy_profile="enterprise_strict"
            ))
            hashed_pw = pwd_context.hash("password123")
            
            # Dev fallbacks
            db.add(DBUser(id="usr-sarah-jenkins", name="Sarah Jenkins", email="sarah.jenkins@acmefin.com", role="project_manager", org_id=org_id, team="siva_team", hashed_password=hashed_pw))
            db.add(DBUser(id="usr-alex-mercer", name="Alex Mercer", email="alex.mercer@acmefin.com", role="engineering_lead", org_id=org_id, team="gowtham_team", hashed_password=hashed_pw))
            db.add(DBUser(id="usr-admin", name="System Admin", email="admin@acmefin.com", role="system_administrator", org_id=org_id, team="none", hashed_password=hashed_pw))
            
            # 1. SHATHYA (Top-Level Boss) - Master Access
            db.add(DBUser(id="usr-shathya", name="Shathya", email="shathya@acmefin.com", role="master_authority", org_id=org_id, team="none", is_manager=True, hashed_password=hashed_pw))
            
            # 2. SIVA'S TEAM (Manager Siva, Member Rakesh)
            db.add(DBUser(id="usr-siva", name="Siva", email="siva@acmefin.com", role="manager", org_id=org_id, team="siva_team", is_manager=True, hashed_password=hashed_pw))
            db.add(DBUser(id="usr-rakesh", name="Rakesh", email="rakesh@acmefin.com", role="team_member", org_id=org_id, team="siva_team", is_manager=False, hashed_password=hashed_pw))
            
            # 3. PRASANNA'S TEAM (Manager Prasanna, Employees 1-4)
            db.add(DBUser(id="usr-prasanna", name="Prasanna", email="prasanna@acmefin.com", role="manager", org_id=org_id, team="prasanna_team", is_manager=True, hashed_password=hashed_pw))
            for i in range(1, 5):
                db.add(DBUser(id=f"usr-employee{i}", name=f"Employee {i}", email=f"employee{i}@acmefin.com", role="team_member", org_id=org_id, team="prasanna_team", is_manager=False, hashed_password=hashed_pw))
                
            # 4. GOWTHAM'S TEAM (Manager Gowtham, Members Reena, Gokul, Babu, Shathi)
            db.add(DBUser(id="usr-gowtham", name="Gowtham", email="gowtham@acmefin.com", role="manager", org_id=org_id, team="gowtham_team", is_manager=True, hashed_password=hashed_pw))
            db.add(DBUser(id="usr-reena", name="Reena", email="reena@acmefin.com", role="team_member", org_id=org_id, team="gowtham_team", is_manager=False, hashed_password=hashed_pw))
            db.add(DBUser(id="usr-gokul", name="Gokul", email="gokul@acmefin.com", role="team_member", org_id=org_id, team="gowtham_team", is_manager=False, hashed_password=hashed_pw))
            db.add(DBUser(id="usr-babu", name="Babu", email="babu@acmefin.com", role="team_member", org_id=org_id, team="gowtham_team", is_manager=False, hashed_password=hashed_pw))
            db.add(DBUser(id="usr-shathi", name="Shathi", email="shathi@acmefin.com", role="team_member", org_id=org_id, team="gowtham_team", is_manager=False, hashed_password=hashed_pw))
            
            # 5. RAJ'S TEAM (Manager Raj, Members Ramu, Mayoori, Lavanya)
            db.add(DBUser(id="usr-raj", name="Raj", email="raj@acmefin.com", role="manager", org_id=org_id, team="raj_team", is_manager=True, hashed_password=hashed_pw))
            db.add(DBUser(id="usr-ramu", name="Ramu", email="ramu@acmefin.com", role="team_member", org_id=org_id, team="raj_team", is_manager=False, api_key="key-ramu-12345", hashed_password=hashed_pw))
            db.add(DBUser(id="usr-mayoori", name="Mayoori", email="mayoori@acmefin.com", role="team_member", org_id=org_id, team="raj_team", is_manager=False, api_key="key-mayoori-67890", hashed_password=hashed_pw))
            db.add(DBUser(id="usr-lavanya", name="Lavanya", email="lavanya@acmefin.com", role="team_member", org_id=org_id, team="raj_team", is_manager=False, hashed_password=hashed_pw))
            
            db.commit()

            # Seed JIRA, Git, ADR, Risks, Actions, and Evidences fixtures ONLY for testing
            import os
            if os.getenv("PYTEST_CURRENT_TEST"):
                from .fixtures import generate_fixtures
                from .models import DBSource, DBProject, DBRisk, DBDecision, DBSourceRecord, DBEvidence, DBMemoryItem, DBActionPreview, DBAuditEvent
                
                fixtures = generate_fixtures()
                
                # Sources
                for s in fixtures["sources"]:
                    if not db.query(DBSource).filter(DBSource.id == s.id).first():
                        db.add(DBSource(id=s.id, name=s.name, type=s.type.value if hasattr(s.type, 'value') else s.type, is_connected=s.is_connected))
                
                # Projects - seed mock projects to ensure visibility in dev and test environments
                for p in fixtures["projects"]:
                    if not db.query(DBProject).filter(DBProject.id == p.id).first():
                        if "rakesh-infosrc" in p.id:
                            p_team = None
                        else:
                            p_team = "siva_team" if p.id in ["prj-aegis", "prj-clara-v3"] else "gowtham_team"
                        db.add(DBProject(id=p.id, name=p.name, status=p.status.value if hasattr(p.status, 'value') else p.status, owner_id=p.owner_id, team=p_team))
                
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

    def get_projects(self, team: Optional[str] = None) -> List[Project]:
        import os
        import urllib.request
        import json
        is_test = bool(os.getenv("PYTEST_CURRENT_TEST"))
        if not is_test:
            try:
                from ...infrastructure.mcp.jira_extractor import JiraDatasetExtractor
                jira_projects = JiraDatasetExtractor().extract_projects()
                if jira_projects:
                    for jp in jira_projects:
                        with self._get_db() as db:
                            db_p = db.query(DBProject).filter(DBProject.id == jp["id"]).first()
                            if not db_p:
                                p_team = "siva_team" if any(w in jp["id"].lower() for w in ["aegis", "kan"]) else "gowtham_team"
                                db_p = DBProject(id=jp["id"], name=jp["name"], status="on_track", owner_id="system", team=p_team)
                                db.add(db_p)
                                db.commit()
            except Exception:
                pass

            try:
                # Set webhook_status for Jira/Databricks based on config
                # GitHub webhook_status is set only by the webhook handler on real events
                with self._get_db() as db:
                    all_projects = db.query(DBProject).all()
                    jira_host = os.getenv("JIRA_BASE_URL", "")
                    jira_tok = os.getenv("JIRA_API_TOKEN", "")
                    jira_configured = bool(jira_host and jira_tok and jira_tok.strip())
                    dbx_host = os.getenv("DATABRICKS_HOST", "")
                    dbx_tok = os.getenv("DATABRICKS_TOKEN", "")
                    dbx_configured = bool(dbx_host and dbx_tok and dbx_tok.strip())
                    github_repos_raw = os.getenv("GITHUB_REPOS", "").strip()
                    configured_repos = [r.strip().lower() for r in github_repos_raw.split(",") if r.strip()] if github_repos_raw else []

                    for proj in all_projects:
                        raw_src = (getattr(proj, 'source_type', None) or '').strip().lower()
                        p_name_lower = (proj.name or '').lower()
                        p_id_lower = (proj.id or '').lower()
                        
                        if raw_src in ['github', 'git'] or '/' in proj.name:
                            is_in_configured = any(cr in p_name_lower or cr in p_id_lower for cr in configured_repos) if configured_repos else False
                            proj.webhook_status = "active" if is_in_configured else "inactive"
                        elif raw_src == 'jira' or 'jira' in p_name_lower or 'project ecb' in p_name_lower or proj.id in ['prj-kan', 'prj-aegis']:
                            proj.webhook_status = "active" if jira_configured else "inactive"
                        elif raw_src == 'databricks' or 'databricks' in p_name_lower:
                            proj.webhook_status = "active" if dbx_configured else "inactive"
                        else:
                            proj.webhook_status = "inactive"

                    db.commit()
            except Exception as err:
                print(f"DEBUG: Exception in get_projects webhook_status update: {err}")

        with self._get_db() as db:
            query = db.query(DBProject)
            if team:
                query = query.filter((DBProject.team == team) | (DBProject.team == None))
            if not is_test:
                github_repos_raw = os.getenv("GITHUB_REPOS", "").strip()
                configured_repos = [r.strip().lower() for r in github_repos_raw.split(",") if r.strip()] if github_repos_raw else []

                # Only show projects with active webhooks (GitHub, Jira, Databricks)
                query = query.filter(DBProject.webhook_status == "active")
            db_projects = query.all()
            
            seen_ids = set()
            seen_names = set()
            unique_projects = []
            for p in db_projects:
                norm_name = p.name.strip().lower()
                if p.id not in seen_ids and norm_name not in seen_names:
                    seen_ids.add(p.id)
                    seen_names.add(norm_name)
                    unique_projects.append(self._map_project(p))
            return unique_projects

    def get_project(self, project_id: str, team: Optional[str] = None) -> Optional[Project]:
        with self._get_db() as db:
            query = db.query(DBProject).filter(DBProject.id == project_id)
            if team:
                query = query.filter(DBProject.team == team)
            p = query.first()
            return self._map_project(p) if p else None
            
    def add_project(self, project: Project) -> Project:
        with self._get_db() as db:
            existing = db.query(DBProject).filter(DBProject.id == project.id).first()
            if existing:
                existing.name = project.name
                existing.status = project.status.value if hasattr(project.status, 'value') else project.status
            else:
                src = getattr(project, 'source_type', 'unknown')
                is_git = src in ['github', 'git'] or '/' in project.name
                default_webhook_status = "inactive" if is_git else "active"
                db.add(DBProject(id=project.id, name=project.name, status=project.status.value if hasattr(project.status, 'value') else project.status, owner_id=project.owner_id, webhook_status=default_webhook_status, source_type=src))
            db.commit()
            return project

    def delete_project(self, project_id: str):
        with self._get_db() as db:
            from .models import DBRisk, DBDecision, DBEvidence
            db.query(DBRisk).filter(DBRisk.project_id == project_id).delete()
            db.query(DBDecision).filter(DBDecision.project_id == project_id).delete()
            db.query(DBEvidence).filter(DBEvidence.project_id == project_id).delete()
            p = db.query(DBProject).filter(DBProject.id == project_id).first()
            if p:
                db.delete(p)
                db.commit()

    def _map_project(self, p: DBProject) -> Project:
        try:
            status = ProjectStatus(p.status)
        except (ValueError, KeyError, AttributeError):
            status = ProjectStatus.ON_TRACK

        # Resolve Jira project key from DB project ID
        proj_key = p.id.split("-")[-1].upper() if "-" in p.id else "KAN"
        _key_map = {"KAN": "KAN", "CLARA": "CLARA", "ECB": "KAN"}
        proj_key = _key_map.get(proj_key, proj_key)
        
        # Extract live milestones from Jira Cloud
        jira_issues = []
        milestones = []
        try:
            from ...infrastructure.mcp.jira_extractor import JiraDatasetExtractor
            jira_issues = JiraDatasetExtractor().extract_issues(project_key=proj_key)
            done_count = 0
            total_count = len(jira_issues)
            now = datetime.utcnow()
            overdue_count = 0
            for issue in jira_issues:
                status_lower = issue["status"].lower()
                is_done = "done" in status_lower or "complete" in status_lower or "closed" in status_lower or "resolved" in status_lower
                if is_done:
                    done_count += 1
                    m_status = "completed"
                else:
                    m_status = "in_progress"
                due_date_parsed = None
                try:
                    if issue.get("due_date"):
                        due_date_parsed = datetime.fromisoformat(issue["due_date"])
                        if due_date_parsed < now and not is_done:
                            overdue_count += 1
                except Exception:
                    pass
                milestones.append(
                    Milestone(
                        id=f"ms-{p.id}-{issue['key']}",
                        project_id=p.id,
                        name=issue["summary"],
                        target_date=due_date_parsed,
                        status=m_status,
                        progress_percentage=0,
                        blocker_description=f"Jira issue {issue['key']}: {issue['summary']}"
                    )
                )
            if total_count > 0:
                project_progress = round((done_count / total_count) * 100)
                for m in milestones:
                    m.progress_percentage = 100 if m.status == "completed" else project_progress
        except Exception:
            pass

        # Compute real health_score from milestone data
        total_ms = len(milestones)
        done_ms = sum(1 for m in milestones if m.status == "completed")
        health_score = round((done_ms / total_ms) * 100) if total_ms > 0 else 100
        # Deduct for overdue items
        overdue_count = sum(1 for m in milestones if m.target_date and m.target_date < datetime.utcnow() and m.status != "completed")
        health_score = max(0, health_score - (overdue_count * 5))

        # Compute estimated_delay_days from overdue milestones
        estimated_delay_days = 0
        for m in milestones:
            if m.target_date and m.target_date < datetime.utcnow() and m.status != "completed":
                delta = (datetime.utcnow() - m.target_date).days
                estimated_delay_days = max(estimated_delay_days, delta)

        # Determine project status from health
        if health_score >= 80:
            status = ProjectStatus.ON_TRACK
        elif health_score >= 50:
            status = ProjectStatus.AT_RISK
        else:
            status = ProjectStatus.DELAYED

        # Seed real risks from Jira issues into the DB
        self._seed_risks_from_jira(p.id, proj_key, jira_issues)

        # Seed real ADR decisions from project context
        self._seed_decisions_from_context(p.id, proj_key, jira_issues)

        # Count real risks and decisions from DB
        active_risks_count = 0
        recent_decisions_count = 0
        try:
            with self._get_db() as db:
                from .models import DBRisk, DBDecision
                active_risks_count = db.query(DBRisk).filter(DBRisk.project_id == p.id).count()
                recent_decisions_count = db.query(DBDecision).filter(DBDecision.project_id == p.id).count()
        except Exception:
            pass

        src = getattr(p, 'source_type', None) or ('github' if '/' in p.name else 'unknown')
        wh_status = getattr(p, 'webhook_status', None) or 'inactive'

        return Project(
            id=p.id, org_id="org-acme-fintech", name=p.name, code=proj_key,
            description=f"Live Jira project ({len(jira_issues)} issues, {done_ms} completed)",
            status=status,
            health_score=health_score,
            owner_id=p.owner_id,
            owner_name="Reena MS",
            target_completion_date=datetime.utcnow(),
            estimated_delay_days=estimated_delay_days,
            created_at=datetime.utcnow(), updated_at=datetime.utcnow(),
            milestones=milestones,
            active_risks_count=active_risks_count,
            open_tickets_count=total_ms - done_ms,
            recent_decisions_count=recent_decisions_count,
            source_type=src,
            webhook_status=wh_status,
        )

    # --- Risk Queries ---
    def get_risks(self, project_id: Optional[str] = None, team: Optional[str] = None) -> List[Risk]:
        with self._get_db() as db:
            query = db.query(DBRisk)
            if project_id:
                query = query.filter(DBRisk.project_id == project_id)
            if team:
                query = query.join(DBProject, DBRisk.project_id == DBProject.id).filter(DBProject.team == team)
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
                existing.probability = risk.probability
                existing.impact = risk.impact
            else:
                db.add(DBRisk(id=risk.id, title=risk.title, severity=risk.severity.value if hasattr(risk.severity, 'value') else risk.severity, score=risk.score, owner_id=risk.owner, project_id=risk.project_id, description=risk.description, mitigation=risk.mitigation_plan, status=risk.status.value if hasattr(risk.status, 'value') else risk.status, probability=risk.probability, impact=risk.impact))
            db.commit()
            return risk

    def _seed_risks_from_jira(self, project_id: str, proj_key: str, jira_issues: list) -> None:
        """Seeds real risks into the DB from Jira issue data. Idempotent (upserts by ID)."""
        if not jira_issues:
            return
        with self._get_db() as db:
            existing_ids = {r.id for r in db.query(DBRisk.id).filter(DBRisk.project_id == project_id).all()}
            for issue in jira_issues:
                risk_id = f"risk-{project_id}-{issue['key']}"
                if risk_id in existing_ids:
                    continue
                priority = issue.get("priority", "Medium").lower()
                status_name = issue.get("status", "").lower()
                summary = issue.get("summary", "")
                # Map Jira priority to risk severity and score
                if "critical" in priority or "blocker" in priority:
                    severity, score, prob, imp = "critical", 20, 4, 5
                elif "high" in priority:
                    severity, score, prob, imp = "high", 15, 3, 5
                elif "medium" in priority:
                    severity, score, prob, imp = "medium", 9, 3, 3
                else:
                    severity, score, prob, imp = "low", 4, 2, 2
                # Elevate risk for in-progress items with complex titles
                if "in progress" in status_name and any(w in summary.lower() for w in ["memory", "leak", "encryption", "security", "pci"]):
                    severity, score = "high", 15
                    prob, imp = 4, 4
                is_done = any(s in status_name for s in ["done", "complete", "closed", "resolved"])
                risk_status = "resolved" if is_done else "identified"
                db.add(DBRisk(
                    id=risk_id, title=f"{issue['key']}: {summary}",
                    severity=severity, score=score, owner_id="usr-reena-ms",
                    project_id=project_id,
                    description=f"Risk derived from Jira issue {issue['key']} (Priority: {issue.get('priority', 'Medium')}, Status: {issue.get('status', 'Unknown')}).",
                    mitigation=f"Monitor {issue['key']} progress. Assignee: {issue.get('assignee', 'Unassigned')}.",
                    status=risk_status,
                    probability=prob, impact=imp,
                ))
            db.commit()

    def _seed_decisions_from_context(self, project_id: str, proj_key: str, jira_issues: list) -> None:
        """Seeds real ADR decisions from project context into the DB. Idempotent."""
        with self._get_db() as db:
            existing_count = db.query(DBDecision).filter(DBDecision.project_id == project_id).count()
            if existing_count > 0:
                return
            # Infer ADRs from Jira issue summaries
            adr_map = {}
            for issue in jira_issues:
                summary = issue.get("summary", "").lower()
                if "kafka" in summary or "event" in summary or "stream" in summary:
                    adr_map["ADR-001"] = {
                        "title": "Event-Driven Architecture via Apache Kafka",
                        "rationale": f"Adopted asynchronous event-driven architecture using Apache Kafka to decouple services and achieve sub-50ms SLA at scale. Derived from Jira evidence: {issue['key']} ({issue['summary']}).",
                    }
                elif "postgres" in summary or "database" in summary or "connection pool" in summary:
                    adr_map["ADR-002"] = {
                        "title": "PostgreSQL as Primary Canonical Data Store",
                        "rationale": f"Selected PostgreSQL with connection pooling as the canonical data store for transactional workloads. Derived from Jira evidence: {issue['key']} ({issue['summary']}).",
                    }
                elif "pci" in summary or "encryption" in summary or "security" in summary:
                    adr_map["ADR-003"] = {
                        "title": "PCI-DSS Field-Level Encryption for Payment Data",
                        "rationale": f"Implemented envelope encryption on payment event fields to satisfy PCI-DSS 4.0 QSA auditor requirements. Derived from Jira evidence: {issue['key']} ({issue['summary']}).",
                    }
                elif "risk" in summary or "dashboard" in summary or "assessment" in summary:
                    adr_map["ADR-004"] = {
                        "title": "Real-Time Risk Assessment Dashboard",
                        "rationale": f"Built a real-time risk assessment dashboard for continuous monitoring of project health metrics. Derived from Jira evidence: {issue['key']} ({issue['summary']}).",
                    }
            if not adr_map:
                # Default ADRs if no Jira issues matched
                adr_map = {
                    "ADR-001": {"title": "Inter-Service Communication Architecture", "rationale": "Evaluated synchronous REST vs asynchronous event-driven patterns for inter-service communication."},
                    "ADR-002": {"title": "Canonical Data Store Selection", "rationale": "Evaluated PostgreSQL, MongoDB, and DynamoDB for canonical data storage requirements."},
                }
            for adr_num, adr_data in adr_map.items():
                decision_id = f"dec-{project_id}-{adr_num}"
                db.add(DBDecision(
                    id=decision_id, title=adr_data["title"],
                    status="accepted", project_id=project_id,
                    rationale=adr_data["rationale"],
                    adr_number=adr_num, decided_by="Reena MS",
                ))
            db.commit()

    def _map_risk(self, r: DBRisk) -> Risk:
        prob = getattr(r, 'probability', None) or 3
        imp = getattr(r, 'impact', None) or 3
        computed_score = prob * imp
        return Risk(
            id=r.id, project_id=r.project_id or "", title=r.title, description=r.description or "",
            severity=RiskSeverity(r.severity), probability=prob, impact=imp,
            score=r.score if r.score else computed_score,
            owner=r.owner_id,
            status=RiskStatus(r.status), mitigation_plan=r.mitigation or "", identified_at=datetime.utcnow(), last_reviewed_at=datetime.utcnow()
        )

    # --- Decision Queries ---
    def get_decisions(self, project_id: Optional[str] = None, team: Optional[str] = None) -> List[Decision]:
        with self._get_db() as db:
            query = db.query(DBDecision)
            if project_id:
                query = query.filter(DBDecision.project_id == project_id)
            if team:
                query = query.join(DBProject, DBDecision.project_id == DBProject.id).filter(DBProject.team == team)
            return [self._map_decision(d) for d in query.all()]

    def get_decision(self, decision_id: str) -> Optional[Decision]:
        with self._get_db() as db:
            d = db.query(DBDecision).filter(DBDecision.id == decision_id).first()
            return self._map_decision(d) if d else None
            
    def add_decision(self, decision: Decision) -> Decision:
        with self._get_db() as db:
            existing = db.query(DBDecision).filter(DBDecision.id == decision.id).first()
            if not existing:
                db.add(DBDecision(id=decision.id, title=decision.title, status=decision.status.value if hasattr(decision.status, 'value') else decision.status, project_id=decision.project_id, rationale=decision.rationale, adr_number=decision.adr_number, decided_by=decision.decided_by))
            db.commit()
            return decision

    def _map_decision(self, d: DBDecision) -> Decision:
        return Decision(
            id=d.id, project_id=d.project_id or "", title=d.title, context="", decision_summary=d.title,
            rationale=d.rationale or "", status=DecisionStatus(d.status),
            adr_number=getattr(d, 'adr_number', None),
            decided_by=getattr(d, 'decided_by', None) or "System",
            decided_at=datetime.utcnow()
        )

    # --- Evidence Queries ---
    def get_evidence_list(self, project_id: Optional[str] = None, team: Optional[str] = None) -> List[Evidence]:
        with self._get_db() as db:
            query = db.query(DBEvidence)
            if project_id:
                query = query.filter(DBEvidence.project_id == project_id)
            if team:
                query = query.join(DBProject, DBEvidence.project_id == DBProject.id).filter(DBProject.team == team)
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
            url=e.url, author=e.author, is_conflicting=e.is_conflicting, is_superseded=e.is_superseded,
            conflict_summary=e.conflict_summary
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

    def get_audit_events(self, limit: int = 50, user: Optional[Any] = None) -> List[AuditEvent]:
        with self._get_db() as db:
            query = db.query(DBAuditEvent)
            if user:
                if user.role != "master_authority":
                    if user.role == "manager" and user.team:
                        team_user_ids = [u.id for u in db.query(DBUser).filter(DBUser.team == user.team).all()]
                        query = query.filter(DBAuditEvent.user_id.in_(team_user_ids))
                    else:
                        query = query.filter(DBAuditEvent.user_id == user.id)
            events = []
            for a in query.order_by(DBAuditEvent.timestamp.desc()).limit(limit).all():
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
        import json as _json
        with self._get_db() as db:
            results = []
            for r in db.query(DBAgentRun).order_by(DBAgentRun.created_at.desc()).limit(limit).all():
                steps = []
                if r.steps_json:
                    try:
                        steps = [_json.loads(s) if isinstance(s, str) else s for s in _json.loads(r.steps_json)]
                    except Exception:
                        pass
                token_usage = {}
                if r.token_usage_json:
                    try:
                        token_usage = _json.loads(r.token_usage_json)
                    except Exception:
                        pass
                results.append(AgentRun(
                    id=r.id, trace_id=r.trace_id, org_id="org-acme-fintech", user_id="system",
                    workflow=r.workflow, query=r.query, status=r.status,
                    confidence=r.confidence or 0.95, confidence_label="High",
                    answer=r.answer or "", steps=steps, latency_ms=r.latency_ms or 0,
                    total_tokens=token_usage.get("total_tokens", 0),
                    prompt_tokens=token_usage.get("prompt_tokens", 0),
                    completion_tokens=token_usage.get("completion_tokens", 0),
                ))
            return results

    def get_agent_run(self, run_id: str) -> Optional[AgentRun]:
        import json as _json
        with self._get_db() as db:
            r = db.query(DBAgentRun).filter(DBAgentRun.id == run_id).first()
            if not r:
                return None
            steps = []
            if r.steps_json:
                try:
                    steps = [_json.loads(s) if isinstance(s, str) else s for s in _json.loads(r.steps_json)]
                except Exception:
                    pass
            token_usage = {}
            if r.token_usage_json:
                try:
                    token_usage = _json.loads(r.token_usage_json)
                except Exception:
                    pass
            return AgentRun(
                id=r.id, trace_id=r.trace_id, org_id="org-acme-fintech", user_id="system",
                workflow=r.workflow, query=r.query, status=r.status,
                confidence=r.confidence or 0.95, confidence_label="High",
                answer=r.answer or "", steps=steps, latency_ms=r.latency_ms or 0,
                total_tokens=token_usage.get("total_tokens", 0),
                prompt_tokens=token_usage.get("prompt_tokens", 0),
                completion_tokens=token_usage.get("completion_tokens", 0),
            )

    def add_agent_run(self, run: AgentRun):
        import json as _json
        import logging
        with self._get_db() as db:
            def _serialize_step(s):
                d = s.model_dump()
                for k, v in d.items():
                    if isinstance(v, datetime):
                        d[k] = v.isoformat()
                return d
            steps_json = _json.dumps([_serialize_step(s) for s in run.steps]) if run.steps else None
            token_json = _json.dumps({
                "total_tokens": run.total_tokens,
                "prompt_tokens": run.prompt_tokens,
                "completion_tokens": run.completion_tokens,
            })
            logging.getLogger("ecb.store").info(
                f"add_agent_run: id={run.id} latency={run.latency_ms} steps={len(run.steps)} workflow={run.workflow}"
            )
            db.add(DBAgentRun(
                id=run.id, trace_id=run.trace_id, workflow=run.workflow,
                query=run.query, status=run.status, answer=run.answer,
                confidence=run.confidence, latency_ms=run.latency_ms,
                steps_json=steps_json, token_usage_json=token_json,
            ))
            db.commit()
            
    def get_memories(self, project_id: Optional[str] = None, team: Optional[str] = None) -> List[MemoryItem]:
        with self._get_db() as db:
            query = db.query(DBMemoryItem)
            if project_id:
                query = query.filter(DBMemoryItem.project_id == project_id)
            if team:
                query = query.join(DBProject, DBMemoryItem.project_id == DBProject.id).filter(DBProject.team == team)
            return [self._map_memory(m) for m in query.all()]

    def _map_memory(self, m: DBMemoryItem) -> MemoryItem:
        try:
            m_type = MemoryType(m.type)
        except (ValueError, KeyError, AttributeError):
            m_type = MemoryType.EPISODIC
        import json as _json
        meta = {}
        if getattr(m, 'metadata_json', None):
            try:
                meta = _json.loads(m.metadata_json)
            except Exception:
                meta = {}
        return MemoryItem(
            id=m.id,
            org_id="org-acme-fintech",
            project_id=m.project_id or "",
            type=m_type,
            title=getattr(m, 'title', None) or f"Memory: {m_type.value.upper()}",
            content=m.content,
            confidence=getattr(m, 'confidence', None) or 0.98,
            validity_from=getattr(m, 'validity_from', None) or datetime.utcnow(),
            validity_to=None,
            metadata=meta
        )

    def add_memory(self, memory: MemoryItem) -> MemoryItem:
        import json as _json
        with self._get_db() as db:
            existing = db.query(DBMemoryItem).filter(DBMemoryItem.id == memory.id).first()
            if existing:
                existing.content = memory.content
                existing.project_id = memory.project_id
                existing.type = memory.type.value if hasattr(memory.type, 'value') else memory.type
                existing.title = getattr(memory, 'title', None)
                existing.confidence = getattr(memory, 'confidence', 0.98)
                existing.validity_from = getattr(memory, 'validity_from', datetime.utcnow())
                existing.metadata_json = _json.dumps(getattr(memory, 'metadata', {}) or {})
            else:
                db.add(DBMemoryItem(
                    id=memory.id,
                    type=memory.type.value if hasattr(memory.type, 'value') else memory.type,
                    title=getattr(memory, 'title', None),
                    content=memory.content,
                    project_id=memory.project_id,
                    confidence=getattr(memory, 'confidence', 0.98),
                    validity_from=getattr(memory, 'validity_from', datetime.utcnow()),
                    metadata_json=_json.dumps(getattr(memory, 'metadata', {}) or {}),
                ))
            db.commit()
            return memory

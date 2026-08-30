from sqlalchemy import Column, String, Float, DateTime, Boolean, ForeignKey, Integer, JSON, Text
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class DBOrganization(Base):
    __tablename__ = "organizations"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    policy_profile = Column(String, nullable=False, default="enterprise_strict")
    created_at = Column(DateTime, default=datetime.utcnow)

class DBUser(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    org_id = Column(String, ForeignKey("organizations.id"))
    team = Column(String, nullable=True)
    api_key = Column(String, nullable=True, unique=True)
    is_manager = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBSource(Base):
    __tablename__ = "sources"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    is_connected = Column(Boolean, default=True)
    last_sync = Column(DateTime, nullable=True)

class DBProject(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False)
    owner_id = Column(String, nullable=False)
    team = Column(String, nullable=True)
    webhook_status = Column(String, nullable=True, default="unknown")
    source_type = Column(String, nullable=True, default="unknown")

class DBRisk(Base):
    __tablename__ = "risks"
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    score = Column(Integer, nullable=False)
    owner_id = Column(String, nullable=False)
    project_id = Column(String, nullable=True)
    description = Column(String, nullable=True)
    mitigation = Column(String, nullable=True)
    status = Column(String, nullable=False, default="identified")
    probability = Column(Integer, nullable=True, default=3)
    impact = Column(Integer, nullable=True, default=3)

class DBDecision(Base):
    __tablename__ = "decisions"
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    status = Column(String, nullable=False)
    project_id = Column(String, nullable=True)
    rationale = Column(String, nullable=True)
    adr_number = Column(String, nullable=True)
    decided_by = Column(String, nullable=True, default="System")

class DBSourceRecord(Base):
    __tablename__ = "source_records"
    id = Column(String, primary_key=True)
    source_id = Column(String, ForeignKey("sources.id"))
    title = Column(String, nullable=False)
    url = Column(String, nullable=True)
    author = Column(String, nullable=True)
    project_id = Column(String, nullable=True)
    source_type = Column(String, nullable=True)

class DBEvidence(Base):
    __tablename__ = "evidence"
    id = Column(String, primary_key=True)
    record_id = Column(String, ForeignKey("source_records.id"))
    excerpt = Column(String, nullable=False)
    is_conflicting = Column(Boolean, default=False)
    is_superseded = Column(Boolean, default=False)
    source_type = Column(String, nullable=True)
    source_title = Column(String, nullable=True)
    external_id = Column(String, nullable=True)
    project_id = Column(String, nullable=True)
    authority = Column(String, nullable=True)
    url = Column(String, nullable=True)
    author = Column(String, nullable=True)
    conflict_summary = Column(String, nullable=True)

class DBMemoryItem(Base):
    __tablename__ = "memory_items"
    id = Column(String, primary_key=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=True)
    content = Column(String, nullable=False)
    project_id = Column(String, nullable=True)
    confidence = Column(Float, default=0.98)
    validity_from = Column(DateTime, default=datetime.utcnow)
    metadata_json = Column(Text, nullable=True)

class DBActionPreview(Base):
    __tablename__ = "actions"
    id = Column(String, primary_key=True)
    tool_name = Column(String, nullable=False)
    risk_class = Column(String, nullable=False)
    requires_approval = Column(Boolean, default=True)
    status = Column(String, nullable=False)

class DBAuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    action = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(JSON, nullable=True)

class DBAgentRun(Base):
    __tablename__ = "agent_runs"
    id = Column(String, primary_key=True)
    trace_id = Column(String, nullable=False)
    workflow = Column(String, nullable=False)
    query = Column(String, nullable=False)
    status = Column(String, nullable=False)
    answer = Column(String, nullable=True)
    confidence = Column(Float, default=0.95)
    latency_ms = Column(Integer, default=0)
    steps_json = Column(Text, nullable=True)
    token_usage_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

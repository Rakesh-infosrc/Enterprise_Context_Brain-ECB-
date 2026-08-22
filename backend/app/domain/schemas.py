"""
Enterprise Context Brain (ECB) v2.1 - Canonical Data Model & Schema
Defines Pydantic models for organizations, projects, sources, evidence,
5-tier memory, risks, decisions, agent runs, actions, approvals, and audit events.
"""

from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# --- Enums ---

class SourceType(str, Enum):
    JIRA = "jira"
    GIT = "git"
    DOCUMENT = "document"
    ADR = "adr"
    SLACK = "slack"
    MEETING = "meeting"


class AuthorityLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class MemoryType(str, Enum):
    SEMANTIC = "semantic"       # Stable facts, architectural principles
    EPISODIC = "episodic"       # Events, sprint outcomes, incidents
    PROCEDURAL = "procedural"   # Workflows, release runbooks, approval rules
    DECISION = "decision"       # ADRs, rationale, trade-offs, supersession
    EXPERIENTIAL = "experiential" # Lessons learned, analogous historical patterns


class ProjectStatus(str, Enum):
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    DELAYED = "delayed"
    BLOCKED = "blocked"
    COMPLETED = "completed"


class RiskSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskStatus(str, Enum):
    IDENTIFIED = "identified"
    MONITORING = "monitoring"
    MITIGATING = "mitigating"
    RESOLVED = "resolved"
    ACCEPTED = "accepted"


class DecisionStatus(str, Enum):
    PROPOSED = "proposed"
    ACCEPTED = "accepted"
    SUPERSEDED = "superseded"
    DEPRECATED = "deprecated"
    REJECTED = "rejected"


class RiskClass(str, Enum):
    READ_ONLY = "read_only"       # Auto-executable (search, metrics)
    LOW_IMPACT = "low_impact"     # Policy-approved (comments, drafting)
    HIGH_IMPACT = "high_impact"   # Mandatory human approval (Jira status, git tags, arch change)
    PROHIBITED = "prohibited"     # Never executable by agent (direct prod delete)


class ActionStatus(str, Enum):
    PREVIEW = "preview"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AgentWorkflow(str, Enum):
    MANAGER = "manager"
    PROJECT_INTELLIGENCE = "project_intelligence"
    RISK_INTELLIGENCE = "risk_intelligence"
    DECISION_INTELLIGENCE = "decision_intelligence"


class StepStage(str, Enum):
    RECEIVED = "RECEIVED"
    AUTHORIZED = "AUTHORIZED"
    CONTEXT_PLANNING = "CONTEXT_PLANNING"
    RETRIEVING = "RETRIEVING"
    VALIDATING = "VALIDATING"
    REASONING = "REASONING"
    RECOMMENDATION_READY = "RECOMMENDATION_READY"
    POLICY_CHECK = "POLICY_CHECK"
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED"
    EXECUTING = "EXECUTING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    AUDITED = "AUDITED"


# --- Canonical Entity Models ---

class Organization(BaseModel):
    id: str
    name: str
    policy_profile: str = "enterprise_strict"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class User(BaseModel):
    id: str
    email: str
    name: str
    role: str = "project_manager" # project_manager, engineering_lead, data_lead, executive, admin
    org_id: str


class Source(BaseModel):
    id: str
    org_id: str
    type: SourceType
    name: str
    authority: AuthorityLevel = AuthorityLevel.HIGH
    is_connected: bool = True
    last_synced_at: datetime = Field(default_factory=datetime.utcnow)
    config: Dict[str, Any] = Field(default_factory=dict)


class SourceRecord(BaseModel):
    id: str
    source_id: str
    source_type: SourceType
    project_id: str
    external_id: str
    title: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    observed_at: datetime
    version: str = "1.0"
    author: Optional[str] = None


class Evidence(BaseModel):
    id: str
    source_record_id: str
    source_type: SourceType
    source_title: str
    external_id: str
    project_id: str
    excerpt: str
    authority: AuthorityLevel
    observed_at: datetime
    freshness_score: float = 1.0 # 0.0 to 1.0 (1.0 = extremely fresh)
    relevance_score: float = 1.0
    url: Optional[str] = None
    author: Optional[str] = None
    is_conflicting: bool = False
    conflict_summary: Optional[str] = None
    is_superseded: bool = False
    superseded_by: Optional[str] = None


class MemoryItem(BaseModel):
    id: str
    org_id: str
    project_id: Optional[str] = None
    type: MemoryType
    title: str
    content: str
    confidence: float = 0.95
    validity_from: datetime
    validity_to: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    linked_evidence_ids: List[str] = Field(default_factory=list)


class Risk(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    severity: RiskSeverity
    probability: int = Field(ge=1, le=5) # 1-5 scale
    impact: int = Field(ge=1, le=5)      # 1-5 scale
    score: int = 1                       # probability * impact (1 to 25)
    owner: str
    status: RiskStatus
    mitigation_plan: str
    linked_evidence_ids: List[str] = Field(default_factory=list)
    identified_at: datetime
    last_reviewed_at: datetime


class Decision(BaseModel):
    id: str
    project_id: str
    adr_number: Optional[str] = None # e.g. "ADR-002"
    title: str
    context: str
    decision_summary: str
    rationale: str
    status: DecisionStatus
    supersedes_id: Optional[str] = None
    superseded_by_id: Optional[str] = None
    alternatives_considered: List[Dict[str, str]] = Field(default_factory=list)
    consequences: List[str] = Field(default_factory=list)
    decided_by: str
    decided_at: datetime
    linked_evidence_ids: List[str] = Field(default_factory=list)


class Milestone(BaseModel):
    id: str
    project_id: str
    name: str
    target_date: datetime
    status: str # "completed", "in_progress", "at_risk", "delayed"
    progress_percentage: int = 0
    blocker_description: Optional[str] = None


class Project(BaseModel):
    id: str
    org_id: str
    name: str
    code: str # e.g. "AEGIS", "ORION"
    description: str
    status: ProjectStatus
    health_score: int = 85 # 0-100
    owner_id: str
    owner_name: str
    target_completion_date: datetime
    estimated_delay_days: int = 0
    created_at: datetime
    updated_at: datetime
    milestones: List[Milestone] = Field(default_factory=list)
    active_risks_count: int = 0
    open_tickets_count: int = 0
    recent_decisions_count: int = 0


# --- Governance, Policy, Actions & Approvals ---

class ActionPreview(BaseModel):
    id: str
    agent_run_id: str
    tool_name: str # e.g. "jira_create_issue", "jira_escalate", "slack_broadcast", "git_tag_release"
    target_system: str
    summary: str
    description: str
    risk_class: RiskClass
    requires_approval: bool
    status: ActionStatus
    params: Dict[str, Any] = Field(default_factory=dict)
    diff_preview: Optional[Dict[str, Any]] = None # e.g. {"field": "status", "from": "in_progress", "to": "escalated"}
    impact_assessment: str
    reversibility: str # "high", "moderate", "irreversible"
    rationale: Optional[str] = None
    suggested_by_agent: AgentWorkflow
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Approval(BaseModel):
    id: str
    action_id: str
    approver_id: str
    approver_name: str
    decision: str # "approved", "rejected"
    comment: Optional[str] = None
    decided_at: datetime = Field(default_factory=datetime.utcnow)


class AuditEvent(BaseModel):
    id: str
    org_id: str
    actor_id: str
    actor_name: str
    action_type: str
    entity_type: str
    entity_id: str
    policy_result: str # "ALLOWED", "BLOCKED", "APPROVAL_REQUIRED"
    trace_id: str
    details: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Agent Trace & Execution Models ---

class AgentStep(BaseModel):
    step_id: str
    stage: StepStage
    title: str
    description: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: int = 0
    status: str = "success" # "running", "success", "failed", "skipped"
    payload: Dict[str, Any] = Field(default_factory=dict)


class AgentRun(BaseModel):
    id: str
    trace_id: str
    org_id: str
    user_id: str
    workflow: AgentWorkflow
    query: str
    project_id: Optional[str] = None
    status: str = "completed"
    confidence: float = 0.95
    confidence_label: str = "High" # "High", "Moderate", "Limited"
    answer: str = ""
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    supporting_evidence_ids: List[str] = Field(default_factory=list)
    conflicting_evidence_ids: List[str] = Field(default_factory=list)
    superseded_evidence_ids: List[str] = Field(default_factory=list)
    proposed_actions: List[ActionPreview] = Field(default_factory=list)
    steps: List[AgentStep] = Field(default_factory=list)
    total_tokens: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    cost_usd: float = 0.0
    latency_ms: int = 0
    model_name: str = "ecb-context-engine-v2.1"
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Context Planning & API Contracts ---

class TemporalScope(BaseModel):
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    freshness_threshold_days: int = 30


class ContextPlan(BaseModel):
    query: str
    intent: str
    project_ids: List[str] = Field(default_factory=list)
    temporal_scope: TemporalScope = Field(default_factory=TemporalScope)
    target_entities: List[str] = Field(default_factory=list)
    required_evidence_types: List[SourceType] = Field(default_factory=list)
    authority_minimum: AuthorityLevel = AuthorityLevel.LOW
    context_budget_tokens: int = 4000
    planned_agent: AgentWorkflow = AgentWorkflow.MANAGER
    security_context: Dict[str, Any] = Field(default_factory=dict)


class QueryRequest(BaseModel):
    query: str
    project_id: Optional[str] = None
    time_range_days: Optional[int] = 30
    source_filters: Optional[List[SourceType]] = None
    workflow: Optional[AgentWorkflow] = None
    response_mode: str = "evidence_backed" # "evidence_backed", "executive_summary", "detailed_timeline"


class QueryResponse(BaseModel):
    trace_id: str
    agent_run_id: str
    answer: str
    confidence: float
    confidence_label: str
    context_plan: ContextPlan
    supporting_evidence: List[Evidence]
    conflicting_evidence: List[Evidence]
    superseded_evidence: List[Evidence]
    recommendation: Optional[ActionPreview] = None
    steps: List[AgentStep] = Field(default_factory=list)
    latency_ms: int
    token_usage: Dict[str, int]

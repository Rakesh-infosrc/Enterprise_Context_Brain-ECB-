// frontend/src/types/index.ts

export type SourceType = 'jira' | 'git' | 'adr' | 'slack' | 'confluence' | 'doc' | 'document' | 'databricks';

export type AuthorityLevel = 'high' | 'medium' | 'low';

export type MemoryType = 'semantic' | 'episodic' | 'procedural' | 'decision' | 'experiential';

export type RiskClass = 'read_only' | 'low_impact' | 'high_impact' | 'prohibited';

export type ActionStatus = 'pending_approval' | 'approved' | 'rejected' | 'completed' | 'failed';

export type AgentWorkflow =
  | 'manager'
  | 'project_intelligence'
  | 'risk_intelligence'
  | 'decision_intelligence'
  | 'security_intelligence'
  | 'budget_intelligence';

export interface Milestone {
  id: string;
  name: string;
  target_date: string;
  status: 'completed' | 'in_progress' | 'delayed' | 'blocked';
  progress_pct?: number;
  progress_percentage?: number;
  blocker_description?: string;
  owner?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'on_track' | 'at_risk' | 'delayed' | 'blocked';
  target_completion: string;
  health_score: number;
  milestones: Milestone[];
  active_risks_count: number;
  open_blockers_count: number;
  owner_name?: string;
  lead_architect?: string;
  project_manager?: string;
  estimated_delay_days?: number;
}

export interface Risk {
  id: string;
  project_id: string;
  title: string;
  description: string;
  likelihood?: number; // 1-5
  probability?: number;
  impact: number; // 1-5
  score: number; // 1-25
  severity: 'critical' | 'high' | 'medium' | 'low';
  mitigation?: string;
  mitigation_plan?: string;
  status: 'identified' | 'analyzed' | 'mitigating' | 'resolved';
  category: string;
  owner: string;
  last_reviewed_at?: string;
  source_record_id?: string;
}

export interface DecisionAlternative {
  name: string;
  pros?: string[];
  cons?: string[];
  selected?: boolean;
  technology?: string;
  status?: string;
}

export interface Decision {
  id: string;
  project_id: string;
  adr_number: string;
  title: string;
  status: 'proposed' | 'accepted' | 'superseded' | 'deprecated';
  supersedes_id?: string;
  superseded_by_id?: string;
  context: string;
  decision: string;
  rationale?: string;
  consequences: string | string[];
  alternatives?: any[];
  alternatives_considered?: any[];
  decided_at: string;
  decided_by?: string;
  author?: string;
}

export interface Evidence {
  id: string;
  source_record_id: string;
  source_type: SourceType;
  source_title: string;
  external_id: string;
  url?: string;
  excerpt: string;
  author?: string;
  authority: AuthorityLevel;
  observed_at: string;
  freshness_score: number;
  relevance_score?: number;
  is_conflicting: boolean;
  conflict_summary?: string;
  is_superseded?: boolean;
  superseded_by_id?: string;
  project_id: string;
}

export interface MemoryItem {
  id: string;
  project_id?: string;
  type: MemoryType;
  title: string;
  content: string;
  confidence: number;
  validity_from: string;
  validity_to?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface Mem0MemoryItem {
  id: string;
  user_id: string;
  project_id?: string;
  type: MemoryType;
  title: string;
  content: string;
  confidence: number;
  decay_half_life_days: number;
  validity_from: string;
  validity_to?: string;
  tags: string[];
  metadata: Record<string, any>;
}

export interface SkillMetadata {
  name: string;
  description: string;
  version: string;
  author: string;
  file_path: string;
  instructions: string;
}

export interface ActionPreview {
  id: string;
  tool_name: string;
  target_system: string;
  risk_class: RiskClass;
  requires_approval: boolean;
  summary: string;
  rationale: string;
  params: Record<string, any>;
  diff_preview?: any;
  status: ActionStatus;
  suggested_by_agent?: string;
  description?: string;
  impact_assessment?: string;
  reversibility?: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor_name: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  policy_result: string;
  trace_id: string;
  details: Record<string, any>;
}

export interface AgentStep {
  step_id: string;
  stage: string;
  title: string;
  description: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  status: 'pending' | 'in_progress' | 'success' | 'failed';
  payload?: Record<string, any>;
}

export interface AgentRun {
  id: string;
  trace_id: string;
  query: string;
  workflow: AgentWorkflow;
  status: string;
  answer: string;
  confidence: number;
  confidence_label: string;
  supporting_evidence_ids: string[];
  conflicting_evidence_ids: string[];
  proposed_action_ids: string[];
  latency_ms: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  created_at: string;
  steps: AgentStep[];
}

export interface ContextPlan {
  intent: string;
  target_entities: string[];
  temporal_scope_days: number;
  project_ids: string[];
  required_evidence_types: SourceType[];
  context_budget_tokens: number;
  planned_agent: AgentWorkflow;
}

export interface QueryRequest {
  query: string;
  project_id?: string;
  time_range_days?: number;
  source_filters?: SourceType[];
  workflow?: AgentWorkflow;
}

export interface QueryResponse {
  trace_id: string;
  agent_run_id: string;
  answer: string;
  confidence: number;
  confidence_label: string;
  context_plan: ContextPlan;
  supporting_evidence: Evidence[];
  conflicting_evidence: Evidence[];
  superseded_evidence: Evidence[];
  recommendation?: ActionPreview;
  steps: AgentStep[];
  latency_ms: number;
  token_usage: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export interface DashboardStats {
  evidence_backed_rate_pct: number;
  p95_retrieval_latency_ms: number;
  context_api_availability_pct: number;
  open_risks_count: number;
  critical_risks_count: number;
  active_decisions_count: number;
  pending_approvals_count: number;
  source_freshness_sla_minutes: number;
  total_projects: number;
}

export interface BenchmarkSummary {
  status: string;
  total_benchmarks_run: number;
  passed_count: number;
  failed_count: number;
  duration_ms: number;
  metrics: {
    groundedness_rate: number;
    citation_accuracy_rate: number;
    entity_coverage_rate: number;
    conflict_detection_rate: number;
    tool_safety_violations: number;
    target_groundedness: number;
    target_citation_accuracy: number;
    p95_retrieval_latency_ms: number;
  };
  detailed_results: any[];
}

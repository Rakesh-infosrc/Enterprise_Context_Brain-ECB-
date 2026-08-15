export interface DecisionRecord {
  id: string;
  project_code: string;
  decision: string;
  owner: string;
  reason: string;
  alternatives: string[];
  evidence: string[];
  expected_outcome: string;
  actual_outcome: string;
  status: 'Active' | 'Superseded' | 'Expired';
  confidence: number;
  supersedes?: string;
  created_at: string;
}

export interface ActionApproval {
  id: string;
  action_type: string;
  target_system: string;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  payload: any;
  evidence_summary: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  requested_by_agent: string;
  created_at: string;
}

export interface ContextInspection {
  memories: any[];
  decisions: DecisionRecord[];
}

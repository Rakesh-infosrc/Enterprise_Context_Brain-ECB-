export interface AgentMessage {
  role: 'user' | 'agent';
  content: string;
  intent?: string;
  confidence?: number;
  evidence?: EvidenceItem[];
  conflicts?: ConflictItem[];
  recommended_action?: RecommendedAction;
}

export interface RecommendedAction {
  action_id: string;
  action_type: string;
  target_system: string;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  description: string;
  requires_approval: boolean;
}

export interface EvidenceItem {
  id: string;
  source_type: string;
  source_id: string;
  content: string;
  trust_label: string;
  score: number;
}

export interface ConflictItem {
  type: string;
  severity: string;
  description: string;
  authoritative_source: string;
  conflicting_source: string;
}

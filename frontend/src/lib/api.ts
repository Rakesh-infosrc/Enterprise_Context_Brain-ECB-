// frontend/src/lib/api.ts

import {
  Project,
  Risk,
  Decision,
  Evidence,
  MemoryItem,
  Mem0MemoryItem,
  SkillMetadata,
  ActionPreview,
  AuditEvent,
  AgentRun,
  QueryRequest,
  QueryResponse,
  BenchmarkSummary,
  DashboardStats,
} from '../types';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api/v1';
let activeUserEmail = localStorage.getItem('ecb_active_user_email') || 'sarah.jenkins@acmefin.com';
let activeApiKey = localStorage.getItem('ecb_active_api_key') || '';
let authToken = '';

export const getActiveUserEmail = () => activeUserEmail;
export const getActiveApiKey = () => activeApiKey;

export const setPersona = (email: string, apiKey: string) => {
  activeUserEmail = email;
  activeApiKey = apiKey;
  authToken = '';
  localStorage.setItem('ecb_active_user_email', email);
  localStorage.setItem('ecb_active_api_key', apiKey);
};

async function ensureAuthenticated(signal?: AbortSignal) {
  if (activeApiKey) return;
  if (authToken) return;
  const formData = new URLSearchParams();
  formData.append('username', activeUserEmail);
  formData.append('password', 'password123');
  
  try {
    const res = await fetch(`${API_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
      signal,
    });
    if (res.ok) {
      const data = await res.json();
      authToken = data.access_token;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') return;
    if (import.meta.env.DEV) console.error("Auth failed", err);
  }
}

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  await ensureAuthenticated(options.signal as AbortSignal | undefined);
  const url = `${API_BASE}${endpoint}`;
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (activeApiKey) {
      headers['X-API-Key'] = activeApiKey;
    } else if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API error ${res.status}: ${errText || res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    if (import.meta.env.DEV) console.error(`Failed request to ${url}:`, err);
    throw err;
  }
}

export const api = {
  // Query & LangGraph Orchestration
  query: (req: QueryRequest): Promise<QueryResponse> =>
    fetchJson<QueryResponse>('/query', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  queryStream: async (req: QueryRequest, onEvent: (event: any) => void): Promise<void> => {
    await ensureAuthenticated();
    const url = `${API_BASE}/query/stream`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (activeApiKey) {
      headers['X-API-Key'] = activeApiKey;
    } else if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || ''; // Keep the incomplete part in the buffer
      
      for (const part of parts) {
        if (part.startsWith('data: ')) {
          const jsonStr = part.substring(6);
          try {
            onEvent(JSON.parse(jsonStr));
          } catch (e) {
            console.error("Failed to parse SSE JSON:", e);
          }
        }
      }
    }
  },

  getContextPlan: (req: QueryRequest) =>
    fetchJson('/context-plan', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  // Advanced GenAI Stack: Skills, Mem0, Qdrant & Llama Guard
  getSkills: (): Promise<SkillMetadata[]> =>
    fetchJson<SkillMetadata[]>('/skills'),

  getMem0Memories: (userId?: string, projectId?: string): Promise<Mem0MemoryItem[]> => {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (projectId) params.append('project_id', projectId);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<Mem0MemoryItem[]>(`/mem0/memories${queryStr}`);
  },

  getQdrantStats: (): Promise<any> =>
    fetchJson<any>('/qdrant/stats'),

  getMcpTools: (): Promise<any[]> =>
    fetchJson<any[]>('/mcp/tools'),

  checkSafety: (prompt: string): Promise<any> =>
    fetchJson<any>('/guard/check', {
      method: 'POST',
      body: JSON.stringify({ query: prompt }),
    }),

  // Projects
  getProjects: (): Promise<Project[]> =>
    fetchJson<Project[]>('/projects'),

  getArchitectureDocs: (): Promise<Array<{ id: string; title: string; filename: string }>> =>
    fetchJson<Array<{ id: string; title: string; filename: string }>>('/architecture-docs'),

  getProject: (id: string): Promise<Project> =>
    fetchJson<Project>(`/projects/${id}`),

  deleteProject: (id: string): Promise<any> =>
    fetchJson<any>(`/projects/${id}`, {
      method: 'DELETE',
    }),

  // Risks
  getRisks: (projectId?: string): Promise<Risk[]> => {
    const query = projectId ? `?project_id=${projectId}` : '';
    return fetchJson<Risk[]>(`/risks${query}`);
  },

  // Decisions
  getDecisions: (projectId?: string): Promise<Decision[]> => {
    const query = projectId ? `?project_id=${projectId}` : '';
    return fetchJson<Decision[]>(`/decisions${query}`);
  },

  // Evidence
  getEvidenceList: (projectId?: string): Promise<Evidence[]> => {
    const query = projectId ? `?project_id=${projectId}` : '';
    return fetchJson<Evidence[]>(`/evidence${query}`);
  },

  getContradictions: (projectId?: string): Promise<{ contradictions: Array<{ id: string; project_id: string; source_title: string; conflict_summary: string; source_type: string; observed_at: string | null; url: string | null; authority: string }>; total: number }> => {
    const query = projectId ? `?project_id=${projectId}` : '';
    return fetchJson(`/contradictions${query}`);
  },

  getEvidence: (id: string): Promise<Evidence> =>
    fetchJson<Evidence>(`/evidence/${id}`),

  // Actions & Approvals
  getActions: (): Promise<ActionPreview[]> =>
    fetchJson<ActionPreview[]>('/actions'),

  approveAction: (actionId: string, comment?: string, approverId?: string): Promise<any> =>
    fetchJson(`/actions/${actionId}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        approver_id: approverId || 'usr-sarah-jenkins',
        comment: comment || 'Approved after review of architecture impact.',
      }),
    }),

  rejectAction: (actionId: string, reason: string, approverId?: string): Promise<any> =>
    fetchJson(`/actions/${actionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({
        approver_id: approverId || 'usr-sarah-jenkins',
        reason,
      }),
    }),

  // Traces & Audits
  getAgentRuns: (limit: number = 20): Promise<AgentRun[]> =>
    fetchJson<AgentRun[]>(`/agent-runs?limit=${limit}`),

  getAuditEvents: (limit: number = 50): Promise<AuditEvent[]> =>
    fetchJson<AuditEvent[]>(`/audit-events?limit=${limit}`),

  // AI Evaluation Benchmark
  runEvaluationSuite: (): Promise<BenchmarkSummary> =>
    fetchJson<BenchmarkSummary>('/eval/run', {
      method: 'POST',
    }),

  // MCP Training Dataset & Coverage Evaluation
  getGitDataset: (repo?: string, maxCommits?: number): Promise<any> =>
    fetchJson(`/mcp/dataset/git?repo=${repo || 'testing842/clara-V2'}&max_commits=${maxCommits || 20}`),

  getJiraDataset: (projectKey?: string): Promise<any> =>
    fetchJson(`/mcp/dataset/jira?project_key=${projectKey || 'KAN'}`),

  getMcpCoverage: (): Promise<any> =>
    fetchJson('/mcp/coverage'),

  getConnectionSettings: (): Promise<any> =>
    fetchJson<any>('/settings/connections'),

  saveConnectionSettings: (settings: any): Promise<any> =>
    fetchJson<any>('/settings/connections', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),

  syncConnector: (connector: 'databricks' | 'jira' | 'github'): Promise<any> =>
    fetchJson<any>(`/settings/connections/sync/${connector}`, {
      method: 'POST',
    }),

  // Stats & Health
  getStats: (): Promise<DashboardStats> =>
    fetchJson<DashboardStats>('/stats'),

  getHealth: () => fetchJson('/health'),
};

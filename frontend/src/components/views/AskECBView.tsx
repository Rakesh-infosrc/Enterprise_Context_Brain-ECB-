// frontend/src/components/views/AskECBView.tsx

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Shield,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  GitCommit,
  GitPullRequest,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sliders,
  Check,
  X,
  Zap,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import {
  Project,
  SourceType,
  AgentWorkflow,
  QueryResponse,
  Evidence,
  ActionPreview,
} from '../../types';
import { api } from '../../lib/api';
import { ContextScopeBar } from '../ContextScopeBar';
import { NavItem } from '../Sidebar';
import { Tooltip } from '../Tooltip';

interface AskECBViewProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  initialQuestion?: string;
  onSelectView: (view: NavItem) => void;
  onRefreshStats: () => void;
}

export const AskECBView: React.FC<AskECBViewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  initialQuestion = '',
  onSelectView,
  onRefreshStats,
}) => {
  const [query, setQuery] = useState(initialQuestion || 'Why is Project Aegis delayed?');
  const [timeRangeDays, setTimeRangeDays] = useState(30);
  const [selectedSources, setSelectedSources] = useState<SourceType[]>([
    'jira',
    'git',
    'adr',
    'slack',
    'confluence',
  ]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AgentWorkflow | undefined>(undefined);

    const [isStreaming, setIsStreaming] = useState(false);
  const [streamedAnswer, setStreamedAnswer] = useState('');
  const [agentSteps, setAgentSteps] = useState<any[]>([]);
const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<'supporting' | 'conflicting' | 'superseded'>('supporting');
  const [selectedEvidenceDetail, setSelectedEvidenceDetail] = useState<Evidence | null>(null);

  const [isApproving, setIsApproving] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuestion) {
      setQuery(initialQuestion);
      handleExecuteQuery(initialQuestion);
    }
  }, [initialQuestion]);

  const handleExecuteQuery = async (queryToRun?: string) => {
    const q = queryToRun || query;
    if (!q.trim()) return;

    setIsLoading(true);
    setIsStreaming(true);
    setStreamedAnswer('');
    setAgentSteps([]);
    setResponse(null);
    setActionSuccessMsg(null);
    setSelectedEvidenceDetail(null);

    try {
      await api.queryStream({
        query: q,
        project_id: activeProjectId,
        time_range_days: timeRangeDays,
        source_filters: selectedSources,
        workflow: selectedWorkflow,
      }, (event) => {
        setIsLoading(false); // Hide shimmer once stream starts
        if (event.type === 'step') {
          setAgentSteps(prev => [...prev, event.data]);
        } else if (event.type === 'token') {
          setStreamedAnswer(prev => prev + event.content);
        } else if (event.type === 'complete') {
          setResponse(event.data);
          setIsStreaming(false);
          if (event.data.conflicting_evidence && event.data.conflicting_evidence.length > 0) {
            setActiveEvidenceTab('conflicting');
          } else {
            setActiveEvidenceTab('supporting');
          }
        }
      });
    } catch (err) {
      console.error('Query execution failed:', err);
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleApproveAction = async (actionId: string) => {
    setIsApproving(true);
    try {
      await api.approveAction(
        actionId,
        'Approved by user in Ask ECB operating console after reviewing evidence diff.'
      );
      setActionSuccessMsg('Action successfully executed via Model Context Protocol (MCP)!');
      onRefreshStats();
    } catch (e) {
      console.error('Failed to approve action:', e);
    } finally {
      setIsApproving(false);
    }
  };

  const starterChips = [
    { label: 'Project Aegis Delay', query: 'Why is Project Aegis delayed and what is the root cause?' },
    { label: 'ADR-002 Kafka Rationale', query: 'Why was synchronous REST replaced with Kafka in ADR-002?' },
    { label: 'Critical Risks', query: 'What are the critical open risks for Project Aegis?' },
    { label: 'Postgres vs Mongo Rationale', query: 'Why did we choose PostgreSQL with pgvector over MongoDB or graph databases?' },
  ];

  return (
    <div className="view-transition-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Context Scope Selector Bar */}
      <ContextScopeBar
        projects={projects}
        selectedProjectId={activeProjectId}
        onSelectProject={onSelectProject}
        timeRangeDays={timeRangeDays}
        onSelectTimeRange={setTimeRangeDays}
        selectedSources={selectedSources}
        onToggleSource={(src) => {
          if (selectedSources.includes(src)) {
            if (selectedSources.length > 1) {
              setSelectedSources(selectedSources.filter((s) => s !== src));
            }
          } else {
            setSelectedSources([...selectedSources, src]);
          }
        }}
        selectedWorkflow={selectedWorkflow}
        onSelectWorkflow={setSelectedWorkflow}
      />

      {/* 2. Interactive Prompt Composer */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem 1.75rem',
          background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.85) 0%, rgba(17, 34, 54, 0.7) 100%)',
          border: '1px solid rgba(92, 168, 255, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={16} color="#9b7cff" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
            Ask ECB Command Prompt
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            • LangGraph Orchestrated • Llama Guard 3 Protected • Mem0 Enhanced
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            className="glass-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleExecuteQuery();
              }
            }}
            placeholder="Ask anything across Jira, Git commits, ADR decisions, risk registers, and Slack..."
            style={{ fontSize: '0.9rem', padding: '0.75rem 1.15rem' }}
          />

          <button
            className="glass-btn glass-btn-primary"
            onClick={() => handleExecuteQuery()}
            disabled={isLoading || isStreaming || !query.trim()}
            style={{ padding: '0.75rem 1.4rem', whiteSpace: 'nowrap' }}
          >
            {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            <span>{(isLoading || isStreaming) ? 'Synthesizing...' : 'Execute Query'}</span>
          </button>
        </div>

        {/* Starter Prompt Quick Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Try asking:</span>
          {starterChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(chip.query);
                handleExecuteQuery(chip.query);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '9999px',
                padding: '0.25rem 0.65rem',
                fontSize: '0.72rem',
                color: '#cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(92, 168, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(92, 168, 255, 0.35)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Loading Shimmer & Agent Trace State */}
      {(isLoading || isStreaming) && !response && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          {isLoading && agentSteps.length === 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div className="skeleton-shimmer" style={{ width: '140px', height: '24px' }} />
                <div className="skeleton-shimmer" style={{ width: '90px', height: '24px' }} />
              </div>
              <div className="skeleton-shimmer" style={{ width: '100%', height: '18px', marginBottom: '0.65rem' }} />
              <div className="skeleton-shimmer" style={{ width: '92%', height: '18px', marginBottom: '0.65rem' }} />
              <div className="skeleton-shimmer" style={{ width: '75%', height: '18px' }} />
            </>
          )}

          {agentSteps.length > 0 && (
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Zap size={16} color="#00f0ff" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#00f0ff' }}>Live Agent Trace</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {agentSteps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <CheckCircle2 size={14} color="#35d07f" />
                    <strong>{step.title}:</strong>
                    <span style={{ color: '#94a3b8' }}>{step.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {streamedAnswer && (
            <div style={{ fontSize: '0.9rem', lineHeight: 1.65, color: '#e2e8f0', whiteSpace: 'pre-line' }}>
              {streamedAnswer}
              <span className="animate-pulse" style={{ display: 'inline-block', width: '6px', height: '14px', backgroundColor: '#5ca8ff', marginLeft: '4px', verticalAlign: 'middle' }}></span>
            </div>
          )}
        </div>
      )}

      {/* 4. Synthesized Answer & Evidence Rail Grid */}
      {response && !isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.85fr 1.15fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Formatted AI Answer & Governed Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              {/* Answer Header with Safety & CoVe Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Tooltip content="Factual Grounding verified via Natural Language Inference (NLI) against retrieved evidence fixtures.">
                    <span className="glass-pill glass-btn-success" style={{ fontSize: '0.72rem', cursor: 'help' }}>
                      <CheckCircle2 size={13} /> {(response.confidence * 100).toFixed(0)}% Grounded
                    </span>
                  </Tooltip>

                  <Tooltip content="Input and output guardrail protection against prompt injections, jailbreaks, and PII leaks.">
                    <span className="glass-pill" style={{ color: '#00f0ff', borderColor: 'rgba(0, 240, 255, 0.3)', fontSize: '0.72rem', cursor: 'help' }}>
                      <ShieldCheck size={13} /> Llama Guard 3 Safe
                    </span>
                  </Tooltip>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span>Latency: <strong style={{ color: '#5ca8ff' }}>{response.latency_ms}ms</strong></span>
                  <span>Tokens: <strong>{response.token_usage?.total_tokens}</strong></span>
                </div>
              </div>

              {/* Markdown Synthesized Body */}
              <div
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.65,
                  color: '#e2e8f0',
                  whiteSpace: 'pre-line',
                }}
              >
                {response.answer}
              </div>

              {/* Citations Footer Row */}
              <div
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Verified Citations:</span>
                {response.supporting_evidence?.concat(response.conflicting_evidence || []).map((ev, i) => (
                  <button
                    key={ev.id}
                    className="citation-badge"
                    onClick={() => setSelectedEvidenceDetail(ev)}
                    title="Click to inspect source provenance in Evidence Rail"
                  >
                    [E{i + 1}] {ev.source_title}
                  </button>
                ))}
              </div>
            </div>

            {/* Governed Action Recommendation Preview */}
            {response.recommendation && (
              <div
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  border: '1px solid rgba(155, 124, 255, 0.35)',
                  background: 'linear-gradient(135deg, rgba(20, 15, 35, 0.8) 0%, rgba(13, 27, 42, 0.85) 100%)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span className="glass-pill" style={{ background: 'rgba(155, 124, 255, 0.2)', color: '#c084fc', borderColor: 'rgba(155, 124, 255, 0.4)' }}>
                        Governed MCP Action Proposed
                      </span>
                      <span className="glass-pill" style={{ color: '#ff6b7a', borderColor: 'rgba(255, 107, 122, 0.4)' }}>
                        {response.recommendation.risk_class.toUpperCase()}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                      {response.recommendation.summary}
                    </h4>
                  </div>
                </div>

                <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {response.recommendation.rationale || response.recommendation.description}
                </p>

                {/* Diff Preview */}
                {response.recommendation.diff_preview && (
                  <div
                    style={{
                      background: 'rgba(5, 11, 20, 0.85)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>// Proposed Jira Mutation Diff</div>
                    <div style={{ color: '#ff6b7a' }}>- target_date: &quot;{response.recommendation.diff_preview.from_value}&quot;</div>
                    <div style={{ color: '#35d07f' }}>+ target_date: &quot;{response.recommendation.diff_preview.to_value}&quot;</div>
                    <div style={{ color: '#5ca8ff', marginTop: '0.25rem' }}>// Rationale: {response.recommendation.diff_preview.rationale}</div>
                  </div>
                )}

                {/* Approval Execution Buttons */}
                {actionSuccessMsg ? (
                  <div
                    style={{
                      background: 'rgba(53, 208, 127, 0.15)',
                      border: '1px solid rgba(53, 208, 127, 0.4)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      color: '#35d07f',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>{actionSuccessMsg}</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button
                      className="glass-btn glass-btn-primary"
                      disabled={isApproving}
                      onClick={() => handleApproveAction(response.recommendation!.id)}
                      style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
                    >
                      {isApproving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      <span>Approve &amp; Execute via MCP</span>
                    </button>
                    <button
                      className="glass-btn"
                      onClick={() => onSelectView('approval_center')}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <span>Review in Approval Center</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Live Evidence Rail with Supporting / Conflicting Tabs */}
          <div className="glass-panel" style={{ padding: '1.25rem', position: 'sticky', top: '90px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                Live Evidence Rail
              </h3>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                Prov. SLA: 2.8m Fresh
              </span>
            </div>

            {/* Evidence Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setActiveEvidenceTab('supporting')}
                style={{
                  background: activeEvidenceTab === 'supporting' ? 'rgba(92, 168, 255, 0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: activeEvidenceTab === 'supporting' ? '#5ca8ff' : '#94a3b8',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Supporting ({response.supporting_evidence?.length || 0})
              </button>

              <button
                onClick={() => setActiveEvidenceTab('conflicting')}
                style={{
                  background: activeEvidenceTab === 'conflicting' ? 'rgba(251, 146, 60, 0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: activeEvidenceTab === 'conflicting' ? '#fb923c' : '#94a3b8',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ⚠️ Conflicting ({response.conflicting_evidence?.length || 0})
              </button>

              <button
                onClick={() => setActiveEvidenceTab('superseded')}
                style={{
                  background: activeEvidenceTab === 'superseded' ? 'rgba(155, 124, 255, 0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: activeEvidenceTab === 'superseded' ? '#c084fc' : '#94a3b8',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Superseded ({response.superseded_evidence?.length || 0})
              </button>
            </div>

            {/* Evidence Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
              {(activeEvidenceTab === 'supporting'
                ? response.supporting_evidence
                : activeEvidenceTab === 'conflicting'
                ? response.conflicting_evidence
                : response.superseded_evidence || []
              )?.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvidenceDetail(ev)}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: '8px',
                    background: selectedEvidenceDetail?.id === ev.id ? 'rgba(92, 168, 255, 0.15)' : 'rgba(10, 20, 32, 0.6)',
                    border: ev.is_conflicting
                      ? '1px solid rgba(251, 146, 60, 0.4)'
                      : selectedEvidenceDetail?.id === ev.id
                      ? '1px solid #5ca8ff'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff' }}>
                      {ev.source_title}
                    </span>
                    <span className="glass-pill" style={{ fontSize: '0.62rem' }}>
                      {ev.source_type.toUpperCase()}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.35, margin: '0.25rem 0' }}>
                    {ev.excerpt.slice(0, 110)}...
                  </p>

                  {ev.conflict_summary && (
                    <div style={{ fontSize: '0.7rem', color: '#fb923c', marginTop: '0.25rem' }}>
                      ⚠️ {ev.conflict_summary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

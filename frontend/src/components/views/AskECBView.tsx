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
  Trash2,
  History,
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
import { RippleButton } from "@/components/ui/ripple-button";

const FormattedMarkdown: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const lines = text.split('\n');

  const renderInline = (lineText: string) => {
    // Split by inline code `...`
    const codeParts = lineText.split(/(`[^`]+`)/g);

    return codeParts.map((part, pIdx) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
        const codeContent = part.slice(1, -1);
        return (
          <code
            key={pIdx}
            style={{
              background: 'rgba(92, 168, 255, 0.15)',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(92, 168, 255, 0.3)',
              borderRadius:'var(--radius-sm)',
              padding: '0.12rem 0.45rem',
              fontSize: 'var(--fs-sm)',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 600,
            }}
          >
            {codeContent}
          </code>
        );
      }

      // Split by **bold**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 3) {
          const boldContent = bPart.slice(2, -2);
          if (boldContent.startsWith('*') && boldContent.endsWith('*') && boldContent.length > 1) {
            return (
              <strong key={bIdx} style={{ color: 'var(--text-primary)', fontWeight: 700, fontStyle: 'italic' }}>
                {boldContent.slice(1, -1)}
              </strong>
            );
          }
          return (
            <strong key={bIdx} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              {boldContent}
            </strong>
          );
        }

        // Split by *italic*
        const italicParts = bPart.split(/(\*[^*]+\*)/g);
        return italicParts.map((iPart, iIdx) => {
          if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 1) {
            return (
              <span key={iIdx} style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                {iPart.slice(1, -1)}
              </span>
            );
          }
          return iPart;
        });
      });
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} style={{ height: '0.35rem' }} />;
        }

        // Headings (### or ##)
        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={idx}
              style={{
                fontSize: '1.08rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.35rem',
                marginTop: idx === 0 ? 0 : '0.9rem',
                marginBottom: '0.35rem',
              }}
            >
              {renderInline(trimmed.replace(/^###\s+/, ''))}
            </h3>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={idx}
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                borderBottom: '1px solid rgba(92, 168, 255, 0.2)',
                paddingBottom: '0.45rem',
                marginTop: idx === 0 ? 0 : '1.1rem',
                marginBottom: '0.45rem',
              }}
            >
              {renderInline(trimmed.replace(/^##\s+/, ''))}
            </h2>
          );
        }

        // Unordered List Items (- or *)
        if (/^[-*]\s+/.test(trimmed)) {
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', paddingLeft: '0.4rem' }}>
              <span style={{ color: 'var(--accent-blue)', fontSize: 'var(--fs-base)', lineHeight: 1.5 }}>•</span>
              <div style={{ flex: 1 }}>{renderInline(trimmed.replace(/^[-*]\s+/, ''))}</div>
            </div>
          );
        }

        // Ordered List Items (1., 2., etc.)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', paddingLeft: '0.4rem' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.82rem', minWidth: '18px' }}>
                {numMatch[1]}.
              </span>
              <div style={{ flex: 1 }}>{renderInline(numMatch[2])}</div>
            </div>
          );
        }

        // Regular Paragraph
        return <p key={idx} style={{ margin: 0 }}>{renderInline(line)}</p>;
      })}
    </div>
  );
};

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
  const [query, setQuery] = useState(initialQuestion || `What are the critical risks and live Jira issues for ${projects[0]?.name || 'this project'}?`);
  const [timeRangeDays, setTimeRangeDays] = useState(30);
  const [selectedSources, setSelectedSources] = useState<SourceType[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AgentWorkflow | undefined>(undefined);

    const [isStreaming, setIsStreaming] = useState(false);
  const [streamedAnswer, setStreamedAnswer] = useState('');
  const [agentSteps, setAgentSteps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<'supporting' | 'conflicting' | 'superseded'>('supporting');
  const [selectedEvidenceDetail, setSelectedEvidenceDetail] = useState<Evidence | null>(null);

  const [isApproving, setIsApproving] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Temporary local search history — one row per search, click to view AI response. Deleting here does NOT affect Mem0 project DB.
  type LocalHist = { id: string; query: string; answeredAt: string; projectId: string; response: QueryResponse };
  const histKey = `ecb_ask_history_${activeProjectId || 'all'}`;
  const [searchHistory, setSearchHistory] = useState<LocalHist[]>(() => {
    try { const raw = localStorage.getItem(histKey); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const persistHist = (next: LocalHist[]) => {
    setSearchHistory(next);
    try { localStorage.setItem(histKey, JSON.stringify(next.slice(0, 20))); } catch {}
  };
  useEffect(() => {
    try { const raw = localStorage.getItem(histKey); setSearchHistory(raw ? JSON.parse(raw) : []); } catch { setSearchHistory([]); }
  }, [histKey]);
  const handleDeleteHistory = (hid: string) => {
    if (!confirm('Remove this history entry? This is local only and will NOT delete from Mem0 project DB.')) return;
    const next = searchHistory.filter(h => h.id !== hid);
    persistHist(next);
  };
  const handleClickHistory = (h: LocalHist) => {
    setQuery(h.query);
    setResponse(h.response);
    setAgentSteps(h.response.steps || []);
    setErrorMsg(null);
    // scroll to response
    setTimeout(() => document.getElementById('ecb-answer-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

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
    setErrorMsg(null);
    setActionSuccessMsg(null);
    setSelectedEvidenceDetail(null);

    const targetProject = activeProjectId && activeProjectId !== 'all' ? activeProjectId : (projects[0]?.id || 'prj-kan');
    const pushHist = (r: QueryResponse) => {
      const entry: LocalHist = { id: r.agent_run_id || `hist-${Date.now()}`, query: q, answeredAt: new Date().toISOString(), projectId: targetProject, response: r };
      setSearchHistory(prev => {
        const dedup = prev.filter(h => h.id !== entry.id);
        const next = [entry, ...dedup].slice(0, 20);
        try { localStorage.setItem(histKey, JSON.stringify(next)); } catch {}
        return next;
      });
    };

    try {
      // Primary: Fast, stateful REST query execution
      const resData = await api.query({
        query: q,
        project_id: targetProject,
        time_range_days: timeRangeDays,
        source_filters: selectedSources,
        workflow: selectedWorkflow,
      });

      if (resData && resData.answer) {
        setResponse(resData);
        pushHist(resData);
        if (resData.steps) setAgentSteps(resData.steps);
        if (resData.conflicting_evidence && resData.conflicting_evidence.length > 0) {
          setActiveEvidenceTab('conflicting');
        } else {
          setActiveEvidenceTab('supporting');
        }
      } else {
        throw new Error("No response data returned from query execution.");
      }
    } catch (err: any) {
      console.warn('Standard REST query failed, attempting SSE stream fallback:', err);
      try {
        let received = false;
        await api.queryStream({
          query: q,
          project_id: targetProject,
          time_range_days: timeRangeDays,
          source_filters: selectedSources,
          workflow: selectedWorkflow,
        }, (event) => {
          if (event.type === 'step') {
            setAgentSteps(prev => [...prev, event.data]);
          } else if (event.type === 'token') {
            setStreamedAnswer(prev => prev + event.content);
          } else if (event.type === 'complete') {
            received = true;
            setResponse(event.data);
            pushHist(event.data);
          }
        });

        if (!received && !streamedAnswer) {
          setErrorMsg(err?.message || 'Query execution failed to retrieve an answer from the backend API server.');
        }
      } catch (streamErr: any) {
        console.error('All query execution methods failed:', streamErr);
        setErrorMsg(err?.message || streamErr?.message || 'Failed to communicate with the ECB backend API server.');
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      onRefreshStats();
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

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const projectName = activeProject?.name || 'this project';

  const starterChips = [
    { label: `${activeProject?.code || 'Project'} Risks`, query: `What are the critical open risks and blockers for ${projectName}?` },
    { label: 'Jira Board Summary', query: `Summarize all live Jira issues currently in progress for project ${activeProject?.code || 'KAN'}.` },
    { label: 'Recent Commits', query: `What recent Git commits have been pushed for ${projectName}?` },
    { label: 'Architecture Decisions', query: 'What architecture decisions have been recorded?' },
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
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--fs-xs)' }}>
          <Sparkles size={16} color="#8b5cf6" />
          <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
            Ask ECB Command Prompt
          </span>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            • LangGraph Orchestrated • Llama Guard 3 Protected • Mem0 Enhanced
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--fs-xs)', alignItems: 'center' }}>
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

          <RippleButton rippleColor="rgba(99,102,241,0.15)" duration="600ms"
            className="glass-btn glass-btn-primary"
            onClick={() => handleExecuteQuery()}
            disabled={isLoading || isStreaming || !query.trim()}
            style={{ padding: '0.75rem 1.4rem', whiteSpace: 'nowrap' }}
          >
            {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            <span>{(isLoading || isStreaming) ? 'Synthesizing...' : 'Execute Query'}</span>
          </RippleButton>
        </div>

        {/* Starter Prompt Quick Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'var(--fs-base)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontWeight: 600 }}>Try asking:</span>
          {starterChips.map((chip, idx) => (
            <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
              key={idx}
              onClick={() => {
                setQuery(chip.query);
                handleExecuteQuery(chip.query);
              }}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '9999px',
                padding: '0.25rem 0.65rem',
                fontSize: 'var(--fs-xs)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(92, 168, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(92, 168, 255, 0.35)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {chip.label}
            </RippleButton>
          ))}
        </div>

        {/* Search History — TEMPORARY, one row per search, click to view AI response. Deleting here does NOT touch Mem0 DB. */}
        <div style={{ marginTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>
              <History size={13} /> Search History
              <span style={{ fontSize: '0.62rem', fontWeight: 700, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 999, padding: '0.1rem 0.35rem' }}>{searchHistory.length}</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-faint)', fontWeight: 600 }}>— temporary, local only (deleting here does not affect Mem0)</span>
            </div>
            {searchHistory.length > 0 && (
              <button onClick={() => { if (!confirm('Clear all temporary history? Mem0 DB will be untouched.')) return; persistHist([]); }} style={{ fontSize: '0.62rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Clear all</button>
            )}
          </div>
          {searchHistory.length === 0 ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', fontStyle: 'italic', background: 'var(--bg-surface)', border: '1px dashed var(--border-subtle)', borderRadius: 8, padding: '0.6rem 0.75rem' }}>No history yet — your searches will appear here one per row. Click any row to reload that AI response. Move to another page and back — history stays (local). Delete here never touches Mem0.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 220, overflowY: 'auto', paddingRight: 2 }}>
              {searchHistory.map((h) => (
                <div
                  key={h.id}
                  onClick={() => handleClickHistory(h)}
                  title="Click to view AI response"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.55rem 0.6rem 0.55rem 0.7rem', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.query}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                      <span>{new Date(h.answeredAt).toLocaleTimeString()} · {h.projectId}</span>
                      <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '0.05rem 0.28rem' }}>{h.response?.latency_ms || 0}ms · {(h.response?.confidence ? Math.round(h.response.confidence*100) : 0)}% grounded</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--accent-blue)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><ExternalLink size={11} /> View</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteHistory(h.id); }}
                    title="Remove from temporary history only — Mem0 untouched"
                    style={{ width: 24, height: 24, borderRadius: 999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div id="ecb-answer-panel" style={{ height: 1 }} />
        </div>
      </div>

      {/* 2.5 Error Banner */}
      {errorMsg && (
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', border: '1px solid rgba(255, 107, 122, 0.4)', background: 'rgba(255, 107, 122, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-rose)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
            <AlertTriangle size={18} />
            <span>Query Execution Warning</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
            {errorMsg}
          </p>
        </div>
      )}

      {/* 3. Loading Shimmer & Agent Trace State */}
      {(isLoading || isStreaming) && !response && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          {isLoading && agentSteps.length === 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--fs-xs)', marginBottom: '1.25rem' }}>
                <div className="skeleton-shimmer" style={{ width: '140px', height: '24px' }} />
                <div className="skeleton-shimmer" style={{ width: '90px', height: '24px' }} />
              </div>
              <div className="skeleton-shimmer" style={{ width: '100%', height: '18px', marginBottom: '0.65rem' }} />
              <div className="skeleton-shimmer" style={{ width: '92%', height: '18px', marginBottom: '0.65rem' }} />
              <div className="skeleton-shimmer" style={{ width: '75%', height: '18px' }} />
            </>
          )}

          {agentSteps.length > 0 && (
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Zap size={16} color="#22d3ee" />
                <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--accent-cyan)' }}>Live Agent Trace</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--fs-xs)' }}>
                {agentSteps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--fs-xs)', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={14} color="#35d07f" />
                    <strong>{step.title}:</strong>
                    <span style={{ color: 'var(--text-muted)' }}>{step.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {streamedAnswer && (
            <div>
              <FormattedMarkdown text={streamedAnswer} />
              <span className="animate-pulse" style={{ display: 'inline-block', width: '6px', height: '14px', backgroundColor: 'var(--accent-blue)', marginLeft: '4px', verticalAlign: 'middle' }}></span>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: 'var(--fs-base)', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Tooltip content="Factual Grounding verified via Natural Language Inference (NLI) against retrieved evidence fixtures.">
                    <span className="glass-pill glass-btn-success" style={{ fontSize: 'var(--fs-xs)', cursor: 'help' }}>
                      <CheckCircle2 size={13} /> {(response.confidence * 100).toFixed(0)}% Grounded
                    </span>
                  </Tooltip>

                  <Tooltip content="Input and output guardrail protection against prompt injections, jailbreaks, and PII leaks.">
                    <span className="glass-pill" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 240, 255, 0.3)', fontSize: 'var(--fs-xs)', cursor: 'help' }}>
                      <ShieldCheck size={13} /> Llama Guard 3 Safe
                    </span>
                  </Tooltip>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                  <span>Latency: <strong style={{ color: 'var(--accent-blue)' }}>{response.latency_ms}ms</strong></span>
                  <span>Tokens: <strong>{response.token_usage?.total_tokens}</strong></span>
                </div>
              </div>

              {/* Markdown Synthesized Body */}
              <FormattedMarkdown text={response.answer} />

              {/* Citations Footer Row */}
              <div
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', fontWeight: 600 }}>Verified Citations:</span>
                {response.supporting_evidence?.concat(response.conflicting_evidence || []).map((ev, i) => (
                  <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
                    key={ev.id}
                    className="citation-badge"
                    onClick={() => setSelectedEvidenceDetail(ev)}
                    title="Click to inspect source provenance in Evidence Rail"
                  >
                    [E{i + 1}] {ev.source_title}
                  </RippleButton>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--fs-xs)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span className="glass-pill" style={{ background: 'rgba(155, 124, 255, 0.2)', color: 'var(--accent-violet)', borderColor: 'rgba(155, 124, 255, 0.4)' }}>
                        Governed MCP Action Proposed
                      </span>
                      <span className="glass-pill" style={{ color: 'var(--accent-rose)', borderColor: 'rgba(255, 107, 122, 0.4)' }}>
                        {response.recommendation.risk_class.toUpperCase()}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {response.recommendation.summary}
                    </h4>
                  </div>
                </div>

                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {response.recommendation.rationale || response.recommendation.description}
                </p>

                {/* Diff Preview */}
                {response.recommendation.diff_preview && (
                  <div
                    style={{
                      background: 'rgba(5, 11, 20, 0.85)',
                      borderRadius:'var(--radius-sm)',
                      padding: '0.75rem 1rem',
                      fontFamily: 'monospace',
                      fontSize: 'var(--fs-xs)',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ color: 'var(--text-faint)', marginBottom: '0.25rem' }}>// Proposed Jira Mutation Diff</div>
                    <div style={{ color: 'var(--accent-rose)' }}>- target_date: &quot;{response.recommendation.diff_preview.from_value}&quot;</div>
                    <div style={{ color: 'var(--accent-emerald)' }}>+ target_date: &quot;{response.recommendation.diff_preview.to_value}&quot;</div>
                    <div style={{ color: 'var(--accent-blue)', marginTop: '0.25rem' }}>// Rationale: {response.recommendation.diff_preview.rationale}</div>
                  </div>
                )}

                {/* Approval Execution Buttons */}
                {actionSuccessMsg ? (
                  <div
                    style={{
                      background: 'rgba(53, 208, 127, 0.15)',
                      border: '1px solid rgba(53, 208, 127, 0.4)',
                      borderRadius:'var(--radius-sm)',
                      padding: '0.75rem 1rem',
                      color: 'var(--accent-emerald)',
                      fontSize: 'var(--fs-base)',
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
                  <div style={{ display: 'flex', gap: 'var(--fs-xs)', alignItems: 'center' }}>
                    <RippleButton rippleColor="rgba(99,102,241,0.15)" duration="600ms"
                      className="glass-btn glass-btn-primary"
                      disabled={isApproving}
                      onClick={() => handleApproveAction(response.recommendation!.id)}
                      style={{ padding: '0.6rem 1.25rem', fontSize: 'var(--fs-base)' }}
                    >
                      {isApproving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      <span>Approve &amp; Execute via MCP</span>
                    </RippleButton>
                    <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
                      className="glass-btn"
                      onClick={() => onSelectView('approval_center')}
                      style={{ fontSize: 'var(--fs-base)' }}
                    >
                      <span>Review in Approval Center</span>
                      <ArrowRight size={14} />
                    </RippleButton>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Live Evidence Rail with Supporting / Conflicting Tabs */}
          <div className="glass-panel" style={{ padding: '1.25rem', position: 'sticky', top: '90px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Live Evidence Rail
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                Prov. SLA: 2.8m Fresh
              </span>
            </div>

            {/* Evidence Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
                onClick={() => setActiveEvidenceTab('supporting')}
                style={{
                  background: activeEvidenceTab === 'supporting' ? 'rgba(92, 168, 255, 0.2)' : 'transparent',
                  border: 'none',
                  borderRadius:'var(--radius-sm)',
                  color: activeEvidenceTab === 'supporting' ? 'var(--accent-blue)' : 'var(--text-muted)',
                  padding: '0.35rem 0.65rem',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Supporting ({response.supporting_evidence?.length || 0})
              </RippleButton>

              <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
                onClick={() => setActiveEvidenceTab('conflicting')}
                style={{
                  background: activeEvidenceTab === 'conflicting' ? 'rgba(251, 146, 60, 0.2)' : 'transparent',
                  border: 'none',
                  borderRadius:'var(--radius-sm)',
                  color: activeEvidenceTab === 'conflicting' ? 'var(--accent-amber)' : 'var(--text-muted)',
                  padding: '0.35rem 0.65rem',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ⚠️ Conflicting ({response.conflicting_evidence?.length || 0})
              </RippleButton>

              <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
                onClick={() => setActiveEvidenceTab('superseded')}
                style={{
                  background: activeEvidenceTab === 'superseded' ? 'rgba(155, 124, 255, 0.2)' : 'transparent',
                  border: 'none',
                  borderRadius:'var(--radius-sm)',
                  color: activeEvidenceTab === 'superseded' ? 'var(--accent-violet)' : 'var(--text-muted)',
                  padding: '0.35rem 0.65rem',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Superseded ({response.superseded_evidence?.length || 0})
              </RippleButton>
            </div>

            {/* Evidence Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--fs-xs)', maxHeight: '420px', overflowY: 'auto' }}>
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
                    borderRadius:'var(--radius-sm)',
                    background: selectedEvidenceDetail?.id === ev.id ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)',
                    border: ev.is_conflicting
                      ? '1px solid rgba(251, 146, 60, 0.4)'
                      : selectedEvidenceDetail?.id === ev.id
                      ? '1px solid #6366f1'
                      : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ev.source_title}
                    </span>
                    <span className="glass-pill" style={{ fontSize: '0.62rem' }}>
                      {ev.source_type.toUpperCase()}
                    </span>
                  </div>

                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', lineHeight: 1.35, margin: '0.25rem 0' }}>
                    {ev.excerpt.slice(0, 110)}...
                  </p>

                  {ev.conflict_summary && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', marginTop: '0.25rem' }}>
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
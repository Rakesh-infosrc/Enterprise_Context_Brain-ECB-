// frontend/src/components/views/CommandCenterView.tsx

import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  ShieldAlert,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Activity,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Project, Risk, Decision, DashboardStats } from '../../types';
import { NavItem } from '../Sidebar';
import { WelcomeBanner } from '../WelcomeBanner';
import { Tooltip } from '../Tooltip';
import { RippleButton } from "@/components/ui/ripple-button";

interface CommandCenterViewProps {
  stats: DashboardStats | null;
  projects: Project[];
  risks: Risk[];
  decisions: Decision[];
  onSelectView: (view: NavItem) => void;
  onAskQuestion: (query: string) => void;
  onStartTour?: () => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  stats,
  projects,
  risks,
  decisions,
  onSelectView,
  onAskQuestion,
  onStartTour,
}) => {
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const activeProject = projects[0];

  const quickPrompts = [
    {
      title: 'Analyze Project Health',
      prompt: activeProject ? `What is the health status of ${activeProject.name}?` : 'What projects are currently active?',
      category: 'Project Intelligence',
      badge: 'Live Status',
      icon: TrendingUp,
      color: 'var(--accent-blue)',
    },
    {
      title: 'Inspect ADR Decisions',
      prompt: 'What architecture decisions have been recorded?',
      category: 'Decision Intelligence',
      badge: 'Architecture',
      icon: GitPullRequest,
      color: 'var(--accent-violet)',
    },
    {
      title: 'Audit Open Risks',
      prompt: 'What are the critical open risks across all projects?',
      category: 'Risk Intelligence',
      badge: 'Compliance',
      icon: ShieldAlert,
      color: 'var(--accent-amber)',
    },
    {
      title: 'Search Evidence Logs',
      prompt: 'Show all recent commits and Jira issue updates.',
      category: 'Evidence Explorer',
      badge: 'Live Sync',
      icon: Zap,
      color: 'var(--accent-emerald)',
    },
  ];

  return (
    <div className="view-transition-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Welcoming Hero Banner */}
      {!isBannerDismissed && (
        <WelcomeBanner
          onStartTour={onStartTour || (() => onSelectView('ask_ecb'))}
          onAskQuestion={onAskQuestion}
          onDismiss={() => setIsBannerDismissed(true)}
          projects={projects}
        />
      )}

      {/* 2. Primary KPI Health Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
        {/* Metric 1: Evidence Backed Rate */}
        <div className="glass-card glass-card-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>
              Evidence Grounding
            </span>
            <Tooltip content="Percentage of synthesized claims verified with citation badges [E1], [E2] against canonical evidence fixtures.">
              <span className="glass-pill glass-btn-success" style={{ fontSize: 'var(--fs-2xs)', cursor: 'help' }}>
                <CheckCircle2 size={12} /> Target &gt;95%
              </span>
            </Tooltip>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '-0.02em' }}>
            {stats?.evidence_backed_rate_pct ?? 0}%
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', marginTop: '0.25rem' }}>
            Zero ungrounded hallucinations
          </div>
        </div>

        {/* Metric 2: P95 Retrieval Latency */}
        <div className="glass-card glass-card-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>
              P95 Retrieval Latency
            </span>
            <Tooltip content="P95 query duration across Qdrant hybrid vector search and PostgreSQL RLS filters.">
              <span className="glass-pill" style={{ fontSize: 'var(--fs-2xs)', color: 'var(--accent-blue)', cursor: 'help' }}>
                <Zap size={12} /> HNSW Indexed
              </span>
            </Tooltip>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '-0.02em' }}>
            {stats?.p95_retrieval_latency_ms ?? 0}ms
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', marginTop: '0.25rem' }}>
            Sub-second decision retrieval SLA
          </div>
        </div>

        {/* Metric 3: Active Risks */}
        <div
          className="glass-card glass-card-hover"
          onClick={() => onSelectView('project_intelligence')}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>
              Active Risks
            </span>
            <Tooltip content="Active 5x5 Likelihood x Impact project risk exposures.">
              <span className="glass-pill" style={{ fontSize: 'var(--fs-2xs)', color: 'var(--accent-amber)', cursor: 'help' }}>
                <ShieldAlert size={12} /> {stats?.critical_risks_count ?? 0} Critical
              </span>
            </Tooltip>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-amber)', letterSpacing: '-0.02em' }}>
            {stats?.open_risks_count ?? 0}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', marginTop: '0.25rem' }}>
            PCI-DSS &amp; Kafka partition lags
          </div>
        </div>

        {/* Metric 4: Pending Approvals */}
        <div
          className="glass-card glass-card-hover"
          onClick={() => onSelectView('approval_center')}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>
              Governed Approvals
            </span>
            <Tooltip content="High-impact actions requiring two-person human-in-the-loop review before MCP tool execution.">
              <span className="glass-pill active" style={{ fontSize: 'var(--fs-2xs)', cursor: 'help' }}>
                Human Review
              </span>
            </Tooltip>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-violet)', letterSpacing: '-0.02em' }}>
            {stats?.pending_approvals_count ?? 0}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', marginTop: '0.25rem' }}>
            Awaiting MCP execution token
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Featured Project Execution Health vs Quick Prompts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr', gap: '1.5rem' }}>
        {/* Left: Active Project Execution Health */}
        {activeProject && (
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="glass-pill active" style={{ fontSize: 'var(--fs-xs)' }}>
                    {activeProject.code}
                  </span>
                  <span
                    className="glass-pill"
                    style={{
                      fontSize: 'var(--fs-xs)',
                      background: 'rgba(53, 208, 127, 0.15)',
                      color: 'var(--accent-emerald)',
                      borderColor: 'rgba(53, 208, 127, 0.3)',
                    }}
                  >
                    ● {activeProject.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {activeProject.name}
                </h3>
              </div>

              <RippleButton rippleColor="rgba(255,255,255,0.35)" duration="600ms"
                onClick={() => onAskQuestion(`What is the current status of ${activeProject.name}?`)}
                className="glass-btn glass-btn-primary"
                style={{ fontSize: 'var(--fs-sm)', padding: '0.45rem 0.9rem' }}
              >
                <Sparkles size={13} />
                <span>Ask ECB</span>
              </RippleButton>
            </div>

            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {activeProject.description}
            </p>

            {/* Milestones Progress Gating */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--fs-base)' }}>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Milestone Execution Progress
              </div>

              {!activeProject.milestones?.length ? (
                <div role="status" aria-live="polite" style={{ padding:'1.25rem', textAlign:'center', border:'1px dashed var(--border-subtle)', borderRadius:'var(--radius-md)', background:'var(--bg-card)' }}>
                  <p style={{ fontSize:'var(--fs-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.25rem' }}>No milestones defined</p>
                  <p style={{ fontSize:'var(--fs-xs)', color:'var(--text-muted)' }}>Add milestones in Project Settings to track execution progress.</p>
                </div>
              ) : activeProject.milestones.map((m) => {
                const isDelayed = m.status === 'delayed' || m.status === 'blocked';
                const progress = m.progress_percentage ?? m.progress_pct ?? 50;
                return (
                  <div
                    key={m.id}
                    className="glass-card"
                    style={{
                      padding: '0.85rem 1rem',
                      borderLeft: isDelayed ? '3.5px solid #f59e0b' : '3.5px solid #6366f1',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {m.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: isDelayed ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                        }}
                      >
                        {m.status.toUpperCase()}{m.target_date ? ` • Due ${new Date(m.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ' • No due date'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        height: '6px',
                        background: 'var(--border-subtle)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: isDelayed
                            ? 'linear-gradient(90deg, #fb923c, #f97316)'
                            : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Right: Quick Launch Prompts */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Sparkles size={18} color="#8b5cf6" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Instant Context Queries
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--fs-base)' }}>
            {quickPrompts.map((qp, i) => {
              const Icon = qp.icon;
              return (
                <div
                  key={i}
                  onClick={() => onAskQuestion(qp.prompt)}
                  className="glass-card-hover"
                  style={{
                    padding: '0.9rem 1.1rem',
                    borderRadius:'var(--radius-md)',
                    background: `${qp.color}0A`,
                    border: `1px solid ${qp.color}22`,
                    borderLeft: `3px solid ${qp.color}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Icon size={14} color={qp.color} />
                      <span style={{ fontSize: 'var(--fs-xs)', color: qp.color, fontWeight: 700, textTransform: 'uppercase' }}>
                        {qp.category}
                      </span>
                    </div>
                    <span className="glass-pill" style={{ fontSize: '0.65rem' }}>
                      {qp.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    &quot;{qp.prompt}&quot;
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
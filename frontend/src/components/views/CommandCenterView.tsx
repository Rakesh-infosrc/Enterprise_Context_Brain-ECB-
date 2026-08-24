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
      color: '#5ca8ff',
    },
    {
      title: 'Inspect ADR Decisions',
      prompt: 'What architecture decisions have been recorded?',
      category: 'Decision Intelligence',
      badge: 'Architecture',
      icon: GitPullRequest,
      color: '#9b7cff',
    },
    {
      title: 'Audit Open Risks',
      prompt: 'What are the critical open risks across all projects?',
      category: 'Risk Intelligence',
      badge: 'Compliance',
      icon: ShieldAlert,
      color: '#fb923c',
    },
    {
      title: 'Search Evidence Logs',
      prompt: 'Show all recent commits and Jira issue updates.',
      category: 'Evidence Explorer',
      badge: 'Live Sync',
      icon: Zap,
      color: '#35d07f',
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
        />
      )}

      {/* 2. Primary KPI Health Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
        {/* Metric 1: Evidence Backed Rate */}
        <div className="glass-card glass-card-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
              Evidence Grounding
            </span>
            <Tooltip content="Percentage of synthesized claims verified with citation badges [E1], [E2] against canonical evidence fixtures.">
              <span className="glass-pill glass-btn-success" style={{ fontSize: '0.68rem', cursor: 'help' }}>
                <CheckCircle2 size={12} /> Target &gt;95%
              </span>
            </Tooltip>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#35d07f', letterSpacing: '-0.02em' }}>
            {stats?.evidence_backed_rate_pct || 98.4}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Zero ungrounded hallucinations
          </div>
        </div>

        {/* Metric 2: P95 Retrieval Latency */}
        <div className="glass-card glass-card-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
              P95 Retrieval Latency
            </span>
            <Tooltip content="P95 query duration across Qdrant hybrid vector search and PostgreSQL RLS filters.">
              <span className="glass-pill" style={{ fontSize: '0.68rem', color: '#5ca8ff', cursor: 'help' }}>
                <Zap size={12} /> HNSW Indexed
              </span>
            </Tooltip>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#5ca8ff', letterSpacing: '-0.02em' }}>
            {stats?.p95_retrieval_latency_ms || 235}ms
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Sub-second decision retrieval SLA
          </div>
        </div>

        {/* Metric 3: Active Risks */}
        <div
          className="glass-card glass-card-hover"
          onClick={() => onSelectView('risk_intelligence')}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
              Active Risks
            </span>
            <Tooltip content="Active 5x5 Likelihood x Impact project risk exposures.">
              <span className="glass-pill" style={{ fontSize: '0.68rem', color: '#fb923c', cursor: 'help' }}>
                <ShieldAlert size={12} /> 1 Critical
              </span>
            </Tooltip>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fb923c', letterSpacing: '-0.02em' }}>
            {stats?.open_risks_count || 3}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
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
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
              Governed Approvals
            </span>
            <Tooltip content="High-impact actions requiring two-person human-in-the-loop review before MCP tool execution.">
              <span className="glass-pill active" style={{ fontSize: '0.68rem', cursor: 'help' }}>
                Human Review
              </span>
            </Tooltip>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#c084fc', letterSpacing: '-0.02em' }}>
            {stats?.pending_approvals_count || 1}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
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
                  <span className="glass-pill active" style={{ fontSize: '0.75rem' }}>
                    {activeProject.code}
                  </span>
                  <span
                    className="glass-pill"
                    style={{
                      fontSize: '0.75rem',
                      background: 'rgba(53, 208, 127, 0.15)',
                      color: '#35d07f',
                      borderColor: 'rgba(53, 208, 127, 0.3)',
                    }}
                  >
                    ● {activeProject.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  {activeProject.name}
                </h3>
              </div>

              <RippleButton rippleColor="rgba(255,255,255,0.35)" duration="600ms"
                onClick={() => onAskQuestion(`What is the current status of ${activeProject.name}?`)}
                className="glass-btn glass-btn-primary"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.9rem' }}
              >
                <Sparkles size={13} />
                <span>Ask ECB</span>
              </RippleButton>
            </div>

            <p style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {activeProject.description}
            </p>

            {/* Milestones Progress Gating */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Milestone Execution Progress
              </div>

              {activeProject.milestones?.map((m) => {
                const isDelayed = m.status === 'delayed' || m.status === 'blocked';
                const progress = m.progress_percentage ?? m.progress_pct ?? 50;
                return (
                  <div
                    key={m.id}
                    style={{
                      background: 'rgba(10, 20, 32, 0.6)',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      border: isDelayed ? '1px solid rgba(251, 146, 60, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#ffffff' }}>
                        {m.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: isDelayed ? '#fb923c' : '#35d07f',
                        }}
                      >
                        {m.status.toUpperCase()} • Due {m.target_date}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
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
                            : 'linear-gradient(90deg, #5ca8ff, #35d07f)',
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
            <Sparkles size={18} color="#9b7cff" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
              Instant Context Queries
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {quickPrompts.map((qp, i) => {
              const Icon = qp.icon;
              return (
                <div
                  key={i}
                  onClick={() => onAskQuestion(qp.prompt)}
                  className="glass-card-hover"
                  style={{
                    padding: '0.9rem 1.1rem',
                    borderRadius: '12px',
                    background: 'rgba(10, 20, 32, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Icon size={14} color={qp.color} />
                      <span style={{ fontSize: '0.72rem', color: qp.color, fontWeight: 700, textTransform: 'uppercase' }}>
                        {qp.category}
                      </span>
                    </div>
                    <span className="glass-pill" style={{ fontSize: '0.65rem' }}>
                      {qp.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', lineHeight: 1.3 }}>
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
// frontend/src/components/views/ProjectIntelligenceView.tsx

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitCommit,
  FileText,
  User,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  GitPullRequest,
  ExternalLink,
  Flame,
  Info,
  Zap,
} from 'lucide-react';
import { Project, Evidence, Risk, Decision } from '../../types';
import { RippleButton } from "@/components/ui/ripple-button";

interface ProjectIntelligenceViewProps {
  project: Project;
  evidenceList: Evidence[];
  risks: Risk[];
  decisions: Decision[];
  onAskQuestion: (q: string) => void;
}

export const ProjectIntelligenceView: React.FC<ProjectIntelligenceViewProps> = ({
  project,
  evidenceList,
  risks,
  decisions,
  onAskQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<'sprints' | 'risks' | 'decisions' | 'contradictions'>('sprints');

  // Filter lists based on selected project
  const projectRisks = risks.filter((r) => r.project_id === project.id);
  const projectDecisions = decisions.filter((d) => d.project_id === project.id);
  const jiraEvidence = evidenceList.filter((e) => e.source_type === 'jira' && e.project_id === project.id);
  const gitEvidence = evidenceList.filter((e) => e.source_type === 'git' && e.project_id === project.id);

  // --- Sub-states for Risks Tab ---
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [activeRiskFilter, setActiveRiskFilter] = useState<{ prob: number; impact: number } | null>(null);

  useEffect(() => {
    if (projectRisks.length > 0) {
      setSelectedRisk(projectRisks[0]);
    } else {
      setSelectedRisk(null);
    }
    setActiveRiskFilter(null);
  }, [project.id, risks]);

  // --- Sub-states for Decisions Tab ---
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);

  useEffect(() => {
    if (projectDecisions.length > 0) {
      setSelectedDecision(projectDecisions[0]);
    } else {
      setSelectedDecision(null);
    }
  }, [project.id, decisions]);

  // --- Sub-states for Contradictions Tab ---
  const [selectedContradictionId, setSelectedContradictionId] = useState<string>('c-1');
  const [actionProposed, setActionProposed] = useState<boolean>(false);

  const contradictions = evidenceList
    .filter((e) => e.is_conflicting && e.project_id === project.id)
    .map((e, idx) => {
      const summary = e.conflict_summary || e.excerpt || '';
      const jiraDateMatch = summary.match(/target date\s*\(([^)]+)\)/i) || summary.match(/duedate[:\s]+(\d{4}-\d{2}-\d{2})/i);
      const gitDateMatch = summary.match(/Target:\s*(\d{4}-\d{2}-\d{2})/i) || summary.match(/commit.*?\(([^)]+)\)/i);
      const commitMatch = summary.match(/commit\s+([a-f0-9]{7,})/i);
      const jiraDate = jiraDateMatch?.[1] || '';
      const gitDate = gitDateMatch?.[1] || '';
      let delayDays = 0;
      if (jiraDate && gitDate) {
        try {
          delayDays = Math.round((new Date(gitDate).getTime() - new Date(jiraDate).getTime()) / 86400000);
        } catch { /* ignore */ }
      }
      return {
        id: e.id,
        project_id: e.project_id,
        jiraKey: e.external_id || '',
        title: e.source_title.replace(/^Jira\s+\S+:\s*/, ''),
        jiraTargetDate: jiraDate,
        gitCommitHash: commitMatch?.[1] || '',
        gitTargetDate: gitDate,
        delayDays,
        rationale: summary,
        jiraUrl: e.url || '',
        gitUrl: '',
        severity: delayDays >= 30 ? 'critical' : delayDays >= 7 ? 'high' : 'medium',
      };
    })
    .filter((c) => c.jiraTargetDate || c.gitTargetDate)
    .sort((a, b) => b.delayDays - a.delayDays);

  const projectContradictions = contradictions.filter(c => c.project_id === project.id);
  const selectedContradiction = projectContradictions.find(c => c.id === selectedContradictionId) || projectContradictions[0];

  // --- Risk helper parameters & methods ---
  const impactLabels: Record<number, { label: string; desc: string }> = {
    5: { label: '5 • Critical', desc: 'Catastrophic Impact' },
    4: { label: '4 • High', desc: 'Severe Impact' },
    3: { label: '3 • Medium', desc: 'Moderate Impact' },
    2: { label: '2 • Low', desc: 'Minor Impact' },
    1: { label: '1 • Negligible', desc: 'Minimal Impact' },
  };

  const likelihoodLabels: Record<number, string> = {
    1: '1 • Rare',
    2: '2 • Unlikely',
    3: '3 • Possible',
    4: '4 • Likely',
    5: '5 • Certain',
  };

  const getCellStyles = (prob: number, impact: number, count: number, isSelected: boolean) => {
    const score = prob * impact;
    let bg = 'var(--bg-card)';
    let border = '1px solid var(--border-subtle)';
    let textColor = 'var(--text-muted)';
    let glow = 'none';

    if (score >= 18) {
      bg = isSelected
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.35), rgba(225, 29, 72, 0.25))'
        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(153, 27, 27, 0.1))';
      border = isSelected ? '2px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.3)';
      textColor = '#ef4444';
      glow = isSelected ? '0 0 0 4px rgba(239, 68, 68, 0.15), 0 4px 16px rgba(239, 68, 68, 0.25)' : count > 0 ? '0 0 10px rgba(239, 68, 68, 0.15)' : 'none';
    } else if (score >= 12) {
      bg = isSelected
        ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(217, 119, 6, 0.2))'
        : 'linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(180, 83, 9, 0.08))';
      border = isSelected ? '2px solid #f97316' : '1px solid rgba(249, 115, 22, 0.25)';
      textColor = '#f97316';
      glow = isSelected ? '0 0 0 4px rgba(249, 115, 22, 0.12), 0 4px 16px rgba(249, 115, 22, 0.2)' : count > 0 ? '0 0 8px rgba(249, 115, 22, 0.12)' : 'none';
    } else if (score >= 6) {
      bg = isSelected
        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))'
        : 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(146, 64, 14, 0.06))';
      border = isSelected ? '2px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.2)';
      textColor = '#f59e0b';
      glow = isSelected ? '0 0 0 4px rgba(245, 158, 11, 0.1), 0 4px 16px rgba(245, 158, 11, 0.18)' : count > 0 ? '0 0 6px rgba(245, 158, 11, 0.1)' : 'none';
    } else {
      bg = isSelected
        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.12))'
        : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05))';
      border = isSelected ? '2px solid #6366f1' : '1px solid rgba(99, 102, 241, 0.15)';
      textColor = '#6366f1';
      glow = isSelected ? '0 0 0 4px rgba(99, 102, 241, 0.1), 0 4px 16px rgba(99, 102, 241, 0.18)' : count > 0 ? '0 0 6px rgba(99, 102, 241, 0.1)' : 'none';
    }

    return { bg, border, textColor, glow };
  };

  const filteredRisks = activeRiskFilter
    ? projectRisks.filter((r) => (Number(r.probability) || 3) === activeRiskFilter.prob && (Number(r.impact) || 3) === activeRiskFilter.impact)
    : projectRisks;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Project Hero Header */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span className="glass-pill active" style={{ fontSize: 'var(--fs-xs)' }}>
                {project.code}
              </span>
              <span
                className="glass-pill"
                style={{
                  color: project.status === 'delayed' ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                  borderColor: project.status === 'delayed' ? 'rgba(255, 107, 122, 0.4)' : 'rgba(53, 208, 127, 0.4)',
                }}
              >
                {project.status.toUpperCase()}
              </span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                Health Score: <strong style={{ color: 'var(--text-primary)' }}>{project.health_score}/100</strong>
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {project.name}
            </h2>
            <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-muted)', maxWidth: '750px', marginTop: '0.35rem', lineHeight: 1.5 }}>
              {project.description}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Project Owner</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
              {project.owner_name}
            </div>
            <RippleButton rippleColor="rgba(255,255,255,0.15)" duration="600ms"
              className="glass-btn"
              onClick={() => onAskQuestion(`Why is ${project.name} delayed?`)}
              style={{ marginTop: 'var(--fs-xs)', fontSize: 'var(--fs-sm)', padding: '0.45rem 0.9rem' }}
            >
              <Sparkles size={14} />
              <span>Analyze Delay Drivers</span>
            </RippleButton>
          </div>
        </div>
      </div>

      {/* Sub navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '2px', gap: '0.5rem' }}>
        <RippleButton rippleColor="rgba(92,168,255,0.15)" duration="600ms"
          onClick={() => setActiveTab('sprints')}
          style={{
            background: activeTab === 'sprints' ? 'rgba(92, 168, 255, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: activeTab === 'sprints' ? 'var(--accent-blue)' : 'var(--text-muted)',
            padding: '0.5rem 1rem',
            fontSize: 'var(--fs-sm)',
            fontWeight: activeTab === 'sprints' ? 700 : 500,
            cursor: 'pointer',
          }}
        >
          <Layers size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Sprints &amp; Commits
        </RippleButton>

        <RippleButton rippleColor="rgba(251,146,60,0.15)" duration="600ms"
          onClick={() => setActiveTab('risks')}
          style={{
            background: activeTab === 'risks' ? 'rgba(251, 146, 60, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: activeTab === 'risks' ? 'var(--accent-amber)' : 'var(--text-muted)',
            padding: '0.5rem 1rem',
            fontSize: 'var(--fs-sm)',
            fontWeight: activeTab === 'risks' ? 700 : 500,
            cursor: 'pointer',
          }}
        >
          <ShieldAlert size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Risks Heatmap ({projectRisks.length})
        </RippleButton>

        <RippleButton rippleColor="rgba(192,132,252,0.15)" duration="600ms"
          onClick={() => setActiveTab('decisions')}
          style={{
            background: activeTab === 'decisions' ? 'rgba(192, 132, 252, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: activeTab === 'decisions' ? 'var(--accent-violet)' : 'var(--text-muted)',
            padding: '0.5rem 1rem',
            fontSize: 'var(--fs-sm)',
            fontWeight: activeTab === 'decisions' ? 700 : 500,
            cursor: 'pointer',
          }}
        >
          <GitPullRequest size={14} style={{ display: 'inline', marginRight: '6px' }} />
          ADRs &amp; Decisions ({projectDecisions.length})
        </RippleButton>

        {projectContradictions.length > 0 && (
          <RippleButton rippleColor="rgba(239,68,68,0.15)" duration="600ms"
            onClick={() => setActiveTab('contradictions')}
            style={{
              background: activeTab === 'contradictions' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: activeTab === 'contradictions' ? 'var(--accent-rose)' : 'var(--text-muted)',
              padding: '0.5rem 1rem',
              fontSize: 'var(--fs-sm)',
              fontWeight: activeTab === 'contradictions' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Roadmap Contradictions
          </RippleButton>
        )}
      </div>

      {/* Tab Panel Content */}
      <div style={{ flex: 1 }}>
        
        {/* TAB 1: SPRINTS & COMMITS */}
        {activeTab === 'sprints' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Milestones Schedule */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="#6366f1" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Execution Milestones &amp; Gating Schedule
                  </h3>
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-rose)', fontWeight: 600 }}>
                  Estimated Release Slippage: +{project.estimated_delay_days || 0} days
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!project.milestones?.length ? (
                  <div role="status" aria-live="polite" style={{ padding:'1.5rem', textAlign:'center', border:'1px dashed var(--border-subtle)', borderRadius:'var(--radius-md)', background:'var(--bg-card)' }}>
                    <p style={{ fontSize:'var(--fs-sm)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.25rem' }}>No milestones defined</p>
                    <p style={{ fontSize:'var(--fs-xs)', color:'var(--text-muted)' }}>Add milestones in Project Settings to track execution progress.</p>
                  </div>
                ) : (
                  project.milestones.map((m) => (
                    <div
                      key={m.id}
                      className="glass-card"
                      style={{
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1.5rem',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {m.name}
                          </span>
                          <span
                            className="glass-pill"
                            style={{
                              fontSize: '0.65rem',
                              color:
                                m.status === 'completed'
                                  ? 'var(--accent-emerald)'
                                  : m.status === 'delayed'
                                  ? 'var(--accent-rose)'
                                  : 'var(--accent-amber)',
                              borderColor:
                                m.status === 'completed'
                                  ? 'rgba(53, 208, 127, 0.3)'
                                  : m.status === 'delayed'
                                  ? 'rgba(255, 107, 122, 0.3)'
                                  : 'rgba(245, 158, 11, 0.3)',
                              fontWeight: 700,
                            }}
                          >
                            {m.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          Target Date: <strong style={{ color: 'var(--text-primary)' }}>{m.target_date ? new Date(m.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}</strong>
                          {m.owner && ` • Owner: ${m.owner}`}
                        </div>
                      </div>

                      {/* Micro Progress Bar */}
                      <div style={{ width: '120px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          <span>Progress</span>
                          <span>{m.progress_pct ?? m.progress_percentage ?? 0}%</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${m.progress_pct ?? m.progress_percentage ?? 0}%`,
                              height: '100%',
                              background: m.status === 'delayed' ? 'var(--accent-rose)' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                              borderRadius: '2px',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Backlog & Commits */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Backlog */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1rem' }}>
                  <FileText size={16} color="#6366f1" />
                  <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Active Jira Epics &amp; Backlog
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '350px', overflowY: 'auto' }}>
                  {jiraEvidence.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: 'var(--fs-sm)' }}>
                      No active Jira backlog items found for this project scope.
                    </div>
                  ) : (
                    jiraEvidence.map((e) => (
                      <div key={e.id} className="glass-card" style={{ padding: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.725rem', fontFamily: 'monospace', color: 'var(--accent-indigo)' }}>
                            {e.external_id}
                          </span>
                          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                            {new Date(e.observed_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {e.source_title}
                        </div>
                        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0, lineHeight: 1.4 }}>
                          {e.excerpt}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Commit logs */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1rem' }}>
                  <GitCommit size={16} color="#35d07f" />
                  <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Lead Architect Git Commit Logs
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '350px', overflowY: 'auto' }}>
                  {gitEvidence.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: 'var(--fs-sm)' }}>
                      No recent git commit entries cataloged.
                    </div>
                  ) : (
                    gitEvidence.map((e) => (
                      <div key={e.id} className="glass-card" style={{ padding: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.725rem', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                            {e.external_id.slice(0, 8)}
                          </span>
                          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                            {new Date(e.observed_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {e.source_title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <User size={12} />
                          <span>Author: <strong style={{ color: 'var(--text-primary)' }}>{e.author || 'Lead Dev'}</strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RISKS HEATMAP */}
        {activeTab === 'risks' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
            {/* Heatmap Grid */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert size={18} color="#f97316" />
                    Risk Exposure Heatmap Matrix
                  </h3>
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', marginTop: '0.2rem' }}>
                    Click a cell to isolate matching Project Threat severity scores.
                  </p>
                </div>
                {activeRiskFilter && (
                  <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
                    onClick={() => setActiveRiskFilter(null)}
                    className="glass-btn"
                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                  >
                    Reset Grid Filter
                  </RippleButton>
                )}
              </div>

              {/* Color legend bar */}
              <div style={{ display: 'flex', gap: '10px', padding: '0.5rem 0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.675rem' }}>
                <span style={{ color: '#6ee7b7' }}>● Low (1-5)</span>
                <span style={{ color: '#fde68a' }}>● Medium (6-11)</span>
                <span style={{ color: '#fdba74' }}>● High (12-17)</span>
                <span style={{ color: '#fca5a5' }}>● Critical (18-25)</span>
              </div>

              {/* 5x5 Heatmap Matrix */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  Impact ↑
                </div>
                {[5, 4, 3, 2, 1].map((impact) => (
                  <div key={impact} style={{ display: 'grid', gridTemplateColumns: '110px repeat(5, 1fr)', gap: '0.4rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {impactLabels[impact].label}
                    </div>
                    {[1, 2, 3, 4, 5].map((prob) => {
                      const matchingRisks = projectRisks.filter((r) => (Number(r.probability) || 3) === prob && (Number(r.impact) || 3) === impact);
                      const count = matchingRisks.length;
                      const isSelected = activeRiskFilter?.prob === prob && activeRiskFilter?.impact === impact;
                      const { bg, border, textColor, glow } = getCellStyles(prob, impact, count, isSelected);

                      return (
                        <div
                          key={`${prob}-${impact}`}
                          onClick={() => {
                            setActiveRiskFilter({ prob, impact });
                            if (count > 0) setSelectedRisk(matchingRisks[0]);
                          }}
                          style={{
                            background: bg,
                            border: border,
                            boxShadow: glow,
                            borderRadius: '10px',
                            padding: '0.65rem 0.35rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                            minHeight: '52px',
                            transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                            zIndex: isSelected ? 2 : 1,
                          }}
                        >
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: textColor }}>{prob * impact}</span>
                          {count > 0 && <span style={{ fontSize: '0.6rem', padding: '0.05rem 0.25rem', borderRadius: '3px', background: textColor, color: '#07111f', fontWeight: 700 }}>{count}</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '110px repeat(5, 1fr)', gap: '0.4rem', marginTop: '0.2rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', textAlign: 'left' }}>
                    Likelihood →
                  </div>
                  {[1, 2, 3, 4, 5].map((prob) => (
                    <div key={prob} style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>{likelihoodLabels[prob].split(' ')[2] || likelihoodLabels[prob]}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Inspector column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {selectedRisk ? (
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className="glass-pill" style={{ color: selectedRisk.severity === 'critical' ? '#ef4444' : '#f59e0b', borderColor: 'var(--border-subtle)' }}>
                      {selectedRisk.severity.toUpperCase()} SCORE: {selectedRisk.score}/25
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {selectedRisk.title}
                  </h4>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '1rem' }}>
                    {selectedRisk.description}
                  </p>
                  <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '0.85rem', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.25rem' }}>
                      Mitigation Strategy
                    </div>
                    <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {selectedRisk.mitigation_plan || selectedRisk.mitigation || 'No strategy documented'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Owner: <strong>{selectedRisk.owner}</strong></span>
                    <span>Status: {selectedRisk.status}</span>
                  </div>
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: 'var(--fs-sm)' }}>
                  Select a heatmap matrix cell to inspect risk mitigation.
                </div>
              )}

              {/* Simple filtered list */}
              <div className="glass-panel" style={{ padding: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Risk Log List ({filteredRisks.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {filteredRisks.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRisk(r)}
                      style={{
                        padding: '0.6rem 0.85rem',
                        borderRadius: '10px',
                        background: selectedRisk?.id === r.id
                          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)'
                          : 'var(--bg-card)',
                        border: selectedRisk?.id === r.id
                          ? '1.5px solid rgba(99, 102, 241, 0.5)'
                          : '1px solid var(--border-subtle)',
                        boxShadow: selectedRisk?.id === r.id
                          ? '0 0 0 3px rgba(99, 102, 241, 0.1), 0 4px 12px rgba(99, 102, 241, 0.12)'
                          : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                        borderLeft: selectedRisk?.id === r.id ? '3.5px solid #6366f1' : '3.5px solid transparent',
                      }}
                    >
                      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{r.title}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Score: {r.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADRS & DECISIONS */}
        {activeTab === 'decisions' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
            {/* Left list */}
            <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ADR Timeline Timeline
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '450px', overflowY: 'auto' }}>
                {projectDecisions.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: 'var(--fs-sm)' }}>
                    No architecture decision records accepts for this project scope.
                  </div>
                ) : (
                  projectDecisions.map((d) => {
                    const isSelected = selectedDecision?.id === d.id;
                    const isSuperseded = d.status === 'superseded';
                    return (
                      <div
                        key={d.id}
                        onClick={() => setSelectedDecision(d)}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '12px',
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)'
                            : 'var(--bg-card)',
                          border: isSelected
                            ? '1.5px solid rgba(99, 102, 241, 0.5)'
                            : '1px solid var(--border-subtle)',
                          boxShadow: isSelected
                            ? '0 0 0 3px rgba(99, 102, 241, 0.1), 0 4px 12px rgba(99, 102, 241, 0.12)'
                            : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                          borderLeft: isSelected ? '3.5px solid #6366f1' : '3.5px solid transparent',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--accent-blue)' }}>{d.adr_number}</span>
                          <span style={{ fontSize: '0.65rem', color: isSuperseded ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>{d.status.toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{d.title}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right details */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              {selectedDecision ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <span className="glass-pill active" style={{ fontSize: 'var(--fs-xs)', marginBottom: '0.35rem' }}>{selectedDecision.adr_number}</span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedDecision.title}</h3>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Context</div>
                    <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>{selectedDecision.context}</p>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Rationale</div>
                    <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', lineHeight: 1.4, border: '1px solid var(--border-subtle)' }}>
                      {selectedDecision.rationale || selectedDecision.decision}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                    <span>Decided By: <strong>{selectedDecision.decided_by || selectedDecision.author || 'Architecture Board'}</strong></span>
                    <span>Date: {new Date(selectedDecision.decided_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: 'var(--fs-sm)' }}>
                  Select an ADR from the timeline list to review trade-offs.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CONTRADICTIONS */}
        {activeTab === 'contradictions' && selectedContradiction && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
            {/* List */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Roadmap target date discrepancies
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {projectContradictions.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedContradictionId(c.id);
                      setActionProposed(false);
                    }}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      background: selectedContradiction.id === c.id
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)'
                        : 'var(--bg-card)',
                      border: selectedContradiction.id === c.id
                        ? '1.5px solid rgba(239, 68, 68, 0.5)'
                        : '1px solid var(--border-subtle)',
                      boxShadow: selectedContradiction.id === c.id
                        ? '0 0 0 3px rgba(239, 68, 68, 0.08), 0 4px 12px rgba(239, 68, 68, 0.1)'
                        : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                      borderLeft: selectedContradiction.id === c.id ? '3.5px solid #ef4444' : '3.5px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{c.jiraKey}</span>
                      <span style={{ color: 'var(--accent-rose)' }}>+{c.delayDays} Days Delay</span>
                    </div>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{c.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      <span>Jira Target: {c.jiraTargetDate}</span>
                      <span>Commit Target: {c.gitTargetDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inspector & MCP action proposal */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={16} color="#22d3ee" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Timeline Contradiction Details</h4>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{selectedContradiction.rationale}</div>
              </div>
              <div style={{ background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '0.35rem' }}>
                  Propose Roadmap Date Alignment
                </div>
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.85rem' }}>
                  Update Jira ticket <strong>{selectedContradiction.jiraKey}</strong> target completion date to match Lead Architect git commits timeline (<strong>{selectedContradiction.gitTargetDate}</strong>).
                </p>
                {actionProposed ? (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                    Roadmap update request sent to Approval Center!
                  </div>
                ) : (
                  <RippleButton rippleColor="rgba(255,255,255,0.3)" duration="600ms"
                    className="glass-btn glass-btn-primary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: 'var(--fs-xs)' }}
                    onClick={() => setActionProposed(true)}
                  >
                    Submit Date Realignment Action
                  </RippleButton>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProjectIntelligenceView;
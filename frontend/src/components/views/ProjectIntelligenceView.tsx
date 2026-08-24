// frontend/src/components/views/ProjectIntelligenceView.tsx

import React from 'react';
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
} from 'lucide-react';
import { Project, Evidence } from '../../types';
import { RippleButton } from "@/components/ui/ripple-button";

interface ProjectIntelligenceViewProps {
  project: Project;
  evidenceList: Evidence[];
  onAskQuestion: (q: string) => void;
}

export const ProjectIntelligenceView: React.FC<ProjectIntelligenceViewProps> = ({
  project,
  evidenceList,
  onAskQuestion,
}) => {
  const jiraEvidence = evidenceList.filter((e) => e.source_type === 'jira');
  const gitEvidence = evidenceList.filter((e) => e.source_type === 'git');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Project Hero Header */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span className="glass-pill active" style={{ fontSize: '0.75rem' }}>
                {project.code}
              </span>
              <span
                className="glass-pill"
                style={{
                  color: project.status === 'delayed' ? '#ff6b7a' : '#35d07f',
                  borderColor: project.status === 'delayed' ? 'rgba(255, 107, 122, 0.4)' : 'rgba(53, 208, 127, 0.4)',
                }}
              >
                {project.status.toUpperCase()}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Health Score: <strong style={{ color: '#ffffff' }}>{project.health_score}/100</strong>
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
              {project.name}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '750px', marginTop: '0.35rem', lineHeight: 1.5 }}>
              {project.description}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Project Owner</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginTop: '0.1rem' }}>
              {project.owner_name}
            </div>
            <RippleButton rippleColor="rgba(192,132,252,0.35)" duration="600ms"
              className="glass-btn glass-btn-ai"
              onClick={() => onAskQuestion(`Why is ${project.name} delayed?`)}
              style={{ marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
            >
              <Sparkles size={14} />
              <span>Analyze Delay Drivers</span>
            </RippleButton>
          </div>
        </div>
      </div>

      {/* Milestones & Gantt Timeline */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="#5ca8ff" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              Execution Milestones &amp; Gating Schedule
            </h3>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#ff6b7a', fontWeight: 600 }}>
            Estimated Release Slippage: +{project.estimated_delay_days} days
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {project.milestones.map((m, index) => (
            <div
              key={m.id}
              style={{
                background: 'rgba(17, 34, 54, 0.55)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'rgba(92, 168, 255, 0.15)',
                    color: '#5ca8ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                      {m.name}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Target Date: {new Date(m.target_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    className="glass-pill"
                    style={{
                      fontSize: '0.7rem',
                      color: m.status === 'completed' ? '#35d07f' : m.status === 'delayed' ? '#ff6b7a' : '#f7b955',
                      borderColor: m.status === 'completed' ? 'rgba(53, 208, 127, 0.4)' : m.status === 'delayed' ? 'rgba(255, 107, 122, 0.4)' : 'rgba(247, 185, 85, 0.4)',
                    }}
                  >
                    {m.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', minWidth: '40px', textAlign: 'right' }}>
                    {m.progress_percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${m.progress_percentage}%`,
                    background:
                      m.status === 'completed'
                        ? 'linear-gradient(90deg, #35d07f, #10b981)'
                        : m.status === 'delayed'
                        ? 'linear-gradient(90deg, #ff6b7a, #ef4444)'
                        : 'linear-gradient(90deg, #5ca8ff, #3b82f6)',
                    borderRadius: '3px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              {m.blocker_description && (
                <div style={{
                  marginTop: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.78rem',
                  color: '#f87171',
                  background: 'rgba(255, 107, 122, 0.12)',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 107, 122, 0.25)',
                }}>
                  <AlertTriangle size={14} />
                  <span><strong>Root Cause Blocker:</strong> {m.blocker_description}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Two Column: Live Jira Stream vs Git Commit Stream */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Jira Tickets Stream */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <FileText size={16} color="#5ca8ff" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
              Jira Sprint Stream ({jiraEvidence.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {jiraEvidence.map((j) => (
              <div
                key={j.id}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(17, 34, 54, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5ca8ff' }}>
                    {j.external_id}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    {j.author}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                  {j.excerpt}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Git Activity Stream */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <GitCommit size={16} color="#35d07f" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
              Git Commits &amp; PRs ({gitEvidence.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {gitEvidence.map((g) => (
              <div
                key={g.id}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(17, 34, 54, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#35d07f', fontFamily: 'monospace' }}>
                    {g.external_id}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    {new Date(g.observed_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                  {g.excerpt}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
// frontend/src/components/views/ContradictionsView.tsx

import React, { useState } from 'react';
import {
  AlertTriangle,
  GitCommit,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  GitPullRequest,
  ExternalLink,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { Evidence } from '../../types';
import { RippleButton } from "@/components/ui/ripple-button";

interface ContradictionItem {
  id: string;
  jiraKey: string;
  title: string;
  jiraTargetDate: string;
  gitCommitHash: string;
  gitTargetDate: string;
  delayDays: number;
  rationale: string;
  jiraUrl: string;
  gitUrl: string;
  severity: 'critical' | 'high' | 'medium';
}

interface ContradictionsViewProps {
  evidenceList: Evidence[];
  onAskQuestion: (q: string) => void;
}

export const ContradictionsView: React.FC<ContradictionsViewProps> = ({
  evidenceList,
  onAskQuestion,
}) => {
  const [selectedContradictionId, setSelectedContradictionId] = useState<string>('c-1');
  const [actionProposed, setActionProposed] = useState<boolean>(false);

  const contradictions: ContradictionItem[] = [
    {
      id: 'c-1',
      jiraKey: 'KAN-7',
      title: 'CLARA-102: Optimize PostgreSQL Connection Pool',
      jiraTargetDate: '2026-09-15',
      gitCommitHash: 'b4e19f2a',
      gitTargetDate: '2026-10-30',
      delayDays: 45,
      rationale: 'Kafka partition lag and schema migration delay in backend/app/infrastructure/db',
      jiraUrl: 'https://reenams.atlassian.net/browse/KAN-7',
      gitUrl: 'https://github.com/testing842/clara-V2/commit/b4e19f2a',
      severity: 'critical',
    },
    {
      id: 'c-2',
      jiraKey: 'KAN-9',
      title: 'CLARA-104: Add PCI-DSS Field-Level Encryption',
      jiraTargetDate: '2026-08-30',
      gitCommitHash: '7f9c2d1e',
      gitTargetDate: '2026-09-20',
      delayDays: 21,
      rationale: 'Security audit review requirement for AES-256 GCM key rotation in auth module',
      jiraUrl: 'https://reenams.atlassian.net/browse/KAN-9',
      gitUrl: 'https://github.com/testing842/clara-V2/commit/7f9c2d1e',
      severity: 'high',
    },
    {
      id: 'c-3',
      jiraKey: 'KAN-8',
      title: 'CLARA-103: Memory Leak in Payment Event Stream',
      jiraTargetDate: '2026-09-01',
      gitCommitHash: '3a8d11e9',
      gitTargetDate: '2026-09-15',
      delayDays: 14,
      rationale: 'Heap dump analysis revealed unclosed gRPC streaming channels',
      jiraUrl: 'https://reenams.atlassian.net/browse/KAN-8',
      gitUrl: 'https://github.com/testing842/clara-V2/commit/3a8d11e9',
      severity: 'medium',
    },
  ];

  const selectedItem = contradictions.find((c) => c.id === selectedContradictionId) || contradictions[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span className="glass-pill" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)' }}>
                <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} /> Timeline Contradiction Explorer
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Cross-Source Evidence Discrepancies
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
              Jira Roadmap vs Git Commit Timeline Alignment
            </h2>
          </div>

          <RippleButton rippleColor="rgba(192,132,252,0.35)" duration="600ms"
            className="glass-btn glass-btn-ai"
            onClick={() => onAskQuestion('Explain the timeline contradiction between Jira KAN-7 target date and Git commit b4e19f2a.')}
          >
            <Sparkles size={15} />
            <span>AI Contradiction Audit</span>
          </RippleButton>
        </div>
      </div>

      {/* Main Grid: Contradiction Cards + Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: Contradiction Item List */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} color="#ef4444" />
                Detected Timeline Discrepancies ({contradictions.length})
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                Discrepancies automatically identified between Jira due dates &amp; Git commit targets.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {contradictions.map((c) => {
              const isSelected = c.id === selectedContradictionId;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedContradictionId(c.id);
                    setActionProposed(false);
                  }}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    background: isSelected ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)' : 'rgba(15, 23, 42, 0.4)',
                    border: isSelected ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 20px rgba(239, 68, 68, 0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="glass-pill" style={{ color: '#5ca8ff', fontSize: '0.72rem' }}>
                        {c.jiraKey}
                      </span>
                      <span
                        className="glass-pill"
                        style={{
                          color: c.severity === 'critical' ? '#ef4444' : '#f97316',
                          borderColor: c.severity === 'critical' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(249, 115, 22, 0.4)',
                          fontSize: '0.72rem',
                        }}
                      >
                        +{c.delayDays} Days Delay
                      </span>
                    </div>

                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Git Commit: <code style={{ color: '#00f0ff', fontFamily: 'monospace' }}>{c.gitCommitHash}</code>
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.85rem' }}>
                    {c.title}
                  </h4>

                  {/* Side-by-Side Timeline Bar Comparison */}
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={13} color="#5ca8ff" /> Jira Target: <strong style={{ color: '#5ca8ff' }}>{c.jiraTargetDate}</strong>
                      </span>
                      <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <GitCommit size={13} color="#ef4444" /> Git Target: <strong style={{ color: '#ef4444' }}>{c.gitTargetDate}</strong>
                      </span>
                    </div>

                    {/* Progress Fill Bar */}
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ width: '65%', height: '100%', background: '#5ca8ff', borderRadius: '3px' }} />
                      <div style={{ width: '35%', height: '100%', background: '#ef4444', borderRadius: '3px', position: 'absolute', right: 0, top: 0 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Contradiction Inspector & MCP Action Proposal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Zap size={18} color="#00f0ff" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                Timeline Contradiction Details
              </h3>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
                {selectedItem.title}
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                {selectedItem.rationale}
              </p>
            </div>

            {/* Evidence Link Pills */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <a
                href={selectedItem.jiraUrl}
                target="_blank"
                rel="noreferrer"
                className="glass-btn"
                style={{ fontSize: '0.75rem', textDecoration: 'none', color: '#5ca8ff', borderColor: 'rgba(92, 168, 255, 0.3)' }}
              >
                <ExternalLink size={13} /> View Jira Ticket ({selectedItem.jiraKey})
              </a>

              <a
                href={selectedItem.gitUrl}
                target="_blank"
                rel="noreferrer"
                className="glass-btn"
                style={{ fontSize: '0.75rem', textDecoration: 'none', color: '#00f0ff', borderColor: 'rgba(0, 240, 255, 0.3)' }}
              >
                <GitCommit size={13} /> View Git Commit ({selectedItem.gitCommitHash})
              </a>
            </div>

            {/* Proposed MCP Alignment Action Card */}
            <div style={{ background: 'rgba(92, 168, 255, 0.08)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(92, 168, 255, 0.25)' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#5ca8ff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={15} /> Model Context Protocol (MCP) Roadmap Alignment
              </div>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1rem' }}>
                Automatically update Jira target completion date from <strong>{selectedItem.jiraTargetDate}</strong> to <strong>{selectedItem.gitTargetDate}</strong> to match Lead Architect Git commit log.
              </p>

              {actionProposed ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#35d07f', fontSize: '0.825rem', fontWeight: 700 }}>
                  <CheckCircle2 size={16} /> Roadmap Alignment Proposal Submitted to Approval Center!
                </div>
              ) : (
                <RippleButton rippleColor="rgba(255,255,255,0.35)" duration="600ms"
                  className="glass-btn glass-btn-primary"
                  onClick={() => setActionProposed(true)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <ArrowRight size={15} /> Propose Jira Target Date Update ({selectedItem.gitTargetDate})
                </RippleButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContradictionsView;
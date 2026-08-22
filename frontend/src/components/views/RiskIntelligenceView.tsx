// frontend/src/components/views/RiskIntelligenceView.tsx

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  User,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Risk } from '../../types';

interface RiskIntelligenceViewProps {
  risks: Risk[];
  onAskQuestion: (q: string) => void;
}

export const RiskIntelligenceView: React.FC<RiskIntelligenceViewProps> = ({
  risks,
  onAskQuestion,
}) => {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(risks[0] || null);

  const getCellClass = (prob: number, impact: number) => {
    const score = prob * impact;
    if (score >= 18) return 'risk-level-critical';
    if (score >= 12) return 'risk-level-high';
    if (score >= 6) return 'risk-level-medium';
    return 'risk-level-low';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="glass-pill" style={{ color: '#fb923c', borderColor: 'rgba(251, 146, 60, 0.4)' }}>
                Active Risk Matrix
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                5x5 Likelihood vs Impact Assessment
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
              Risk Intelligence &amp; Governance
            </h2>
          </div>
          <button
            className="glass-btn glass-btn-ai"
            onClick={() => onAskQuestion('What are the critical open risks for Project Aegis?')}
          >
            <Sparkles size={15} />
            <span>Synthesize Mitigation Plan</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 5x5 Matrix + Risk Cards List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
        {/* Left: 5x5 Risk Heatmap */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
              5×5 Risk Exposure Heatmap
            </h3>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              High Impact (Top-Right)
            </span>
          </div>

          {/* 5x5 Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {/* Rows: Impact 5 down to 1 */}
            {[5, 4, 3, 2, 1].map((impact) => (
              <div key={impact} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
                {[1, 2, 3, 4, 5].map((prob) => {
                  const matchingRisks = risks.filter((r) => r.probability === prob && r.impact === impact);
                  return (
                    <div
                      key={`${prob}-${impact}`}
                      className={`risk-cell ${getCellClass(prob, impact)}`}
                      onClick={() => {
                        if (matchingRisks.length > 0) {
                          setSelectedRisk(matchingRisks[0]);
                        }
                      }}
                      style={{
                        position: 'relative',
                        border: matchingRisks.some((r) => r.id === selectedRisk?.id)
                          ? '2px solid #ffffff'
                          : undefined,
                      }}
                    >
                      <span>{prob * impact}</span>
                      {matchingRisks.length > 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#ffffff',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.7rem', color: '#64748b' }}>
            <span>← Low Likelihood</span>
            <span>High Likelihood →</span>
          </div>
        </div>

        {/* Right: Detailed Selected Risk View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {selectedRisk && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span
                      className="glass-pill"
                      style={{
                        color: selectedRisk.severity === 'critical' ? '#ff6b7a' : '#fb923c',
                        borderColor: selectedRisk.severity === 'critical' ? 'rgba(255, 107, 122, 0.4)' : 'rgba(251, 146, 60, 0.4)',
                      }}
                    >
                      {selectedRisk.severity.toUpperCase()} ({selectedRisk.score}/25)
                    </span>
                    <span className="glass-pill" style={{ color: '#94a3b8' }}>
                      {selectedRisk.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                    {selectedRisk.title}
                  </h3>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {selectedRisk.description}
              </p>

              {/* Mitigation Plan Box */}
              <div style={{
                background: 'rgba(10, 20, 32, 0.7)',
                borderRadius: '10px',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5ca8ff', marginBottom: '0.35rem' }}>
                  Governed Mitigation Strategy
                </div>
                <div style={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {selectedRisk.mitigation_plan}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={14} />
                  <span>Owner: <strong>{selectedRisk.owner}</strong></span>
                </div>
                <div>Last Reviewed: {selectedRisk.last_reviewed_at ? new Date(selectedRisk.last_reviewed_at).toLocaleDateString() : 'Aug 22, 2026'}</div>
              </div>
            </div>
          )}

          {/* Ranked Risks List */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              All Active Project Risks ({risks.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {risks.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRisk(r)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: r.id === selectedRisk?.id ? 'rgba(92, 168, 255, 0.15)' : 'rgba(17, 34, 54, 0.5)',
                    border: r.id === selectedRisk?.id ? '1px solid #5ca8ff' : '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#ffffff' }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                      Owner: {r.owner} • Score: {r.score}/25
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      background: r.severity === 'critical' ? 'rgba(255, 107, 122, 0.2)' : 'rgba(251, 146, 60, 0.2)',
                      color: r.severity === 'critical' ? '#ff6b7a' : '#fb923c',
                    }}
                  >
                    {r.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

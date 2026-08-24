// frontend/src/components/views/DecisionIntelligenceView.tsx

import React, { useState } from 'react';
import {
  GitPullRequest,
  GitMerge,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { Decision } from '../../types';
import { RippleButton } from "@/components/ui/ripple-button";

interface DecisionIntelligenceViewProps {
  decisions: Decision[];
  onAskQuestion: (q: string) => void;
}

export const DecisionIntelligenceView: React.FC<DecisionIntelligenceViewProps> = ({
  decisions,
  onAskQuestion,
}) => {
  const [selectedDecision, setSelectedDecision] = useState<Decision>(decisions[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="glass-pill active" style={{ fontSize: '0.75rem' }}>
                Architecture Decision Records
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Governed Decision Memory &amp; Supersession Trees
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
              Decision Intelligence Engine
            </h2>
          </div>
          <RippleButton rippleColor="rgba(192,132,252,0.35)" duration="600ms"
            className="glass-btn glass-btn-ai"
            onClick={() => onAskQuestion('Why was synchronous REST replaced with Kafka in ADR-002?')}
          >
            <Sparkles size={15} />
            <span>Trace ADR Evolution</span>
          </RippleButton>
        </div>
      </div>

      {/* Main Grid: ADR List & Timeline vs Detailed Rationale Box */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
        {/* Left: ADR Supersession Timeline */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
            Decision History &amp; Supersession Graph
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {decisions.map((d) => {
              const isSelected = selectedDecision?.id === d.id;
              const isSuperseded = d.status === 'superseded';

              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDecision(d)}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    background: isSelected
                      ? 'rgba(92, 168, 255, 0.15)'
                      : isSuperseded
                      ? 'rgba(255, 107, 122, 0.08)'
                      : 'rgba(17, 34, 54, 0.55)',
                    border: isSelected
                      ? '1px solid #5ca8ff'
                      : isSuperseded
                      ? '1px solid rgba(255, 107, 122, 0.25)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <GitPullRequest size={15} color={isSuperseded ? '#ff6b7a' : '#5ca8ff'} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isSuperseded ? '#f87171' : '#70b4ff' }}>
                        {d.adr_number}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: d.status === 'accepted' ? 'rgba(53, 208, 127, 0.15)' : 'rgba(255, 107, 122, 0.15)',
                        color: d.status === 'accepted' ? '#35d07f' : '#ff6b7a',
                      }}
                    >
                      {d.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.35rem' }}>
                    {d.title}
                  </div>

                  {d.supersedes_id && (
                    <div style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '0.25rem' }}>
                      ↳ Supersedes ADR-001 (Synchronous REST)
                    </div>
                  )}

                  {d.superseded_by_id && (
                    <div style={{ fontSize: '0.7rem', color: '#ff6b7a', marginTop: '0.25rem' }}>
                      ↳ Superseded by ADR-002 (Event Sourcing)
                    </div>
                  )}

                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem' }}>
                    Decided by {d.decided_by} • {new Date(d.decided_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Decision Record Inspector */}
        {selectedDecision && (
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="glass-pill active" style={{ fontSize: '0.75rem' }}>
                    {selectedDecision.adr_number}
                  </span>
                  <span
                    className="glass-pill"
                    style={{
                      color: selectedDecision.status === 'accepted' ? '#35d07f' : '#ff6b7a',
                      borderColor: selectedDecision.status === 'accepted' ? 'rgba(53, 208, 127, 0.4)' : 'rgba(255, 107, 122, 0.4)',
                    }}
                  >
                    {selectedDecision.status.toUpperCase()}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedDecision.title}
                </h3>
              </div>
            </div>

            {/* Context & Summary */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Problem Context
              </div>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                {selectedDecision.context}
              </p>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5ca8ff', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Architectural Rationale
              </div>
              <div style={{
                background: 'rgba(10, 20, 32, 0.7)',
                borderRadius: '10px',
                padding: '1rem',
                border: '1px solid rgba(92, 168, 255, 0.2)',
                fontSize: '0.85rem',
                color: '#f1f5f9',
                lineHeight: 1.5,
              }}>
                {selectedDecision.rationale}
              </div>
            </div>

            {/* Alternatives Considered Matrix */}
            {selectedDecision.alternatives_considered && selectedDecision.alternatives_considered.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Alternatives Evaluated &amp; Trade-offs
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedDecision.alternatives_considered.map((alt, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: 'rgba(17, 34, 54, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <strong style={{ color: '#5ca8ff' }}>{alt.name}:</strong>{' '}
                      <span style={{ color: '#cbd5e1' }}>{alt.tradeoff}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Consequences */}
            {selectedDecision.consequences && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Known Consequences &amp; Operational Impact
                </div>
                {Array.isArray(selectedDecision.consequences) ? (
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {selectedDecision.consequences.map((c: string, i: number) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {selectedDecision.consequences}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
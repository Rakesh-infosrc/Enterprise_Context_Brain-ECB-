// frontend/src/components/views/RiskIntelligenceView.tsx

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  User,
  Sparkles,
  Zap,
  Filter,
  Layers,
  Info,
  Flame,
} from 'lucide-react';
import { Risk } from '../../types';
import { RippleButton } from "@/components/ui/ripple-button";

interface RiskIntelligenceViewProps {
  risks: Risk[];
  onAskQuestion: (q: string) => void;
}

export const RiskIntelligenceView: React.FC<RiskIntelligenceViewProps> = ({
  risks,
  onAskQuestion,
}) => {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(risks[0] || null);
  const [activeCellFilter, setActiveCellFilter] = useState<{ prob: number; impact: number } | null>(null);

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
    let bg = 'rgba(30, 41, 59, 0.4)';
    let border = '1px solid rgba(255, 255, 255, 0.08)';
    let textColor = '#94a3b8';
    let glow = 'none';

    if (score >= 18) {
      bg = isSelected
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.45), rgba(225, 29, 72, 0.35))'
        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(153, 27, 27, 0.15))';
      border = isSelected ? '2px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.4)';
      textColor = '#fca5a5';
      glow = count > 0 ? '0 0 15px rgba(239, 68, 68, 0.35)' : 'none';
    } else if (score >= 12) {
      bg = isSelected
        ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.4), rgba(217, 119, 6, 0.3))'
        : 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(180, 83, 9, 0.12))';
      border = isSelected ? '2px solid #f97316' : '1px solid rgba(249, 115, 22, 0.35)';
      textColor = '#fdba74';
      glow = count > 0 ? '0 0 12px rgba(249, 115, 22, 0.25)' : 'none';
    } else if (score >= 6) {
      bg = isSelected
        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(217, 119, 6, 0.25))'
        : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(146, 64, 14, 0.1))';
      border = isSelected ? '2px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.3)';
      textColor = '#fde68a';
      glow = count > 0 ? '0 0 10px rgba(245, 158, 11, 0.2)' : 'none';
    } else {
      bg = isSelected
        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2))'
        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(4, 120, 87, 0.08))';
      border = isSelected ? '2px solid #10b981' : '1px solid rgba(16, 185, 129, 0.25)';
      textColor = '#6ee7b7';
      glow = count > 0 ? '0 0 10px rgba(16, 185, 129, 0.2)' : 'none';
    }

    return { bg, border, textColor, glow };
  };

  const filteredRisks = activeCellFilter
    ? risks.filter((r) => (Number(r.probability) || 3) === activeCellFilter.prob && (Number(r.impact) || 3) === activeCellFilter.impact)
    : risks;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span className="glass-pill" style={{ color: '#f97316', borderColor: 'rgba(249, 115, 22, 0.4)', background: 'rgba(249, 115, 22, 0.1)' }}>
                <Flame size={12} style={{ display: 'inline', marginRight: '4px' }} /> 5×5 Matrix Heatmap
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Governance &amp; Threat Severity Matrix
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
              Risk Intelligence &amp; Heatmap Analysis
            </h2>
          </div>

          <RippleButton rippleColor="rgba(192,132,252,0.35)" duration="600ms"
            className="glass-btn glass-btn-ai"
            onClick={() => onAskQuestion('What are the critical open risks and suggested mitigations?')}
          >
            <Sparkles size={15} />
            <span>Synthesize Mitigation Plan</span>
          </RippleButton>
        </div>
      </div>

      {/* Main Grid: Modern 5x5 Heatmap + Risk Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        
        {/* Left: Modern Shadcn-Style 5x5 Heatmap Table */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} color="#f97316" />
                Risk Exposure Heatmap
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                Select a cell to filter risks by Likelihood × Impact severity score.
              </p>
            </div>

            {activeCellFilter && (
              <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
                onClick={() => setActiveCellFilter(null)}
                className="glass-btn"
                style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
              >
                Reset Matrix Filter
              </RippleButton>
            )}
          </div>

          {/* Color Legend Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.7rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#6ee7b7' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981' }} />
              Low (1-5)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fde68a' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#f59e0b' }} />
              Medium (6-11)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fdba74' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#f97316' }} />
              High (12-17)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fca5a5' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#ef4444' }} />
              Critical (18-25)
            </div>
          </div>

          {/* 5x5 Heatmap Matrix Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Impact Axis Header Label */}
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Impact ↑
            </div>

            {/* Matrix Grid Rows */}
            {[5, 4, 3, 2, 1].map((impact) => (
              <div key={impact} style={{ display: 'grid', gridTemplateColumns: '110px repeat(5, 1fr)', gap: '0.5rem', alignItems: 'center' }}>
                {/* Impact Row Label */}
                <div style={{ fontSize: '0.725rem', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  {impactLabels[impact].label}
                </div>

                {/* 5 Likelihood Columns */}
                {[1, 2, 3, 4, 5].map((prob) => {
                  const matchingRisks = risks.filter((r) => (Number(r.probability) || 3) === prob && (Number(r.impact) || 3) === impact);
                  const count = matchingRisks.length;
                  const isSelected = activeCellFilter?.prob === prob && activeCellFilter?.impact === impact;
                  const { bg, border, textColor, glow } = getCellStyles(prob, impact, count, isSelected);

                  return (
                    <div
                      key={`${prob}-${impact}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Likelihood ${prob} Impact ${impact} Score ${prob * impact} ${count} risks`}
                      aria-selected={isSelected}
                      onClick={() => {
                        setActiveCellFilter({ prob, impact });
                        if (count > 0) setSelectedRisk(matchingRisks[0]);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveCellFilter({ prob, impact });
                          if (count > 0) setSelectedRisk(matchingRisks[0]);
                        }
                      }}
                      style={{
                        background: bg,
                        border: border,
                        boxShadow: glow,
                        borderRadius: '10px',
                        padding: '0.85rem 0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        minHeight: '65px',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        zIndex: isSelected ? 2 : 1,
                      }}
                    >
                      {/* Score Number */}
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: textColor, lineHeight: 1 }}>
                        {prob * impact}
                      </span>

                      {/* Active Risk Pill */}
                      {count > 0 ? (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '12px',
                            background: textColor,
                            color: '#0f172a',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                          }}
                        >
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#0f172a' }} />
                          {count} {count === 1 ? 'Risk' : 'Risks'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.6rem', color: 'rgba(255, 255, 255, 0.2)' }}>
                          0
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Likelihood Axis Footer Labels */}
            <div style={{ display: 'grid', gridTemplateColumns: '110px repeat(5, 1fr)', gap: '0.5rem', marginTop: '0.4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'left' }}>
                Likelihood →
              </div>
              {[1, 2, 3, 4, 5].map((prob) => (
                <div key={prob} style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                  {likelihoodLabels[prob]}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Selected Risk Inspector & Filtered Active List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Selected Risk Card */}
          {selectedRisk ? (
            <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span
                      className="glass-pill"
                      style={{
                        color: selectedRisk.severity === 'critical' ? '#ef4444' : selectedRisk.severity === 'high' ? '#f97316' : '#f59e0b',
                        borderColor: selectedRisk.severity === 'critical' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(249, 115, 22, 0.4)',
                        background: selectedRisk.severity === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                        fontWeight: 700,
                      }}
                    >
                      {selectedRisk.severity.toUpperCase()} SCORE: {selectedRisk.score}/25
                    </span>
                    <span className="glass-pill" style={{ color: '#94a3b8' }}>
                      Status: {selectedRisk.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
                    {selectedRisk.title}
                  </h3>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {selectedRisk.description}
              </p>

              {/* Governed Mitigation Box */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                borderRadius: '12px',
                padding: '1.1rem',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldAlert size={14} /> Governed Mitigation Strategy
                </div>
                <div style={{ fontSize: '0.825rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {selectedRisk.mitigation_plan}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={14} />
                  <span>Assignee: <strong style={{ color: '#f8fafc' }}>{selectedRisk.owner}</strong></span>
                </div>
                <div>Last Synced: {selectedRisk.last_reviewed_at ? new Date(selectedRisk.last_reviewed_at).toLocaleDateString() : 'Today'}</div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Select a cell from the 5×5 heatmap to inspect risks.
            </div>
          )}

          {/* Active Risk Items List */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Risks ({filteredRisks.length})
                {activeCellFilter && (
                  <span style={{ textTransform: 'none', color: '#38bdf8', marginLeft: '0.5rem' }}>
                    (Filtered Score: {activeCellFilter.prob * activeCellFilter.impact})
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
              {filteredRisks.map((r) => {
                const isSelected = r.id === selectedRisk?.id;
                return (
                  <div
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`View risk ${r.title} severity ${r.severity}`}
                    onClick={() => setSelectedRisk(r)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedRisk(r);
                      }
                    }}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.4)',
                      border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ flex: 1, paddingRight: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.25rem' }}>
                        {r.title}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                        Owner: {r.owner} • Matrix Score: <strong style={{ color: '#ffffff' }}>{r.score}/25</strong>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background: r.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' : r.severity === 'high' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: r.severity === 'critical' ? '#ef4444' : r.severity === 'high' ? '#f97316' : '#f59e0b',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RiskIntelligenceView;
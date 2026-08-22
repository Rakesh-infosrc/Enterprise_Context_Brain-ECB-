// frontend/src/components/WelcomeBanner.tsx

import React from 'react';
import {
  Sparkles,
  HelpCircle,
  TrendingUp,
  GitPullRequest,
  ShieldAlert,
  ArrowRight,
  X,
} from 'lucide-react';

interface WelcomeBannerProps {
  onStartTour: () => void;
  onAskQuestion: (query: string) => void;
  onDismiss: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  onStartTour,
  onAskQuestion,
  onDismiss,
}) => {
  const personas = [
    {
      role: 'Project Manager',
      icon: TrendingUp,
      color: '#5ca8ff',
      query: 'Why is Project Aegis delayed and what is the root cause?',
      label: 'Inspect Project Aegis Blocker & Roadmap Delay',
    },
    {
      role: 'Lead Architect',
      icon: GitPullRequest,
      color: '#9b7cff',
      query: 'Why was synchronous REST replaced with Kafka in ADR-002?',
      label: 'Trace ADR-001 vs ADR-002 Kafka Supersession',
    },
    {
      role: 'Risk Officer',
      icon: ShieldAlert,
      color: '#fb923c',
      query: 'What are the critical open risks for Project Aegis and PCI-DSS 4.0?',
      label: 'Review Critical 5x5 Risk Heatmap & Audit Gaps',
    },
  ];

  return (
    <div
      className="glass-panel slide-up-enter"
      style={{
        padding: '1.75rem 2rem',
        background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.85) 0%, rgba(17, 34, 54, 0.65) 100%)',
        border: '1px solid rgba(92, 168, 255, 0.25)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(155, 124, 255, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'transparent',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          padding: '0.35rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Dismiss welcome banner"
        onMouseEnter={(e) => (e.currentTarget.style.color = '#cbd5e1')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
      >
        <X size={16} />
      </button>

      {/* Top Welcome Text & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="glass-pill active" style={{ fontSize: '0.75rem' }}>
              <Sparkles size={12} /> Welcome to ECB v2.2
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Governed Context Operating System
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
            What would you like to investigate today?
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Choose your persona workflow or take a 60-second interactive guided tour.
          </p>
        </div>

        <button
          onClick={onStartTour}
          className="glass-btn glass-btn-primary"
          style={{ padding: '0.55rem 1.15rem', fontSize: '0.825rem' }}
        >
          <HelpCircle size={15} />
          <span>Interactive Guided Tour</span>
        </button>
      </div>

      {/* 3 Persona Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {personas.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div
              key={idx}
              onClick={() => onAskQuestion(p.query)}
              className="glass-card glass-card-hover"
              style={{
                cursor: 'pointer',
                padding: '1rem 1.15rem',
                border: `1px solid ${p.color}33`,
                background: 'rgba(10, 20, 32, 0.65)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: `${p.color}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} color={p.color} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: p.color, textTransform: 'uppercase' }}>
                  {p.role} Path
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.35rem', lineHeight: 1.3 }}>
                {p.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#5ca8ff' }}>
                <span>Launch Ask ECB</span>
                <ArrowRight size={12} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

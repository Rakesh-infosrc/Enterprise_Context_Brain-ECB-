// frontend/src/components/CommandPalette.tsx

import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Layers,
  ShieldAlert,
  GitPullRequest,
  FileSearch,
  CheckCircle2,
  Activity,
  Award,
  ArrowRight,
  X,
} from 'lucide-react';
import { NavItem } from './Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: NavItem) => void;
  onAskQuestion: (question: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectView,
  onAskQuestion,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickQuestions = [
    'Why is Project Aegis delayed?',
    'Why was synchronous REST replaced with Kafka in ADR-002?',
    'What are the critical open risks for Project Aegis?',
    'Why did we choose PostgreSQL with pgvector over MongoDB?',
    'What was the resolution for Kafka partition rebalance in INC-892?',
  ];

  const filteredQuestions = quickQuestions.filter((q) =>
    q.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigationItems: Array<{ id: NavItem; label: string; icon: React.ElementType }> = [
    { id: 'command_center', label: 'Go to Command Center Dashboard', icon: Layers },
    { id: 'ask_ecb', label: 'Go to Ask ECB (AI Operating Console)', icon: Sparkles },
    { id: 'risk_intelligence', label: 'Go to Risk Matrix & Assessment', icon: ShieldAlert },
    { id: 'decision_intelligence', label: 'Go to Decision Timeline & ADRs', icon: GitPullRequest },
    { id: 'approval_center', label: 'Go to Governed Approval Center', icon: CheckCircle2 },
    { id: 'agent_trace', label: 'Go to Operational Traces & Latency', icon: Activity },
    { id: 'ai_eval', label: 'Go to AI Evaluation Suite', icon: Award },
  ];

  const filteredNav = navigationItems.filter((n) =>
    n.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 11, 20, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '640px',
          maxWidth: '90vw',
          background: 'rgba(13, 27, 42, 0.95)',
          border: '1px solid rgba(92, 168, 255, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(92, 168, 255, 0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Search size={20} color="#5ca8ff" style={{ marginRight: '0.75rem' }} />
          <input
            autoFocus
            type="text"
            placeholder="Type a question for ECB or search views..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm.trim()) {
                onAskQuestion(searchTerm);
                onClose();
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '1rem',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.75rem' }}>
          {/* Direct Query Option */}
          {searchTerm.trim() && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9b7cff', textTransform: 'uppercase', padding: '0.25rem 0.5rem' }}>
                Ask ECB Intelligence
              </div>
              <button
                onClick={() => {
                  onAskQuestion(searchTerm);
                  onClose();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(155, 124, 255, 0.12)',
                  border: '1px solid rgba(155, 124, 255, 0.3)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Sparkles size={16} color="#c084fc" />
                  <span>Synthesize answer for: &quot;<strong>{searchTerm}</strong>&quot;</span>
                </div>
                <ArrowRight size={15} color="#c084fc" />
              </button>
            </div>
          )}

          {/* Gold Questions */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', padding: '0.25rem 0.5rem' }}>
              Golden Benchmark Questions
            </div>
            {filteredQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  onAskQuestion(q);
                  onClose();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  fontSize: '0.825rem',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Sparkles size={14} color="#5ca8ff" />
                  <span>{q}</span>
                </div>
                <kbd style={{ fontSize: '0.65rem', color: '#64748b' }}>Enter</kbd>
              </button>
            ))}
          </div>

          {/* Quick Navigation */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', padding: '0.25rem 0.5rem' }}>
              Navigation
            </div>
            {filteredNav.map((n) => {
              const Icon = n.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    onSelectView(n.id);
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    fontSize: '0.825rem',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(92, 168, 255, 0.08)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Icon size={15} color="#64748b" />
                    <span>{n.label}</span>
                  </div>
                  <ArrowRight size={14} color="#64748b" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem 1.25rem',
          background: 'rgba(7, 17, 31, 0.8)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '0.7rem',
          color: '#64748b',
        }}>
          <div>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>ESC</kbd> to dismiss</div>
          <div>Enterprise Context Brain v2.1</div>
        </div>
      </div>
    </div>
  );
};

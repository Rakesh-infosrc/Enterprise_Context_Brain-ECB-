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
import { RippleButton } from "@/components/ui/ripple-button";

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
  const inputRef = React.useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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
    { id: 'project_intelligence', label: 'Go to Project & Risk Intelligence Hub', icon: ShieldAlert },
    { id: 'approval_center', label: 'Go to Governed Approval Center', icon: CheckCircle2 },
    { id: 'developer_diagnostics', label: 'Go to Developer Diagnostics Dashboard', icon: Activity },
  ];

  const filteredNav = navigationItems.filter((n) =>
    n.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
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
        role="document"
        style={{
          width: '640px',
          maxWidth: '90vw',
          background: 'rgba(13, 27, 42, 0.95)',
          border: '1px solid rgba(92, 168, 255, 0.3)',
          borderRadius:'var(--radius-lg)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(92, 168, 255, 0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Search size={20} color="#5ca8ff" style={{ marginRight: 'var(--fs-xs)' }} />
          <input
            ref={inputRef}
            autoFocus
            aria-label="Search views and questions"
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
            <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
              onClick={() => setSearchTerm('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </RippleButton>
          )}
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: 'var(--fs-xs)' }}>
          {/* Direct Query Option */}
          {searchTerm.trim() && (
            <div style={{ marginBottom: 'var(--fs-xs)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-violet)', textTransform: 'uppercase', padding: '0.25rem 0.5rem' }}>
                Ask ECB Intelligence
              </div>
              <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
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
                  borderRadius:'var(--radius-sm)',
                  background: 'rgba(155, 124, 255, 0.12)',
                  border: '1px solid rgba(155, 124, 255, 0.3)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  fontSize: 'var(--fs-base)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Sparkles size={16} color="#c084fc" />
                  <span>Synthesize answer for: &quot;<strong>{searchTerm}</strong>&quot;</span>
                </div>
                <ArrowRight size={15} color="#c084fc" />
              </RippleButton>
            </div>
          )}

          {/* Gold Questions */}
          <div style={{ marginBottom: 'var(--fs-xs)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', padding: '0.25rem 0.5rem' }}>
              Golden Benchmark Questions
            </div>
            {filteredQuestions.map((q, i) => (
              <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
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
                  borderRadius:'var(--radius-sm)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  fontSize: 'var(--fs-sm)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Sparkles size={14} color="#5ca8ff" />
                  <span>{q}</span>
                </div>
                <kbd style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>Enter</kbd>
              </RippleButton>
            ))}
          </div>

          {/* Quick Navigation */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', padding: '0.25rem 0.5rem' }}>
              Navigation
            </div>
            {filteredNav.map((n) => {
              const Icon = n.icon;
              return (
                <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
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
                    borderRadius:'var(--radius-sm)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    fontSize: 'var(--fs-sm)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(92, 168, 255, 0.08)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Icon size={15} color="#64748b" />
                    <span>{n.label}</span>
                  </div>
                  <ArrowRight size={14} color="#64748b" />
                </RippleButton>
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
          color: 'var(--text-faint)',
        }}>
          <div>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>ESC</kbd> to dismiss</div>
          <div>Enterprise Context Brain v2.1</div>
        </div>
      </div>
    </div>
  );
};
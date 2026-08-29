// frontend/src/components/Header.tsx

import React from 'react';
import {
  Search,
  HelpCircle,
  ChevronDown,
  Compass,
  Cpu,
} from 'lucide-react';
import { Project } from '../types';
import { Tooltip } from './Tooltip';
import { AnimatedThemeToggler } from './ui/animated-theme-toggler';
import { RippleButton } from "@/components/ui/ripple-button";
import { PersonaSwitcher } from './PersonaSwitcher';

interface HeaderProps {
  title: string;
  subtitle?: string;
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onOpenCommandPalette: () => void;
  onOpenAskEcb: () => void;
  userMode: 'guided' | 'pro';
  onToggleUserMode: () => void;
  onStartTour: () => void;
  theme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  projects,
  activeProjectId,
  onSelectProject,
  onOpenCommandPalette,
  onOpenAskEcb,
  userMode,
  onToggleUserMode,
  onStartTour,
  theme = 'dark',
  onThemeChange,
}) => {
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  return (
    <header
      className="ecb-header"
      style={{
        minHeight: '72px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(7, 17, 31, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
        padding: '0.6rem 1.25rem',
        rowGap: 'var(--fs-xs)',
      }}
    >
      {/* Title & View Subtitle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', minWidth: 0, flex: '1 1 200px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </h1>
        {subtitle && (
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {subtitle}
          </span>
        )}
      </div>

      {/* Center Spotlight Search (Ctrl+K) — keyboard accessible */}
      <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
        type="button"
        aria-label="Search decisions, risks, Jira, Git. Press Ctrl K to open command palette"
        onClick={onOpenCommandPalette}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenCommandPalette();
          }
        }}
        className="ecb-header-search"
      >
        <Search size={15} color="#64748b" aria-hidden="true" />
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-faint)', flex: 1, textAlign: 'left' as const }}>
          Search decisions, risks, Jira, Git...
        </span>
        <span
          aria-hidden="true"
          style={{
            fontSize: 'var(--fs-2xs)',
            fontWeight: 700,
            fontFamily: 'monospace',
            padding: '0.15rem 0.4rem',
            borderRadius:'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'var(--text-muted)',
          }}
        >
          Ctrl K
        </span>
      </RippleButton>

      {/* Right Controls: Animated Theme, Mode Toggle, Guided Tour & Project Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--fs-xs)', flexWrap: 'wrap', flexShrink: 0 }}>
        <PersonaSwitcher />
        <Tooltip content={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} position="bottom">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatedThemeToggler
              theme={theme}
              onThemeChange={onThemeChange}
              variant="circle"
              duration={600}
              aria-label={theme === 'dark' ? 'Activate light mode' : 'Activate dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="theme-toggler-btn"
              style={
                theme === 'dark'
                  ? {
                      width: '42px',
                      height: '42px',
                      minWidth: '42px',
                      minHeight: '42px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '9999px',
                      background: 'rgba(255,255,255,0.14)',
                      border: '1.5px solid rgba(255,255,255,0.28)',
                      color: '#fde68a',
                      boxShadow: '0 0 16px rgba(251,191,36,0.28), 0 2px 10px rgba(0,0,0,0.28)',
                      opacity: 1,
                      visibility: 'visible',
                      zIndex: 2,
                    } as React.CSSProperties
                  : {
                      width: '42px',
                      height: '42px',
                      minWidth: '42px',
                      minHeight: '42px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '9999px',
                      background: '#0f172a',
                      border: '1.5px solid #1e293b',
                      color: '#fde68a',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.18), 0 0 0 1px rgba(15,23,42,0.06)',
                      opacity: 1,
                      visibility: 'visible',
                      zIndex: 2,
                    } as React.CSSProperties
              }
            />
          </div>
        </Tooltip>
        {/* Mode Switcher Pill */}
        <Tooltip content={userMode === 'guided' ? "Focus Mode: Streamlined view for essential insights. Click to switch to Pro Mode." : "Pro Mode: Deep diagnostics, LangGraph DAGs & vector indices active."} position="bottom">
          <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
            onClick={onToggleUserMode}
            className="glass-pill"
            style={{
              cursor: 'pointer',
              padding: '0.35rem 0.75rem',
              background: userMode === 'guided' ? 'rgba(53, 208, 127, 0.15)' : 'rgba(155, 124, 255, 0.15)',
              borderColor: userMode === 'guided' ? 'rgba(53, 208, 127, 0.4)' : 'rgba(155, 124, 255, 0.4)',
              color: userMode === 'guided' ? 'var(--accent-emerald)' : 'var(--accent-violet)',
            }}
          >
            {userMode === 'guided' ? <Compass size={13} /> : <Cpu size={13} />}
            <span>{userMode === 'guided' ? 'Focus Mode' : 'Pro Mode'}</span>
          </RippleButton>
        </Tooltip>

        {/* Guided Tour Trigger */}
        <Tooltip content="Launch interactive 60-second onboarding walkthrough" position="bottom">
          <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
            onClick={onStartTour}
            className="glass-btn"
            style={{ padding: '0.45rem 0.65rem' }}
            aria-label="Launch guided tour"
          >
            <HelpCircle size={15} color="#5ca8ff" aria-hidden="true" />
          </RippleButton>
        </Tooltip>

        {/* Project Selector Dropdown */}
        {projects.length > 0 && (
          <div style={{ position: 'relative' }}>
            <select
              value={activeProjectId}
              onChange={(e) => onSelectProject(e.target.value)}
              className="glass-input"
              aria-label="Select project"
              style={{
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
                padding: '0.45rem 2rem 0.45rem 0.85rem',
                appearance: 'none',
                cursor: 'pointer',
                background: 'rgba(13, 27, 42, 0.75)',
                width: 'auto',
                minWidth: '140px',
                maxWidth: '200px',
                flex: '0 1 180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <option value="all" style={{ background: '#07111f', color: '#ffffff' }}>
                All Connected Projects
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} style={{ background: '#07111f', color: '#ffffff' }}>
                  {p.code} — {p.name.split('-')[0].trim()}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              color="#94a3b8"
              aria-hidden="true"
              style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
          </div>
        )}
      </div>
    </header>
  );
};
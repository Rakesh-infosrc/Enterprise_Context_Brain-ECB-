// frontend/src/components/Header.tsx

import React from 'react';
import {
  Search,
  Sliders,
  Sparkles,
  HelpCircle,
  Activity,
  Layers,
  ChevronDown,
  Compass,
  Cpu,
} from 'lucide-react';
import { Project } from '../types';
import { Tooltip } from './Tooltip';

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
}) => {
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  return (
    <header
      style={{
        height: '72px',
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
        padding: '0 2rem',
      }}
    >
      {/* Title & View Subtitle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {subtitle && (
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
            {subtitle}
          </span>
        )}
      </div>

      {/* Center Spotlight Search (Ctrl+K) */}
      <div
        onClick={onOpenCommandPalette}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'rgba(13, 27, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '0.45rem 1rem',
          cursor: 'pointer',
          width: '320px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(92, 168, 255, 0.4)';
          e.currentTarget.style.boxShadow = '0 0 12px rgba(92, 168, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <Search size={15} color="#64748b" />
        <span style={{ fontSize: '0.8rem', color: '#64748b', flex: 1 }}>
          Search decisions, risks, Jira, Git...
        </span>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            fontFamily: 'monospace',
            padding: '0.15rem 0.4rem',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
          }}
        >
          Ctrl K
        </span>
      </div>

      {/* Right Controls: Mode Toggle, Guided Tour & Project Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Mode Switcher Pill */}
        <Tooltip content={userMode === 'guided' ? "Guided Mode: Streamlined view for essential insights. Click to switch to Pro Mode." : "Pro Mode: Deep diagnostics, LangGraph DAGs & vector indices active."}>
          <button
            onClick={onToggleUserMode}
            className="glass-pill"
            style={{
              cursor: 'pointer',
              padding: '0.35rem 0.75rem',
              background: userMode === 'guided' ? 'rgba(53, 208, 127, 0.15)' : 'rgba(155, 124, 255, 0.15)',
              borderColor: userMode === 'guided' ? 'rgba(53, 208, 127, 0.4)' : 'rgba(155, 124, 255, 0.4)',
              color: userMode === 'guided' ? '#35d07f' : '#c084fc',
            }}
          >
            {userMode === 'guided' ? <Compass size={13} /> : <Cpu size={13} />}
            <span>{userMode === 'guided' ? 'Guided View' : 'Pro Power Mode'}</span>
          </button>
        </Tooltip>

        {/* Guided Tour Trigger */}
        <Tooltip content="Launch interactive 60-second onboarding walkthrough">
          <button
            onClick={onStartTour}
            className="glass-btn"
            style={{ padding: '0.45rem 0.65rem' }}
          >
            <HelpCircle size={15} color="#5ca8ff" />
          </button>
        </Tooltip>

        {/* Project Selector Dropdown */}
        {projects.length > 0 && (
          <div style={{ position: 'relative' }}>
            <select
              value={activeProjectId}
              onChange={(e) => onSelectProject(e.target.value)}
              className="glass-input"
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.45rem 2rem 0.45rem 0.85rem',
                appearance: 'none',
                cursor: 'pointer',
                background: 'rgba(13, 27, 42, 0.75)',
                width: 'auto',
                minWidth: '180px',
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} style={{ background: '#07111f', color: '#ffffff' }}>
                  {p.code} — {p.name.split('-')[0].trim()}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              color="#94a3b8"
              style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
          </div>
        )}
      </div>
    </header>
  );
};

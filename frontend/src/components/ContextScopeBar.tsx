// frontend/src/components/ContextScopeBar.tsx

import React from 'react';
import {
  Clock,
  Filter,
  Bot,
  Layers,
  Check,
  Shield,
} from 'lucide-react';
import { Project, SourceType, AgentWorkflow } from '../types';
import { RippleButton } from "@/components/ui/ripple-button";

interface ContextScopeBarProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  timeRangeDays: number;
  onSelectTimeRange: (days: number) => void;
  selectedSources: SourceType[];
  onToggleSource: (source: SourceType) => void;
  selectedWorkflow?: AgentWorkflow;
  onSelectWorkflow: (workflow?: AgentWorkflow) => void;
}

export const ContextScopeBar: React.FC<ContextScopeBarProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  timeRangeDays,
  onSelectTimeRange,
  selectedSources,
  onToggleSource,
  selectedWorkflow,
  onSelectWorkflow,
}) => {
  const allSources: Array<{ id: SourceType; label: string }> = [
    { id: 'jira', label: 'Jira Tickets' },
    { id: 'git', label: 'Git Commits' },
    { id: 'adr', label: 'ADR Decisions' },
    { id: 'document', label: 'Architecture Docs' },
    { id: 'slack', label: 'Slack Channels' },
  ];

  const agentOptions: Array<{ id: AgentWorkflow | 'auto'; label: string }> = [
    { id: 'auto', label: 'Auto (Intent Routed)' },
    { id: 'manager', label: 'Manager Agent' },
    { id: 'project_intelligence', label: 'Project Specialist' },
    { id: 'risk_intelligence', label: 'Risk Specialist' },
    { id: 'decision_intelligence', label: 'Decision Specialist' },
  ];

  // Dynamically filter projects in the dropdown list based on active selected sources
  const filteredProjects = projects.filter((p) => {
    // Completely exclude any example projects
    if (p.name.toLowerCase().includes('(example)') || p.id === 'prj-sam1') {
      return false;
    }

    const nameLower = p.name.toLowerCase();
    const isJiraSelected = selectedSources.includes('jira');
    const isGitSelected = selectedSources.includes('git');

    // If both Jira and Git are selected or neither is selected, show all active non-example projects
    if ((isJiraSelected && isGitSelected) || (!isJiraSelected && !isGitSelected)) {
      return true;
    }

    // If only Jira is selected: show Jira projects
    if (isJiraSelected && !isGitSelected) {
      return nameLower.includes('jira') || nameLower.includes('kan') || p.id.includes('kan');
    }

    // If only Git is selected: show Git projects
    if (isGitSelected && !isJiraSelected) {
      return nameLower.includes('git') || nameLower.includes('github') || nameLower.includes('clara') || nameLower.includes('databricks') || p.id.includes('clara') || p.id.includes('databricks') || p.id.includes('ecb');
    }

    return true;
  });

  return (
    <div
      style={{
        background: 'rgba(13, 27, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.25rem',
      }}
    >
      {/* Left: Project & Temporal Scope */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Project Chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          <Layers size={15} color="#5ca8ff" />
          <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
            style={{
              background: 'rgba(7, 17, 31, 0.8)',
              border: '1px solid rgba(92, 168, 255, 0.3)',
              borderRadius: '6px',
              color: '#ffffff',
              padding: '0.25rem 0.5rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              outline: 'none',
            }}
          >
            <option value="all" style={{ background: '#07111f', color: '#ffffff' }}>
              All Connected Projects
            </option>
            {filteredProjects.map((p) => (
              <option key={p.id} value={p.id} style={{ background: '#07111f', color: '#ffffff' }}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Time Scope Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={14} color="#94a3b8" />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Temporal Scope:</span>
          {[7, 30, 90].map((days) => (
            <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
              key={days}
              onClick={() => onSelectTimeRange(days)}
              style={{
                background: timeRangeDays === days ? 'rgba(92, 168, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: timeRangeDays === days ? '1px solid #5ca8ff' : '1px solid rgba(255, 255, 255, 0.08)',
                color: timeRangeDays === days ? '#5ca8ff' : '#94a3b8',
                borderRadius: '6px',
                padding: '0.2rem 0.55rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {days}d
            </RippleButton>
          ))}
        </div>

        <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Source Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <Filter size={14} color="#94a3b8" />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Sources:</span>
          {allSources.map((src) => {
            const isSelected = selectedSources.includes(src.id);
            return (
              <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
                key={src.id}
                onClick={() => onToggleSource(src.id)}
                style={{
                  background: isSelected ? 'rgba(53, 208, 127, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1px solid rgba(53, 208, 127, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                  color: isSelected ? '#35d07f' : '#64748b',
                  borderRadius: '6px',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                {isSelected && <Check size={11} />}
                <span>{src.label}</span>
              </RippleButton>
            );
          })}
        </div>
      </div>

      {/* Right: Specialist Agent Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Bot size={15} color="#c084fc" />
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Agent:</span>
        <select
          value={selectedWorkflow || 'auto'}
          onChange={(e) => {
            const val = e.target.value;
            onSelectWorkflow(val === 'auto' ? undefined : (val as AgentWorkflow));
          }}
          style={{
            background: 'rgba(155, 124, 255, 0.15)',
            border: '1px solid rgba(155, 124, 255, 0.4)',
            borderRadius: '6px',
            color: '#e9d5ff',
            padding: '0.25rem 0.6rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {agentOptions.map((opt) => (
            <option key={opt.id} value={opt.id} style={{ background: '#07111f', color: '#ffffff' }}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
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
    { id: 'databricks', label: 'Databricks' },
  ];

  const agentOptions: Array<{ id: AgentWorkflow | 'auto'; label: string }> = [
    { id: 'auto', label: 'Auto (Intent Routed)' },
    { id: 'manager', label: 'Manager Agent' },
    { id: 'project_intelligence', label: 'Project Specialist' },
    { id: 'risk_intelligence', label: 'Risk Specialist' },
    { id: 'decision_intelligence', label: 'Decision Specialist' },
  ];

  const DEFAULT_DOCS: Project[] = [
    { id: 'doc-01_enterprise_context_brain_architecture', name: '📄 01 Enterprise Context Brain Architecture', code: 'DOC', description: '', status: 'on_track' as any, health_score: 100, owner_id: 'sys', owner_name: 'sys', target_completion_date: '', created_at: '', updated_at: '', active_risks_count: 0, open_tickets_count: 0, recent_decisions_count: 0, milestones: [] },
    { id: 'doc-02_databricks_mcp_agent_architecture', name: '📄 02 Databricks Agent MCP Architecture', code: 'DOC', description: '', status: 'on_track' as any, health_score: 100, owner_id: 'sys', owner_name: 'sys', target_completion_date: '', created_at: '', updated_at: '', active_risks_count: 0, open_tickets_count: 0, recent_decisions_count: 0, milestones: [] },
    { id: 'doc-03_airflow_mcp_openwebui_architecture', name: '📄 03 Airflow MCP OpenWebUI Architecture', code: 'DOC', description: '', status: 'on_track' as any, health_score: 100, owner_id: 'sys', owner_name: 'sys', target_completion_date: '', created_at: '', updated_at: '', active_risks_count: 0, open_tickets_count: 0, recent_decisions_count: 0, milestones: [] },
    { id: 'doc-04_virtual_receptionist_clara_bot_architecture', name: '📄 04 Virtual Receptionist Clara Bot Architecture', code: 'DOC', description: '', status: 'on_track' as any, health_score: 100, owner_id: 'sys', owner_name: 'sys', target_completion_date: '', created_at: '', updated_at: '', active_risks_count: 0, open_tickets_count: 0, recent_decisions_count: 0, milestones: [] },
    { id: 'doc-github_poc_master_architecture', name: '📄 GitHub POC Master Architecture', code: 'DOC', description: '', status: 'on_track' as any, health_score: 100, owner_id: 'sys', owner_name: 'sys', target_completion_date: '', created_at: '', updated_at: '', active_risks_count: 0, open_tickets_count: 0, recent_decisions_count: 0, milestones: [] },
  ];

  // Dynamically filter projects in the dropdown list based on active selected sources
  const filteredProjects = React.useMemo(() => {
    const isDocSelected = selectedSources.includes('document');
    const isJiraSelected = selectedSources.includes('jira');
    const isGitSelected = selectedSources.includes('git');
    const isDatabricksSelected = selectedSources.includes('databricks');
    const isOtherSourceSelected = isJiraSelected || isGitSelected || isDatabricksSelected;

    const baseList = projects.filter((p) => {
      // Completely exclude any example projects
      if (p.name.toLowerCase().includes('(example)') || p.id === 'prj-sam1') {
        return false;
      }

      const nameLower = p.name.toLowerCase();
      const isGitRepo = p.name.includes('/') || (p as any).source_type === 'github' || (p as any).source_type === 'git';

      // For Git repos: only include if active webhook connection
      if (isGitRepo) {
        const isWebhookActive = (p as any).webhook_status === 'active' || (p as any).is_connected === true;
        if ((p as any).webhook_status && !isWebhookActive) {
          return false;
        }
      }

      const sourceTypeRaw = ((p as any).source_type || '').toLowerCase();
      const isDatabricksProject = sourceTypeRaw === 'databricks';

      const relevantFilterActive = isJiraSelected || isGitSelected || isDatabricksSelected;

      if (!relevantFilterActive) {
        return true;
      }

      if (isJiraSelected && isGitSelected && isDatabricksSelected) {
        return true;
      }

      if (isJiraSelected && !isGitSelected && !isDatabricksSelected) {
        return nameLower.includes('jira') || nameLower.includes('kan') || p.id.includes('kan') || sourceTypeRaw === 'jira';
      }
      if (!isJiraSelected && isGitSelected && !isDatabricksSelected) {
        return isGitRepo || nameLower.includes('git') || nameLower.includes('github') || nameLower.includes('clara') || p.id.includes('clara') || p.id.includes('ecb');
      }
      if (!isJiraSelected && !isGitSelected && isDatabricksSelected) {
        return isDatabricksProject;
      }

      if (isJiraSelected && isGitSelected && !isDatabricksSelected) {
        const isJiraProject = nameLower.includes('jira') || nameLower.includes('kan') || p.id.includes('kan') || sourceTypeRaw === 'jira';
        return isJiraProject || isGitRepo;
      }
      if (isJiraSelected && !isGitSelected && isDatabricksSelected) {
        const isJiraProject = nameLower.includes('jira') || nameLower.includes('kan') || p.id.includes('kan') || sourceTypeRaw === 'jira';
        return isJiraProject || isDatabricksProject;
      }
      if (!isJiraSelected && isGitSelected && isDatabricksSelected) {
        return isGitRepo || isDatabricksProject;
      }

      return true;
    });

    const combined = isDocSelected
      ? (isOtherSourceSelected ? [...DEFAULT_DOCS, ...baseList] : DEFAULT_DOCS)
      : baseList;

    // Deduplicate options by id and normalized name
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    return combined.filter((p) => {
      const normName = p.name.trim().toLowerCase();
      if (seenIds.has(p.id) || seenNames.has(normName)) return false;
      seenIds.add(p.id);
      seenNames.add(normName);
      return true;
    });
  }, [projects, selectedSources]);

  return (
    <div
      className="glass-panel"
      style={{
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
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--fs-xs)' }}>
        {/* Project Chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          <Layers size={15} color="#6366f1" />
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-medium)',
              borderRadius:'var(--radius-sm)',
              color: 'var(--text-primary)',
              padding: '0.25rem 0.5rem',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              outline: 'none',
            }}
          >
            <option value="all">All Connected Projects</option>
            {filteredProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />

        {/* Time Scope Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={14} color="#94a3b8" />
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>Temporal Scope:</span>
          {[7, 30, 90].map((days) => (
            <RippleButton rippleColor="rgba(99,102,241,0.2)" duration="600ms"
              key={days}
              onClick={() => onSelectTimeRange(days)}
              style={{
                background: timeRangeDays === days ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-input)',
                border: timeRangeDays === days ? '1.5px solid #6366f1' : '1px solid var(--border-subtle)',
                color: timeRangeDays === days ? '#6366f1' : 'var(--text-muted)',
                borderRadius:'var(--radius-sm)',
                padding: '0.2rem 0.55rem',
                fontSize: 'var(--fs-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: timeRangeDays === days ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none',
              }}
            >
              {days}d
            </RippleButton>
          ))}
        </div>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />

        {/* Source Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <Filter size={14} color="#94a3b8" />
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>Sources:</span>
          {allSources.map((src) => {
            const isSelected = selectedSources.includes(src.id);
            return (
              <RippleButton rippleColor="rgba(99,102,241,0.2)" duration="600ms"
                key={src.id}
                onClick={() => onToggleSource(src.id)}
                style={{
                  background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-input)',
                  border: isSelected ? '1.5px solid rgba(99, 102, 241, 0.45)' : '1px solid var(--border-subtle)',
                  color: isSelected ? '#6366f1' : 'var(--text-muted)',
                  borderRadius:'var(--radius-sm)',
                  padding: '0.2rem 0.5rem',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: isSelected ? '0 0 0 3px rgba(99, 102, 241, 0.08)' : 'none',
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
        <Bot size={15} color="#8b5cf6" />
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>Agent:</span>
        <select
          value={selectedWorkflow || 'auto'}
          onChange={(e) => {
            const val = e.target.value;
            onSelectWorkflow(val === 'auto' ? undefined : (val as AgentWorkflow));
          }}
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius:'var(--radius-sm)',
            color: '#6366f1',
            padding: '0.25rem 0.6rem',
            fontSize: 'var(--fs-xs)',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {agentOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
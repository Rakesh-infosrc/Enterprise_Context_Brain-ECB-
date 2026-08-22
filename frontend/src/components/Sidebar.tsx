// frontend/src/components/Sidebar.tsx

import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Layers,
  ShieldAlert,
  GitPullRequest,
  FileSearch,
  CheckCircle2,
  Activity,
  Award,
  Settings,
  BrainCircuit,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

export type NavItem =
  | 'command_center'
  | 'ask_ecb'
  | 'project_intelligence'
  | 'risk_intelligence'
  | 'decision_intelligence'
  | 'evidence_explorer'
  | 'skills_mem0'
  | 'approval_center'
  | 'agent_trace'
  | 'ai_eval'
  | 'settings';

interface SidebarProps {
  activeView: NavItem;
  onSelectView: (view: NavItem) => void;
  pendingApprovalsCount: number;
  openRisksCount: number;
  userMode?: 'guided' | 'pro';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  pendingApprovalsCount,
  openRisksCount,
  userMode = 'guided',
}) => {
  const coreNavItems = [
    { id: 'command_center' as NavItem, label: 'Command Center', icon: LayoutDashboard },
    { id: 'ask_ecb' as NavItem, label: 'Ask ECB (AI Console)', icon: Sparkles, isPrimaryAi: true },
    { id: 'project_intelligence' as NavItem, label: 'Project Intelligence', icon: Layers },
    { id: 'risk_intelligence' as NavItem, label: 'Risk Intelligence', icon: ShieldAlert, badge: openRisksCount, badgeColor: '#fb923c' },
    { id: 'decision_intelligence' as NavItem, label: 'Decision Intelligence', icon: GitPullRequest },
    { id: 'approval_center' as NavItem, label: 'Approval Center', icon: CheckCircle2, badge: pendingApprovalsCount, badgeColor: '#5ca8ff' },
  ];

  const advancedNavItems = [
    { id: 'evidence_explorer' as NavItem, label: 'Evidence Explorer', icon: FileSearch },
    { id: 'skills_mem0' as NavItem, label: 'Skills & Mem0 Memory', icon: BookOpen },
    { id: 'agent_trace' as NavItem, label: 'LangGraph DAG Trace', icon: Activity },
    { id: 'ai_eval' as NavItem, label: 'AI Evaluation Suite', icon: Award },
    { id: 'settings' as NavItem, label: 'Settings & Connectors', icon: Settings },
  ];

  return (
    <aside
      style={{
        width: '265px',
        minWidth: '265px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(7, 17, 31, 0.88)',
        backdropFilter: 'blur(24px)',
        padding: '1.25rem 0.85rem',
        zIndex: 40,
        overflowY: 'auto',
      }}
    >
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.65rem', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #5ca8ff 0%, #9b7cff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 18px rgba(92, 168, 255, 0.45)',
          }}
        >
          <BrainCircuit size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>ECB</span>
            <span
              style={{
                fontSize: '0.65rem',
                padding: '0.1rem 0.35rem',
                background: 'rgba(92, 168, 255, 0.2)',
                color: '#5ca8ff',
                borderRadius: '4px',
                border: '1px solid rgba(92, 168, 255, 0.4)',
                fontWeight: 700,
              }}
            >
              v2.2
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>Enterprise Context Brain</div>
        </div>
      </div>

      {/* Core Insights Section */}
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.65rem', marginBottom: '0.4rem' }}>
        Core Workflows
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1.25rem' }}>
        {coreNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                background: isActive
                  ? item.isPrimaryAi
                    ? 'linear-gradient(90deg, rgba(155, 124, 255, 0.25) 0%, rgba(92, 168, 255, 0.18) 100%)'
                    : 'rgba(92, 168, 255, 0.14)'
                  : 'transparent',
                border: isActive
                  ? item.isPrimaryAi
                    ? '1px solid rgba(155, 124, 255, 0.45)'
                    : '1px solid rgba(92, 168, 255, 0.35)'
                  : '1px solid transparent',
                color: isActive ? (item.isPrimaryAi ? '#c084fc' : '#ffffff') : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon
                  size={18}
                  color={isActive ? (item.isPrimaryAi ? '#c084fc' : '#5ca8ff') : '#64748b'}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    background: item.badgeColor || '#5ca8ff',
                    color: '#07111f',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Advanced & Observability Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.65rem', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Deep Diagnostics
        </span>
        {userMode === 'guided' && (
          <span style={{ fontSize: '0.65rem', color: '#5ca8ff' }}>Pro</span>
        )}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
        {advancedNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.85rem',
                borderRadius: '10px',
                background: isActive ? 'rgba(92, 168, 255, 0.14)' : 'transparent',
                border: isActive ? '1px solid rgba(92, 168, 255, 0.35)' : '1px solid transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
                fontSize: '0.825rem',
                fontWeight: isActive ? 700 : 500,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={17} color={isActive ? '#5ca8ff' : '#64748b'} />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* System Status Banner */}
      <div
        style={{
          marginTop: 'auto',
          padding: '0.85rem',
          borderRadius: '12px',
          background: 'rgba(13, 27, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>LangGraph Engine</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: '#35d07f', fontWeight: 700 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#35d07f', display: 'inline-block' }} />
            Active
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          Llama Guard 3 • Mem0 • Qdrant
        </div>
      </div>
    </aside>
  );
};

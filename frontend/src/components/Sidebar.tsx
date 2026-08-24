// frontend/src/components/Sidebar.tsx

import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Layers,
  ShieldAlert,
  GitPullRequest,
  FileSearch,
  Database,
  CheckCircle2,
  Activity,
  Award,
  Settings,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { ECBKineticBrand } from './ECBKineticBrand';
import { RippleButton } from "@/components/ui/ripple-button";

export type NavItem =
  | 'command_center'
  | 'ask_ecb'
  | 'project_intelligence'
  | 'risk_intelligence'
  | 'contradictions'
  | 'decision_intelligence'
  | 'evidence_explorer'
  | 'mcp_dataset'
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
    { id: 'contradictions' as NavItem, label: 'Timeline Contradictions', icon: ShieldAlert, badge: 3, badgeColor: '#ef4444' },
    { id: 'decision_intelligence' as NavItem, label: 'Decision Intelligence', icon: GitPullRequest },
    { id: 'approval_center' as NavItem, label: 'Approval Center', icon: CheckCircle2, badge: pendingApprovalsCount, badgeColor: '#5ca8ff' },
  ];

  const deepDiagnosticsItems = [
    { id: 'evidence_explorer' as NavItem, label: 'Evidence Explorer', icon: FileSearch },
    { id: 'mcp_dataset' as NavItem, label: 'MCP LLM Training Datasets', icon: Database, badge: '92%', badgeColor: '#35d07f' },
    { id: 'skills_mem0' as NavItem, label: 'Skills & Mem0 Memory', icon: BookOpen },
    { id: 'agent_trace' as NavItem, label: 'LangGraph DAG Trace', icon: Activity },
    { id: 'ai_eval' as NavItem, label: 'AI Evaluation Suite', icon: Award },
  ];

  const settingsItem = { id: 'settings' as NavItem, label: 'Settings & Connectors', icon: Settings };

  return (
    <aside
      className="ecb-sidebar"
      style={{
        width: '265px',
        minWidth: '265px',
        height: '100dvh',
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(7, 17, 31, 0.88)',
        backdropFilter: 'blur(24px)',
        padding: '1.25rem 0.85rem',
        paddingBottom: '1rem',
        zIndex: 40,
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehavior: 'contain',
        scrollbarWidth: 'thin',
      }}
    >
      {/* Brand Header — Kinetic ECB POC (v2.2 removed) */}
      <div style={{ padding: '0.35rem 0.45rem', marginBottom: '1.35rem' }}>
        <ECBKineticBrand size="md" showIcon={true} showSublabel={true} />
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
            <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className="ecb-nav-btn"
              data-active={isActive}
              data-variant={item.isPrimaryAi ? 'ai' : undefined}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                <Icon
                  size={18}
                  color={isActive ? (item.isPrimaryAi ? '#c084fc' : '#5ca8ff') : '#64748b'}
                  style={{ flexShrink: 0 } as React.CSSProperties}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
              </div>
              {(item as any).badge !== undefined && (item as any).badge !== null && (typeof (item as any).badge === 'string' ? String((item as any).badge).length > 0 : Number((item as any).badge) > 0) && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    background: (item as any).badgeColor || '#5ca8ff',
                    color: '#07111f',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {(item as any).badge}
                </span>
              )}
            </RippleButton>
          );
        })}
      </nav>

      {/* Advanced & Observability Section — hidden in Guided View */}
      {userMode === 'pro' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.65rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Deep Diagnostics
            </span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
            {deepDiagnosticsItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className="ecb-nav-btn"
              data-active={isActive}
              style={{ fontSize: '0.825rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                <Icon size={17} color={isActive ? '#5ca8ff' : '#64748b'} style={{ flexShrink: 0 } as React.CSSProperties} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{item.label}</span>
              </div>
              {/* @ts-ignore - badge may be string like '92%' */}
              {(item as any).badge !== undefined && (item as any).badge !== null && (typeof (item as any).badge === 'string' ? String((item as any).badge).length > 0 : Number((item as any).badge) > 0) && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    background: (item as any).badgeColor || '#5ca8ff',
                    color: '#07111f',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    marginLeft: '0.5rem',
                  }}
                >
                  {(item as any).badge}
                </span>
              )}
            </RippleButton>
          );
            })}
          </nav>
        </>
      )}

      {/* Settings — always visible even in Guided View */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.75rem' }}>
        {(() => {
          const Icon = settingsItem.icon;
          const isActive = activeView === settingsItem.id;
          return (
            <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
              key={settingsItem.id}
              onClick={() => onSelectView(settingsItem.id)}
              className="ecb-nav-btn"
              data-active={isActive}
              style={{ fontSize: '0.825rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                <Icon size={17} color={isActive ? '#5ca8ff' : '#64748b'} style={{ flexShrink: 0 } as React.CSSProperties} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{settingsItem.label}</span>
              </div>
            </RippleButton>
          );
        })()}
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
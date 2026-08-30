// frontend/src/App.tsx

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Sidebar, NavItem } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { OnboardingTour } from './components/OnboardingTour';

// Code-split heavy views — initial paint only needs CommandCenter
const CommandCenterView = lazy(() => import('./components/views/CommandCenterView').then(m => ({ default: m.CommandCenterView })));
const AskECBView = lazy(() => import('./components/views/AskECBView').then(m => ({ default: m.AskECBView })));
const ProjectIntelligenceView = lazy(() => import('./components/views/ProjectIntelligenceView').then(m => ({ default: m.ProjectIntelligenceView })));
const DeveloperDiagnosticsView = lazy(() => import('./components/views/DeveloperDiagnosticsView').then(m => ({ default: m.DeveloperDiagnosticsView })));
const ApprovalCenterView = lazy(() => import('./components/views/ApprovalCenterView').then(m => ({ default: m.ApprovalCenterView })));
const SettingsView = lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));

const ViewFallback: React.FC = () => (
  <div style={{ padding: '2rem' }}>
    <div className="skeleton-shimmer" style={{ height: '18px', width: '40%', marginBottom: '1rem' }} />
    <div className="skeleton-shimmer" style={{ height: '12px', width: '100%', marginBottom: '0.6rem' }} />
    <div className="skeleton-shimmer" style={{ height: '12px', width: '92%' }} />
  </div>
);

import { Project, Risk, Decision, Evidence, ActionPreview, AgentRun, DashboardStats } from './types';
import { api } from './lib/api';
import { LightRays } from './components/ui/light-rays';

export function App() {
  const [activeView, setActiveView] = useState<NavItem>('command_center');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [userMode, setUserMode] = useState<'guided' | 'pro'>(() => {
    return (localStorage.getItem('ecb_user_mode') as 'guided' | 'pro') || 'guided';
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = (localStorage.getItem('ecb_theme') as 'dark' | 'light') || (localStorage.getItem('theme') as 'dark' | 'light');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // localStorage blocked (private mode) — fall through to system preference
    }
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
      }
    } catch {}
    // Default to dark for ECB's signature glass aesthetic
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    try {
      if (theme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light-mode');
        body.classList.add('light-mode');
        body.classList.remove('dark');
        root.style.colorScheme = 'light';
      } else {
        root.classList.add('dark');
        root.classList.remove('light-mode');
        body.classList.remove('light-mode');
        body.classList.remove('dark');
        // body dark class not needed but keep for compat
        root.style.colorScheme = 'dark';
      }
      localStorage.setItem('ecb_theme', theme);
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.warn('Theme persistence blocked:', e);
    }
  }, [theme]);

  // Respect system prefers-color-scheme when no explicit user choice exists
  useEffect(() => {
    let hasExplicit = false;
    try {
      hasExplicit = !!localStorage.getItem('ecb_theme') || !!localStorage.getItem('theme');
    } catch {}
    if (hasExplicit) return;
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mql) return;
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const next = (e as MediaQueryListEvent).matches ? 'dark' : 'light';
      setTheme(next as 'dark' | 'light');
    };
    // Modern browsers
    try {
      mql.addEventListener('change', onChange as (e: Event) => void);
      return () => mql.removeEventListener('change', onChange as (e: Event) => void);
    } catch {
      // Safari fallback
      // @ts-ignore
      mql.addListener(onChange);
      // @ts-ignore
      return () => mql.removeListener(onChange);
    }
  }, []);

  const handleThemeChange = (next: 'light' | 'dark') => {
    try {
      setTheme(next);
    } catch (e) {
      console.error('Theme change failed:', e);
    }
  };

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mql.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    } catch {}
  }, []);

  const [promptToAsk, setPromptToAsk] = useState<string>('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('prj-kan');

  // POC visibility: disconnected webhooks are hidden from main app (persisted)
  const [hiddenWebhookIds, setHiddenWebhookIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('ecb_hidden_webhooks');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    const syncHidden = () => {
      try {
        const raw = localStorage.getItem('ecb_hidden_webhooks');
        setHiddenWebhookIds(raw ? (JSON.parse(raw) as string[]) : []);
      } catch {}
    };
    window.addEventListener('ecb_hidden_webhooks_changed', syncHidden);
    window.addEventListener('storage', syncHidden);
    return () => {
      window.removeEventListener('ecb_hidden_webhooks_changed', syncHidden);
      window.removeEventListener('storage', syncHidden);
    };
  }, []);
  const visibleProjects = React.useMemo(() => {
    const filtered = projects.filter((p: any) => {
      if (hiddenWebhookIds.includes(p.id)) return false;
      const isGitRepo = typeof p.name === 'string' && (p.name.includes('/') || p.source_type === 'github' || p.source_type === 'git');
      if (isGitRepo) {
        if (p.webhook_status && p.webhook_status !== 'active') return false;
      }
      return true;
    });

    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    return filtered.filter((p: any) => {
      const normName = typeof p.name === 'string' ? p.name.trim().toLowerCase() : p.id;
      if (seenIds.has(p.id) || seenNames.has(normName)) return false;
      seenIds.add(p.id);
      seenNames.add(normName);
      return true;
    });
  }, [projects, hiddenWebhookIds]);
  // If active project was disconnected, auto-switch to first visible
  useEffect(() => {
    if (hiddenWebhookIds.includes(activeProjectId)) {
      const fallback = visibleProjects[0] || projects.find((p: any) => typeof p.name === 'string' && !p.name.includes('/')) || projects[0];
      if (fallback && fallback.id !== activeProjectId) setActiveProjectId(fallback.id);
    }
  }, [hiddenWebhookIds, activeProjectId, visibleProjects, projects]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [actions, setActions] = useState<ActionPreview[]>([]);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const loadData = async () => {
    try {
      const [projData, riskData, decData, eviData, actData, runsData, statsData] = await Promise.allSettled([
        api.getProjects(),
        api.getRisks(),
        api.getDecisions(),
        api.getEvidenceList(),
        api.getActions(),
        api.getAgentRuns(),
        api.getStats(),
      ]);

      if (projData.status === 'fulfilled') {
        setProjects(projData.value);
        if (projData.value.length > 0) {
          setActiveProjectId((prev) => {
            if (!projData.value.some((p: Project) => p.id === prev)) {
              return projData.value[0].id;
            }
            return prev;
          });
        }
      }
      if (riskData.status === 'fulfilled') setRisks(riskData.value);
      if (decData.status === 'fulfilled') setDecisions(decData.value);
      if (eviData.status === 'fulfilled') setEvidenceList(eviData.value);
      if (actData.status === 'fulfilled') setActions(actData.value);
      if (runsData.status === 'fulfilled') setAgentRuns(runsData.value);
      if (statsData.status === 'fulfilled') setStats(statsData.value);
    } catch (e) {
      console.error('Failed to load initial data from API:', e);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  // Visibility-aware polling with backoff, no fetch when tab hidden
  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    const schedule = (delay = 10000) => {
      if (cancelled) return;
      timeoutId = window.setTimeout(async () => {
        if (cancelled) return;
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
          schedule(delay);
          return;
        }
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          schedule(delay);
          return;
        }
        try {
          await loadData();
        } catch {}
        if (!cancelled) schedule(10000);
      }, delay);
    };

    loadData();
    schedule(10000);

    const onVisible = () => {
      if (document.visibilityState === 'visible' && !cancelled) {
        loadData();
      }
    };
    const onOnline = () => {
      if (!cancelled) loadData();
    };
    const onReload = () => {
      if (!cancelled) loadData();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    window.addEventListener('ecb-reload-data', onReload);
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('ecb-reload-data', onReload);
    };
  }, []);

  const handleToggleUserMode = () => {
    const nextMode = userMode === 'guided' ? 'pro' : 'guided';
    setUserMode(nextMode);
    localStorage.setItem('ecb_user_mode', nextMode);
  };

  // Guided View: hide Deep Diagnostics — auto-redirect if active view is a deep diagnostics view (Settings stays visible)
  useEffect(() => {
    if (userMode === 'guided') {
      const deepViews: NavItem[] = ['developer_diagnostics'];
      if (deepViews.includes(activeView)) {
        setActiveView('command_center');
      }
    }
  }, [userMode, activeView]);

  const handleAskQuestionFromAnywhere = (question: string) => {
    setPromptToAsk(question);
    setActiveView('ask_ecb');
  };

  const pendingApprovalsCount = actions.filter((a) => a.status === 'pending_approval').length;
  const openRisksCount = risks.filter((r) => r.status !== 'resolved').length;
  const currentProject = visibleProjects.find((p) => p.id === activeProjectId) || visibleProjects[0] || projects.find((p) => p.id === activeProjectId) || projects[0];

  const getViewTitle = () => {
    switch (activeView) {
      case 'command_center':
        return { title: 'Command Center', subtitle: 'Portfolio health, changes, approvals & executive overview' };
      case 'ask_ecb':
        return { title: 'Ask ECB — AI Command Center', subtitle: 'LangGraph stateful workflow with Llama Guard 3, Qdrant & CoVe verification' };
      case 'project_intelligence':
        return { title: 'Project Intelligence Hub', subtitle: 'Milestones, sprint logs, risks heatmap, ADRs & timeline contradictions' };
      case 'approval_center':
        return { title: 'Governed Approval Center', subtitle: 'Human-in-the-Loop review for high-impact MCP mutations' };
      case 'developer_diagnostics':
        return { title: 'Developer Diagnostics Console', subtitle: 'LangGraph execution DAG traces, memories manifest & AI benchmarks runner' };
      case 'settings':
        return { title: 'Settings & Connectors', subtitle: 'Source connectors, policy profiles & model gateway' };
      default:
        return { title: 'Enterprise Context Brain', subtitle: '' };
    }
  };

  const { title, subtitle } = getViewTitle();

  return (
    <div className="ecb-app-root" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', isolation: 'isolate', overflowX: 'hidden', overflowY: 'visible' }}>
      {/* Multicolor linear gradation + Light Rays — dark only, respects reduced-motion */}
      {theme === 'dark' && !prefersReducedMotion && (
        <>
          {/* Base multicolor wash */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              background:
                'linear-gradient(135deg, rgba(99,102,241,0.16) 0%, transparent 38%, rgba(59,130,246,0.13) 52%, transparent 78%, rgba(6,182,212,0.11) 100%)',
              opacity: 1,
            }}
          />
          <LightRays
            count={9}
            color="rgba(99, 102, 241, 0.34)"
            blur={22}
            speed={11}
            length="98vh"
            className="opacity-100"
            style={{ zIndex: 0 } as React.CSSProperties}
          />
          <LightRays
            count={6}
            color="rgba(59, 130, 246, 0.30)"
            blur={24}
            speed={14}
            length="92vh"
            className="opacity-95"
            style={{ zIndex: 0, transform: 'translateX(14%)' } as React.CSSProperties}
          />
          <LightRays
            count={5}
            color="rgba(6, 182, 212, 0.24)"
            blur={26}
            speed={13}
            length="88vh"
            className="opacity-90"
            style={{ zIndex: 0, transform: 'translateX(-12%)' } as React.CSSProperties}
          />
        </>
      )}
      {/* Navigation Sidebar */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        pendingApprovalsCount={pendingApprovalsCount}
        openRisksCount={openRisksCount}
        userMode={userMode}
      />

      {/* Main Content Area — above Light Rays */}
      <div className="ecb-main-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 1, height: '100dvh', overflowY: 'auto', overflowX: 'hidden', scrollbarGutter: 'stable' } as React.CSSProperties}>
        {/* Top Header — hidden webhooks filtered from POC */}
        <Header
          title={title}
          subtitle={subtitle}
          projects={visibleProjects}
          activeProjectId={activeProjectId}
          onSelectProject={setActiveProjectId}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenAskEcb={() => setActiveView('ask_ecb')}
          userMode={userMode}
          onToggleUserMode={handleToggleUserMode}
          onStartTour={() => setIsTourOpen(true)}
          theme={theme}
          onThemeChange={handleThemeChange}
        />

        {/* View Router — lazy with Suspense */}
        <main style={{ flex: 1, padding: '1.75rem 2rem' }}>
          <Suspense fallback={<ViewFallback />}>
            {activeView === 'command_center' && (
              <CommandCenterView
                stats={stats}
                projects={visibleProjects}
                risks={risks}
                decisions={decisions}
                onSelectView={setActiveView}
                onAskQuestion={handleAskQuestionFromAnywhere}
                onStartTour={() => setIsTourOpen(true)}
              />
            )}

            {activeView === 'ask_ecb' && (
              <AskECBView
                projects={visibleProjects}
                activeProjectId={activeProjectId}
                onSelectProject={setActiveProjectId}
                initialQuestion={promptToAsk}
                onSelectView={setActiveView}
                onRefreshStats={loadData}
              />
            )}

            {activeView === 'project_intelligence' && currentProject && (
              <ProjectIntelligenceView
                project={currentProject}
                evidenceList={evidenceList}
                risks={risks}
                decisions={decisions}
                onAskQuestion={handleAskQuestionFromAnywhere}
              />
            )}

            {activeView === 'approval_center' && (
              <ApprovalCenterView actions={actions} onRefresh={loadData} />
            )}

            {activeView === 'developer_diagnostics' && (
              <DeveloperDiagnosticsView
                evidenceList={evidenceList}
                agentRuns={agentRuns}
              />
            )}

            {activeView === 'settings' && <SettingsView />}
          </Suspense>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectView={setActiveView}
        onAskQuestion={handleAskQuestionFromAnywhere}
      />

      {/* Interactive Guided Onboarding Tour Modal */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateToAsk={() => setActiveView('ask_ecb')}
      />
    </div>
  );
}

export default App;

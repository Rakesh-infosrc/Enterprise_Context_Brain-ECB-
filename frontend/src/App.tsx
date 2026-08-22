// frontend/src/App.tsx

import React, { useState, useEffect } from 'react';
import { Sidebar, NavItem } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { OnboardingTour } from './components/OnboardingTour';
import { CommandCenterView } from './components/views/CommandCenterView';
import { AskECBView } from './components/views/AskECBView';
import { ProjectIntelligenceView } from './components/views/ProjectIntelligenceView';
import { RiskIntelligenceView } from './components/views/RiskIntelligenceView';
import { DecisionIntelligenceView } from './components/views/DecisionIntelligenceView';
import { EvidenceExplorerView } from './components/views/EvidenceExplorerView';
import { SkillsMem0View } from './components/views/SkillsMem0View';
import { ApprovalCenterView } from './components/views/ApprovalCenterView';
import { AgentTraceView } from './components/views/AgentTraceView';
import { AiEvaluationView } from './components/views/AiEvaluationView';
import { SettingsView } from './components/views/SettingsView';

import { Project, Risk, Decision, Evidence, ActionPreview, AgentRun, DashboardStats } from './types';
import { api } from './lib/api';

export function App() {
  const [activeView, setActiveView] = useState<NavItem>('command_center');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [userMode, setUserMode] = useState<'guided' | 'pro'>(() => {
    return (localStorage.getItem('ecb_user_mode') as 'guided' | 'pro') || 'guided';
  });

  const [promptToAsk, setPromptToAsk] = useState<string>('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('prj-aegis');
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

      if (projData.status === 'fulfilled') setProjects(projData.value);
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

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s polling for background updates
    return () => clearInterval(interval);
  }, []);

  const handleToggleUserMode = () => {
    const nextMode = userMode === 'guided' ? 'pro' : 'guided';
    setUserMode(nextMode);
    localStorage.setItem('ecb_user_mode', nextMode);
  };

  const handleAskQuestionFromAnywhere = (question: string) => {
    setPromptToAsk(question);
    setActiveView('ask_ecb');
  };

  const pendingApprovalsCount = actions.filter((a) => a.status === 'pending_approval').length;
  const openRisksCount = risks.filter((r) => r.status !== 'resolved').length;
  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const getViewTitle = () => {
    switch (activeView) {
      case 'command_center':
        return { title: 'Command Center', subtitle: 'Portfolio health, changes, approvals & executive overview' };
      case 'ask_ecb':
        return { title: 'Ask ECB — AI Command Center', subtitle: 'LangGraph stateful workflow with Llama Guard 3, Qdrant & CoVe verification' };
      case 'project_intelligence':
        return { title: 'Project Intelligence', subtitle: 'Milestones, Gantt progress, blocker root causes & velocity' };
      case 'risk_intelligence':
        return { title: 'Risk Intelligence', subtitle: '5x5 Likelihood vs Impact Matrix & governed mitigations' };
      case 'decision_intelligence':
        return { title: 'Decision Intelligence', subtitle: 'Architecture Decision Records, supersession trees & trade-offs' };
      case 'evidence_explorer':
        return { title: 'Evidence Explorer', subtitle: 'Multi-source search with provenance, freshness & contradiction badges' };
      case 'skills_mem0':
        return { title: 'Skills & Mem0 Memory', subtitle: 'Modular SKILL.md playbooks, dynamic Mem0 memory ledger & Qdrant vectors' };
      case 'approval_center':
        return { title: 'Governed Approval Center', subtitle: 'Human-in-the-Loop review for high-impact MCP mutations' };
      case 'agent_trace':
        return { title: 'Agent Trace & Observability', subtitle: 'OpenTelemetry execution DAG waterfall & token latency metrics' };
      case 'ai_eval':
        return { title: 'AI Evaluation Suite', subtitle: 'Golden benchmark dataset test runner & release gates' };
      case 'settings':
        return { title: 'Settings & Connectors', subtitle: 'Source connectors, policy profiles & model gateway' };
      default:
        return { title: 'Enterprise Context Brain', subtitle: '' };
    }
  };

  const { title, subtitle } = getViewTitle();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07111f' }}>
      {/* Navigation Sidebar */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        pendingApprovalsCount={pendingApprovalsCount}
        openRisksCount={openRisksCount}
        userMode={userMode}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <Header
          title={title}
          subtitle={subtitle}
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={setActiveProjectId}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenAskEcb={() => setActiveView('ask_ecb')}
          userMode={userMode}
          onToggleUserMode={handleToggleUserMode}
          onStartTour={() => setIsTourOpen(true)}
        />

        {/* View Router */}
        <main style={{ flex: 1, padding: '1.75rem 2rem', overflowY: 'auto' }}>
          {activeView === 'command_center' && (
            <CommandCenterView
              stats={stats}
              projects={projects}
              risks={risks}
              decisions={decisions}
              onSelectView={setActiveView}
              onAskQuestion={handleAskQuestionFromAnywhere}
              onStartTour={() => setIsTourOpen(true)}
            />
          )}

          {activeView === 'ask_ecb' && (
            <AskECBView
              projects={projects}
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
              evidenceList={evidenceList.filter((e) => e.project_id === activeProjectId)}
              onAskQuestion={handleAskQuestionFromAnywhere}
            />
          )}

          {activeView === 'risk_intelligence' && (
            <RiskIntelligenceView
              risks={risks}
              onAskQuestion={handleAskQuestionFromAnywhere}
            />
          )}

          {activeView === 'decision_intelligence' && (
            <DecisionIntelligenceView
              decisions={decisions}
              onAskQuestion={handleAskQuestionFromAnywhere}
            />
          )}

          {activeView === 'evidence_explorer' && (
            <EvidenceExplorerView evidenceList={evidenceList} />
          )}

          {activeView === 'skills_mem0' && <SkillsMem0View />}

          {activeView === 'approval_center' && (
            <ApprovalCenterView actions={actions} onRefresh={loadData} />
          )}

          {activeView === 'agent_trace' && (
            <AgentTraceView agentRuns={agentRuns} />
          )}

          {activeView === 'ai_eval' && <AiEvaluationView />}

          {activeView === 'settings' && <SettingsView />}
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

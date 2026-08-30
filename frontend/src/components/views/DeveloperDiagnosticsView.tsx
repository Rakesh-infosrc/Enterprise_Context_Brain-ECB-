// frontend/src/components/views/DeveloperDiagnosticsView.tsx

import React, { useState, useEffect } from 'react';
import {
  Activity,
  BookOpen,
  BrainCircuit,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Shield,
  Clock,
  CheckCircle2,
  Search,
  Download,
  Lock,
  GitBranch,
  FolderGit2,
  RefreshCw,
  FileCode2,
  ShieldCheck,
  Zap,
  Award,
  Play,
  FileSearch,
  User,
  GitCommit,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import { AgentRun, AgentStep, Evidence, SkillMetadata, Mem0MemoryItem, BenchmarkSummary } from '../../types';
import { api } from '../../lib/api';
import { RippleButton } from "@/components/ui/ripple-button";

interface DeveloperDiagnosticsViewProps {
  evidenceList: Evidence[];
  agentRuns: AgentRun[];
}

export const DeveloperDiagnosticsView: React.FC<DeveloperDiagnosticsViewProps> = ({
  evidenceList,
  agentRuns,
}) => {
  const [activeTab, setActiveTab] = useState<'traces' | 'skills_memory' | 'evidence' | 'mcp' | 'eval'>('traces');

  // --- Sub-states for Traces Tab ---
  const visibleRuns = React.useMemo(() => {
    // Hide incomplete/buggy runs (0ms + no steps) and dedupe identical query bursts within 2s
    const valid = agentRuns.filter(r => r.steps && r.steps.length > 0 && (r.latency_ms||0) > 0);
    const base = valid.length > 0 ? valid : agentRuns;
    const seen = new Set<string>();
    return base.filter(r => {
      const key = `${r.trace_id}-${r.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [agentRuns]);
  const [selectedRun, setSelectedRun] = useState<AgentRun | null>(visibleRuns[0] || agentRuns[0] || null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));
  React.useEffect(() => { if (visibleRuns.length && !visibleRuns.find(v=>v.id===selectedRun?.id)) { setSelectedRun(visibleRuns[0]); setExpandedSteps(new Set([0])); } }, [visibleRuns]);
  React.useEffect(() => { setExpandedSteps(new Set([0])); }, [selectedRun?.id]);
  const handleDeleteLog = async (runId: string) => {
    if (!confirm('Delete this trace log? Blocked if linked Mem0 history still exists (delete from Mem0 Memory Logs first).')) return;
    try {
      await api.deleteAgentRun(runId);
      // Optimistic update — hide from UI; parent will refresh on next load
      const next = visibleRuns.find(r => r.id !== runId);
      if (next) setSelectedRun(next);
      alert('Log deleted.');
      // Force reload of page data if parent exposes refresh — fallback reload
      window.location.reload();
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('409') || msg.includes('Cannot delete log')) {
        alert('Blocked: ' + msg + '\n\nDelete the linked Mem0 history for this project first (Skills & Memories → Mem0 Memory Logs).');
      } else {
        alert('Delete failed: ' + msg);
      }
    }
  };

  // --- Sub-states for Skills & Memories Tab ---
  const [activeSubTab, setActiveSubTab] = useState<'skills' | 'mem0' | 'qdrant'>('skills');
  const [skills, setSkills] = useState<SkillMetadata[]>([]);
  const [memories, setMemories] = useState<Mem0MemoryItem[]>([]);
  const [qdrantStats, setQdrantStats] = useState<any>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillMetadata | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSkill, setEditingSkill] = useState<SkillMetadata | null>(null);
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [skillForm, setSkillForm] = useState({ name: '', description: '', version: '1.0.0', author: '', instructions: '' });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // --- Sub-states for Evidence Tab ---
  const [evidenceSearch, setEvidenceSearch] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);

  // --- Sub-states for MCP datasets Tab ---
  const [activeMcpTab, setActiveMcpTab] = useState<'git' | 'jira'>('git');
  const [coverageData, setCoverageData] = useState<any>(null);
  const [datasetRecords, setDatasetRecords] = useState<any[]>([]);
  const [mcpLoading, setMcpLoading] = useState<boolean>(false);

  // --- Sub-states for AI Evaluation Tab ---
  const [isEvalRunning, setIsEvalRunning] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkSummary | null>(null);

  // Load Skills, Memories, and Qdrant Stats
  useEffect(() => {
    api.getSkills().then((res) => {
      setSkills(res);
      if (res.length > 0) setSelectedSkill(res[0]);
    }).catch(console.error);

    api.getMem0Memories().then(setMemories).catch(console.error);
    api.getQdrantStats().then(setQdrantStats).catch(console.error);
  }, []);

  const refreshSkills = () => {
    api.getSkills().then((res) => {
      setSkills(res);
      if (res.length > 0 && !selectedSkill) setSelectedSkill(res[0]);
    }).catch(console.error);
  };

  const handleSaveSkill = async () => {
    if (!editingSkill) return;
    try {
      const updated = await api.updateSkill(editingSkill.name, skillForm);
      setEditingSkill(null);
      setSkills(prev => prev.map(s => s.name === updated.name ? updated : s));
      setSelectedSkill(updated);
    } catch (e: any) { alert('Save failed: ' + (e?.message || '')); }
  };

  const handleCreateSkill = async () => {
    if (!skillForm.name || !skillForm.description) { alert('Name and description are required.'); return; }
    try {
      const created = await api.createSkill(skillForm);
      setIsCreatingSkill(false);
      setSkillForm({ name: '', description: '', version: '1.0.0', author: '', instructions: '' });
      refreshSkills();
      setSelectedSkill(created);
    } catch (e: any) { alert('Create failed: ' + (e?.message || '')); }
  };

  const handleDeleteSkill = async (name: string) => {
    if (!confirm(`Delete skill "${name}"? This removes the playbook permanently.`)) return;
    try {
      await api.deleteSkill(name);
      setSkills(prev => prev.filter(s => s.name !== name));
      if (selectedSkill?.name === name) setSelectedSkill(null);
      setEditingSkill(null);
    } catch (e: any) { alert('Delete failed: ' + (e?.message || '')); }
  };

  const handleUploadSkill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const created = await api.uploadSkill(file);
      refreshSkills();
      setSelectedSkill(created);
      alert(`Skill "${created.name}" uploaded successfully.`);
    } catch (e: any) { alert('Upload failed: ' + (e?.message || '')); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Load MCP Dataset records based on selected sub-tab
  const loadMcpData = async () => {
    setMcpLoading(true);
    try {
      const coverage = await api.getMcpCoverage();
      setCoverageData(coverage);

      if (activeMcpTab === 'git') {
        const gitRes = await api.getGitDataset();
        setDatasetRecords(gitRes.dataset || []);
      } else {
        const jiraRes = await api.getJiraDataset();
        setDatasetRecords(jiraRes.dataset || []);
      }
    } catch (err) {
      console.error('Error fetching MCP dataset view:', err);
    } finally {
      setMcpLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'mcp') {
      loadMcpData();
    }
  }, [activeTab, activeMcpTab]);

  const handleExportJsonl = () => {
    const jsonlString = datasetRecords.map((r) => JSON.stringify(r)).join('\n');
    const blob = new Blob([jsonlString], { type: 'application/x-jsonlines' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeMcpTab}_llm_training_dataset.jsonl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Run Benchmark suite
  const handleRunBenchmarks = async () => {
    setIsEvalRunning(true);
    try {
      const res = await api.runEvaluationSuite();
      setBenchmarkResult(res);
    } catch (err) {
      console.error('Failed to run benchmarks:', err);
    } finally {
      setIsEvalRunning(false);
    }
  };

  const filteredMemories = memories.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvidence = evidenceList.filter((e) =>
    e.source_title.toLowerCase().includes(evidenceSearch.toLowerCase()) ||
    e.excerpt.toLowerCase().includes(evidenceSearch.toLowerCase()) ||
    e.external_id.toLowerCase().includes(evidenceSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="glass-pill active" style={{ fontSize: 'var(--fs-xs)' }}>
            System Observability Hub
          </span>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            Traces • Memory Cache • Evidence Index • Finetuning • QA Benchmarks
          </span>
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Developer &amp; Observability Diagnostics
        </h2>
      </div>

      {/* Sub tabs bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '2px', gap: '0.5rem' }}>
        <RippleButton rippleColor="rgba(92,168,255,0.15)" duration="600ms"
          onClick={() => setActiveTab('traces')}
          style={{
            background: activeTab === 'traces' ? 'rgba(92, 168, 255, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: activeTab === 'traces' ? 'var(--accent-blue)' : 'var(--text-muted)',
            padding: '0.5rem 1rem',
            fontSize: 'var(--fs-sm)',
            fontWeight: activeTab === 'traces' ? 700 : 500,
            cursor: 'pointer',
          }}
        >
          <Activity size={14} style={{ display: 'inline', marginRight: '6px' }} />
          LangGraph DAG Traces
        </RippleButton>

        <RippleButton rippleColor="rgba(92,168,255,0.15)" duration="600ms"
          onClick={() => setActiveTab('skills_memory')}
          style={{
            background: activeTab === 'skills_memory' ? 'rgba(92, 168, 255, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: activeTab === 'skills_memory' ? 'var(--accent-blue)' : 'var(--text-muted)',
            padding: '0.5rem 1rem',
            fontSize: 'var(--fs-sm)',
            fontWeight: activeTab === 'skills_memory' ? 700 : 500,
            cursor: 'pointer',
          }}
        >
          <BrainCircuit size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Skills &amp; Memories
        </RippleButton>

        <RippleButton rippleColor="rgba(92,168,255,0.15)" duration="600ms"
          onClick={() => setActiveTab('evidence')}
          style={{
            background: activeTab === 'evidence' ? 'rgba(92, 168, 255, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: activeTab === 'evidence' ? 'var(--accent-blue)' : 'var(--text-muted)',
            padding: '0.5rem 1rem',
            fontSize: 'var(--fs-sm)',
            fontWeight: activeTab === 'evidence' ? 700 : 500,
            cursor: 'pointer',
          }}
        >
          <FileSearch size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Evidence Explorer
        </RippleButton>

        <RippleButton rippleColor="rgba(92,168,255,0.15)" duration="600ms"
          onClick={() => setActiveTab('mcp')}
          style={{
            background: activeTab === 'mcp' ? 'rgba(92, 168, 255, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: activeTab === 'mcp' ? 'var(--accent-blue)' : 'var(--text-muted)',
            padding: '0.5rem 1rem',
            fontSize: 'var(--fs-sm)',
            fontWeight: activeTab === 'mcp' ? 700 : 500,
            cursor: 'pointer',
          }}
        >
          <Database size={14} style={{ display: 'inline', marginRight: '6px' }} />
          MCP Finetuning Datasets
        </RippleButton>

        <RippleButton rippleColor="rgba(92,168,255,0.15)" duration="600ms"
          onClick={() => setActiveTab('eval')}
          style={{
            background: activeTab === 'eval' ? 'rgba(92, 168, 255, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: activeTab === 'eval' ? 'var(--accent-blue)' : 'var(--text-muted)',
            padding: '0.5rem 1rem',
            fontSize: 'var(--fs-sm)',
            fontWeight: activeTab === 'eval' ? 700 : 500,
            cursor: 'pointer',
          }}
        >
          <Award size={14} style={{ display: 'inline', marginRight: '6px' }} />
          AI Quality Suite
        </RippleButton>
      </div>

      {/* Tab Panels */}
      <div style={{ flex: 1 }}>

        {/* TAB 1: LANGGRAPH DAG TRACES */}
        {activeTab === 'traces' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1.75fr', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Recent Executions ({visibleRuns.length})
                </h3>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-faint)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 999, padding: '0.12rem 0.4rem' }}>{agentRuns.length - visibleRuns.length > 0 ? `${agentRuns.length - visibleRuns.length} hidden · incomplete` : 'All valid'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {visibleRuns.map((run) => (
                  <div
                    key={run.id}
                    onClick={() => setSelectedRun(run)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: selectedRun?.id === run.id ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface)',
                      border: selectedRun?.id === run.id ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{run.trace_id}</span>
                      <span className="glass-pill" style={{ color: 'var(--accent-emerald)', fontSize: '0.65rem' }}>{run.latency_ms}ms</span>
                    </div>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>&quot;{run.query}&quot;</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteLog(run.id); }}
                        title="Delete log — blocked until Mem0 history for this project is deleted"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.62rem', fontWeight: 700, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', borderRadius: 999, padding: '0.2rem 0.45rem', cursor: 'pointer' }}
                      >
                        <Trash2 size={11} /> Delete log
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 0, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {selectedRun ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* ——— Header: query context + KPIs ——— */}
                  <div style={{ padding: '1rem 1.25rem 0.85rem', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(180deg, rgba(99,102,241,0.06), transparent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6d28d9', background: '#f5f3ff', border: '1px solid rgba(109,40,217,0.18)', borderRadius: 999, padding: '0.18rem 0.5rem' }}>Workflow routing map</span>
                          <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '0.15rem 0.4rem' }}>{selectedRun.trace_id} · {selectedRun.id.slice(0,12)}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.62rem', fontWeight: 800, color: '#86efac', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 999, padding: '0.16rem 0.45rem' }}><span style={{ width: 6, height: 6, borderRadius: 999, background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.7)' }} /> Live</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={selectedRun.query}>"{selectedRun.query}"</div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-faint)', marginTop: 4, fontFamily: 'monospace' }}>{new Date(selectedRun.created_at || Date.now()).toLocaleString()} · {selectedRun.workflow} · {selectedRun.confidence_label || '—'}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}><span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{selectedRun.latency_ms}</span><span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)' }}>ms</span></div>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 999, padding: '0.18rem 0.45rem' }}>{selectedRun.steps?.length || 0} nodes • end-to-end</span>
                      </div>
                    </div>
                    {/* KPI strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 10 }}>
                      {(() => { const s = selectedRun.steps||[]; const total=Math.max(1,s.reduce((a,b)=>a+(b.duration_ms||0),0)); const maxStep=s.reduce((m,b)=>Math.max(m,b.duration_ms||0),0); const p95=Math.round(maxStep/total*100); return (
                        <>
                          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.55rem 0.6rem' }}>
                            <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Groundedness</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#059669' }}>{Math.round((selectedRun.confidence||0.88)*100)}%<span style={{ fontSize:'0.62rem', color:'var(--text-muted)', fontWeight:600 }}> verified</span></div>
                          </div>
                          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.55rem 0.6rem' }}>
                            <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Heaviest node</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#2563eb' }}>{p95}%<span style={{ fontSize:'0.62rem', color:'var(--text-muted)', fontWeight:600 }}> of total</span></div>
                          </div>
                          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.55rem 0.6rem' }}>
                            <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Tokens</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-primary)' }}>{(selectedRun as any).total_tokens ?? (selectedRun as any).token_usage?.total_tokens ?? '—'}<span style={{ fontSize:'0.62rem', color:'var(--text-muted)', fontWeight:600 }}> total</span></div>
                          </div>
                          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.55rem 0.6rem' }}>
                            <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Status</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle2 size={14} /> {selectedRun.status}</div>
                          </div>
                        </>
                      ); })()}
                    </div>
                  </div>

                  {/* ——— Vertical timeline ——— */}
                  <div style={{ padding: '1rem 1.25rem 1rem 1.1rem', background: 'radial-gradient(700px 260px at 18% 0%, rgba(99,102,241,0.06), transparent 60%), radial-gradient(500px 220px at 92% 100%, rgba(6,182,214,0.06), transparent 60%)' }}>
                    <style>{`@keyframes ecbLineFlow { 0% { background-position: 0 0; } 100% { background-position: 0 28px; } } @keyframes ecbBead { 0% { transform: translateY(-8px); opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { transform: translateY(48px); opacity: 0; } } @keyframes llmShimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } } @keyframes llmPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.18); } 50% { box-shadow: 0 0 0 6px rgba(99,102,241,0.0); } }`}</style>
                    {(() => {
                      const steps = selectedRun.steps || [];
                      const total = Math.max(1, steps.reduce((a,b)=>a+(b.duration_ms||0),0));
                      // Plain-English mapping so any user understands what happened
                      const plainFor = (s: AgentStep) => {
                        const t=s.title.toLowerCase(), d=s.description||'';
                        // Balanced palette — soft color, not plain gray nor neon burn
                        if (t.includes('llama')||t.includes('safety')) return { stepNo: '01', icon: Shield, label: 'Security check', title: 'Checked your question is safe', desc: d.includes('SAFE') ? 'No prompt injection or private data detected — safe to continue.' : d, color: { bg: '#6d28d9', light: '#f5f3ff', ring: 'rgba(109,40,217,0.18)', bar: '#8b5cf6' } };
                        if (t.includes('context')||t.includes('plan')) {
                          const intent = d.match(/Intent:\s*([^,]+)/)?.[1]?.replace(/_/g,' ').toLowerCase() || 'understood your goal';
                          return { stepNo: '02', icon: BrainCircuit, label: 'Understood your goal', title: 'Understood what you want', desc: `Figured out you want: "${intent.slice(0,80)}" — routed to the right specialist.`, color: { bg: '#4338ca', light: '#eef2ff', ring: 'rgba(67,56,202,0.18)', bar: '#6366f1' } };
                        }
                        if (t.includes('qdrant')) {
                          const m=d.match(/(\d+) supporting/); const sup=m?m[1]:'−';
                          return { stepNo: '03', icon: Database, label: 'Found evidence', title: `Found ${sup} pieces of evidence`, desc: 'Searched knowledge base (Jira, Git, ADRs) and ranked by relevance.', color: { bg: '#0c4a6e', light: '#e0f2fe', ring: 'rgba(12,74,110,0.16)', bar: '#0ea5e9' } };
                        }
                        if (t.includes('a2a')||t.includes('delegation')) return { stepNo: '04', icon: GitBranch, label: 'Chose specialist', title: 'Picked the right specialist', desc: 'Routed to Git/Jira/Docs specialist and activated relevant skills.', color: { bg: '#155e75', light: '#ecfeff', ring: 'rgba(21,94,117,0.16)', bar: '#06b6d4' } };
                        if (t.includes('cove')||t.includes('hallucination')||t.includes('verif')) {
                          const v=d.match(/(\d+)\/(\d+) claims/)?.[0] || 'claims checked';
                          const g=d.match(/Groundedness:\s*([\d.]+%)/)?.[1] || '';
                          return { stepNo: '05', icon: ShieldCheck, label: 'Double-checked facts', title: `Verified facts — ${v}`, desc: g ? `Groundedness ${g} — every sentence checked against sources. ${d.includes('MODERATE')?'Flagged for review.':''}` : 'Every fact checked against retrieved evidence.', color: { bg: '#065f46', light: '#ecfdf5', ring: 'rgba(6,95,70,0.16)', bar: '#10b981' } };
                        }
                        if (t.includes('policy')) return { stepNo: '06', icon: Lock, label: 'Governance', title: 'Applied governance rules', desc: d, color: { bg: '#92400e', light: '#fffbeb', ring: 'rgba(146,64,14,0.16)', bar: '#f59e0b' } };
                        return { stepNo: `0${Math.min(9,5)}`, icon: Sparkles, label: (s.stage||'Step').toUpperCase(), title: s.title, desc: d, color: { bg: '#334155', light: '#f8fafc', ring: 'rgba(51,65,85,0.12)', bar: '#64748b' } };
                      };
                      const iconFor = (t: string) => plainFor({ title: t, description: '', stage: '' } as any).icon;
                      const colorFor = (t: string) => plainFor({ title: t, description: '', stage: '' } as any).color;
                      const stageLabel = (s: AgentStep) => plainFor(s).label.toUpperCase();
                      return (
                        <div style={{ position: 'relative', paddingLeft: 36 }}>
                          {/* continuous vertical rail — soft color */}
                          <div style={{ position: 'absolute', left: 15, top: 10, bottom: 10, width: 2, borderRadius: 999, background: 'linear-gradient(180deg, rgba(109,40,217,0.45) 0%, rgba(14,165,233,0.4) 50%, rgba(16,185,129,0.4) 100%)', opacity: 0.65 }} />
                          {/* LLM flow beads: soft color */}
                          <div aria-hidden style={{ position: 'absolute', left: 15, top: 22, bottom: 36, width: 2, pointerEvents: 'none', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', left: '50%', top: 0, width: 5, height: 5, marginLeft: -2.5, borderRadius: 999, background: '#8b5cf6', boxShadow: '0 0 6px rgba(139,92,246,0.35)', animation: 'ecbBead 2.2s linear infinite' }} />
                            <div style={{ position: 'absolute', left: '50%', top: 0, width: 5, height: 5, marginLeft: -2.5, borderRadius: 999, background: '#0ea5e9', boxShadow: '0 0 6px rgba(14,165,233,0.35)', animation: 'ecbBead 2.2s linear infinite 0.7s' }} />
                            <div style={{ position: 'absolute', left: '50%', top: 0, width: 5, height: 5, marginLeft: -2.5, borderRadius: 999, background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.32)', animation: 'ecbBead 2.2s linear infinite 1.4s' }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* Plain-English summary chips — what happened, at a glance */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4, padding: '0.5rem 0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
                              <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Flow:</span>
                              {steps.map((s,i)=> {
                                const pl=plainFor(s);
                                return <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                                  <span style={{ fontSize:'0.68rem', fontWeight:800, color: pl.color.bg, background: pl.color.light, border:`1px solid ${pl.color.ring}`, borderRadius:999, padding:'0.12rem 0.42rem' }}>{i+1}. {pl.label}</span>
                                  {i<steps.length-1 && <ArrowRight size={12} color="var(--text-faint)" />}
                                </span>;
                              })}
                              <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:'0.68rem', fontWeight:800, color:'#059669', background:'#ecfdf5', border:'1px solid rgba(16,185,129,0.25)', borderRadius:999, padding:'0.12rem 0.42rem' }}><CheckCircle2 size={12}/> Delivered</span>
                            </div>
                            {steps.map((step, idx) => {
                              const pct = Math.round(((step.duration_ms||0)/total)*100);
                              const p = plainFor(step);
                              const c = p.color;
                              const Icon = p.icon;
                              const isFallback = step.title.toLowerCase().includes('fallback') || (step.stage||'').toLowerCase().includes('fallback');
                              return (
                                <div key={step.step_id||idx} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 10, alignItems: 'start', position: 'relative' }}>
                                  {/* dot on rail */}
                                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', paddingTop: 14 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: 999, background: '#fff', border: `2.5px solid ${c.bg}`, boxShadow: `0 0 0 4px ${c.ring}, 0 2px 10px rgba(0,0,0,0.35)`, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <div style={{ width: 5, height: 5, borderRadius: 999, background: c.bg }} />
                                    </div>
                                    {/* pulse for active */}
                                    <div style={{ position: 'absolute', top: 14, width: 14, height: 14, borderRadius: 999, background: c.bg, opacity: 0.18, animation: idx===0 ? 'pulse 2s ease-in-out infinite' : 'none' } as any} />
                                  </div>
                                  {/* card */}
                                  {(() => {
                                    const isLLM = /context|cove|llama|plan|verif/i.test(step.title) || /context_planning|validating/i.test(step.stage||'');
                                    return (
                                  <div style={{
                                    background: 'var(--bg-card)',
                                    border: isFallback ? '1px solid rgba(6,182,214,0.28)' : '1px solid var(--border-subtle)',
                                    borderLeft: `3px solid ${c.bg}`,
                                    borderRadius: 12, padding: '0.75rem 0.85rem 0.65rem',
                                    boxShadow: isLLM ? `0 0 0 1px ${c.ring}, 0 8px 24px rgba(0,0,0,0.06)` : '0 4px 16px rgba(0,0,0,0.04)',
                                    position: 'relative', overflow: 'hidden',
                                    animation: isLLM ? 'llmPulse 2.8s ease-in-out infinite' : undefined
                                  }}>
                                    {/* LLM shimmer */}
                                    {isLLM && <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '45%', background: `linear-gradient(90deg, transparent, ${c.ring}, transparent)`, animation: 'llmShimmer 2.2s ease-in-out infinite', pointerEvents: 'none' }} />}
                                    {/* expand toggle */}
                                    <button
                                      onClick={() => {
                                        const n = new Set(expandedSteps);
                                        if (n.has(idx)) n.delete(idx); else n.add(idx);
                                        setExpandedSteps(n);
                                      }}
                                      title={expandedSteps.has(idx) ? 'Hide proof' : 'Show proof — what this stage did'}
                                      style={{ position: 'absolute', top: 6, right: 6, display: 'inline-flex', alignItems: 'center', gap: 4, background: expandedSteps.has(idx) ? c.bg : 'var(--bg-surface)', color: expandedSteps.has(idx) ? '#fff' : 'var(--text-muted)', border: `1px solid ${expandedSteps.has(idx) ? c.bg : 'var(--border-subtle)'}`, borderRadius: 999, padding: '0.18rem 0.42rem', fontSize: '0.58rem', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                      <span style={{ fontFamily: 'monospace' }}>0{idx+1}</span>
                                      {expandedSteps.has(idx) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                      <div style={{ width: 32, height: 32, borderRadius: 9, background: c.light, border: `1px solid ${c.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: c.bg }}>
                                        <Icon size={16} />
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569', marginBottom: 2 }}>{p.label}<span style={{ fontWeight:600, color:'var(--text-faint)' }}> · {p.stepNo}</span>{isLLM ? <span style={{ marginLeft:6, fontSize:'0.58rem', fontWeight:700, color:'#475569', background:'#f1f5f9', border:'1px solid rgba(71,85,105,0.14)', borderRadius:999, padding:'0.06rem 0.28rem' }}>LLM</span> : null}</div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>{p.title}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginTop: 3 }}>{p.desc}</div>
                                        <div style={{ fontSize: '0.62rem', color: 'var(--text-faint)', fontFamily: 'monospace', marginTop: 3, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:6, padding:'0.12rem 0.32rem', display:'inline-block' }} title={step.title}>tech: {step.title} · {step.stage}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.62rem', fontWeight: 800, color: '#fff', background: c.bg, borderRadius: 999, padding: '0.18rem 0.45rem' }}><Clock size={10} /> {step.duration_ms}ms</span>
                                          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: c.bg, background: c.light, border: `1px solid ${c.ring}`, borderRadius: 999, padding: '0.16rem 0.45rem' }}>{pct}% of trace</span>
                                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'monospace', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '0.12rem 0.32rem' }}>{step.stage}</span>
                                          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.62rem', fontWeight: 700, color: step.status==='success' ? '#059669' : '#dc2626' }}><CheckCircle2 size={11} style={{ opacity: step.status==='success'?1:0.7 }} /> {step.status}</span>
                                        </div>
                                        {/* duration bar */}
                                        <div style={{ height: 4, borderRadius: 999, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', marginTop: 10, overflow: 'hidden' }}>
                                          <div style={{ width: `${Math.max(4,pct)}%`, height: '100%', background: `linear-gradient(90deg, ${c.bg}, ${c.bar})`, borderRadius: 999, boxShadow: `0 0 8px ${c.ring}` }} />
                                        </div>
                                        {/* — expanded proof — */}
                                        {expandedSteps.has(idx) && (
                                          <div style={{ marginTop: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '0.6rem 0.7rem', animation: 'fadeIn 0.18s ease' }}>
                                            <div style={{ fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.bg, marginBottom: 4 }}>What this stage did — with proof</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>{p.title}: {p.desc}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{step.description}</div>
                                            {step.payload && Object.keys(step.payload).length > 0 && (
                                              <pre style={{ marginTop: 6, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '0.45rem 0.5rem', fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--text-muted)', maxHeight: 140, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(step.payload, null, 2).slice(0, 900)}</pre>
                                            )}
                                            {!step.payload && <div style={{ marginTop: 6, fontSize: '0.68rem', color: 'var(--text-faint)', fontStyle: 'italic' }}>No additional payload — proof is the retrieved evidence and grounded answer in the final Deliver card.</div>}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                    );})()}
                                </div>
                              );
                            })}
                            {/* Deliver terminal */}
                            <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 10, alignItems: 'center', marginTop: 2 }}>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div style={{ width: 22, height: 22, borderRadius: 999, background: '#f0fdf4', border: '1px solid rgba(20,83,45,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                                  <CheckCircle2 size={13} color="#15803d" />
                                </div>
                              </div>
                              <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.55rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155' }}>Deliver · Answer synthesized & Mem0 persisted</div>
                                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{selectedRun.latency_ms}ms end-to-end</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Footer: legend + raw */}
                  <div style={{ padding: '0.7rem 1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 10, fontSize: '0.62rem', color: 'var(--text-muted)', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 3, borderRadius: 999, background: '#8b5cf6' }} /> Intake</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 3, borderRadius: 999, background: '#6366f1' }} /> Classify</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 3, borderRadius: 999, background: '#06b6d4' }} /> Verify</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 3, borderRadius: 999, background: '#10b981' }} /> Deliver</span>
                    </div>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-faint)', fontFamily: 'monospace' }}>Top → Bottom • Animated rail • Fallback-aware</span>
                  </div>
                  <details style={{ margin: '0 1.25rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.55rem 0.75rem' }}>
                    <summary style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer', listStyle: 'none' }}>View raw step payloads (debug)</summary>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, maxHeight: 160, overflow: 'auto' }}>
                      {selectedRun.steps?.map((s: any, i: number) => (
                        <div key={i} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4, fontFamily: 'monospace', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '0.4rem 0.5rem' }}><span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{i+1}. {s.title}</span> — {s.description} <span style={{ color: 'var(--text-faint)' }}>({s.duration_ms}ms {s.stage})</span></div>
                      ))}
                    </div>
                  </details>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)' }}>
                  Select an agent run trace log to review waterfall metrics.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SKILLS & MEMORIES */}
        {activeTab === 'skills_memory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <RippleButton rippleColor="rgba(99,102,241,0.15)" duration="600ms" onClick={() => setActiveSubTab('skills')} style={{ background: activeSubTab === 'skills' ? 'rgba(99,102,241,0.12)' : 'transparent', border: 'none', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', color: activeSubTab === 'skills' ? 'var(--text-primary)' : 'var(--text-muted)' }}>Skills Manifest</RippleButton>
              <RippleButton rippleColor="rgba(99,102,241,0.15)" duration="600ms" onClick={() => setActiveSubTab('mem0')} style={{ background: activeSubTab === 'mem0' ? 'rgba(99,102,241,0.12)' : 'transparent', border: 'none', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', color: activeSubTab === 'mem0' ? 'var(--text-primary)' : 'var(--text-muted)' }}>Mem0 Memory Logs</RippleButton>
              <RippleButton rippleColor="rgba(99,102,241,0.15)" duration="600ms" onClick={() => setActiveSubTab('qdrant')} style={{ background: activeSubTab === 'qdrant' ? 'rgba(99,102,241,0.12)' : 'transparent', border: 'none', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', color: activeSubTab === 'qdrant' ? 'var(--text-primary)' : 'var(--text-muted)' }}>Qdrant Analytics</RippleButton>
            </div>

            {activeSubTab === 'skills' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Playbooks ({skills.length})</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input ref={fileInputRef} type="file" accept=".md" onChange={handleUploadSkill} style={{ display: 'none' }} />
                      <RippleButton rippleColor="rgba(99,102,241,0.15)" duration="600ms" onClick={() => fileInputRef.current?.click()} style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 999, padding: '0.2rem 0.6rem', color: '#10b981', cursor: 'pointer' }}>Upload</RippleButton>
                      <RippleButton rippleColor="rgba(99,102,241,0.15)" duration="600ms" onClick={() => { setIsCreatingSkill(true); setEditingSkill(null); setSkillForm({ name: '', description: '', version: '1.0.0', author: '', instructions: '' }); }} style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 999, padding: '0.2rem 0.6rem', color: '#6366f1', cursor: 'pointer' }}>+ New</RippleButton>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
                    {skills.map((s) => (
                      <div key={s.name} onClick={() => { setSelectedSkill(s); setEditingSkill(null); setIsCreatingSkill(false); }} style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: selectedSkill?.name === s.name ? 'rgba(99, 102, 241, 0.1)' : 'transparent', cursor: 'pointer', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</div>
                          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>v{s.version} • {s.author}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSkill(s.name); }} title="Delete skill" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  {isCreatingSkill ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Create New Skill</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Name</label>
                          <input value={skillForm.name} onChange={e => setSkillForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. data_governance" style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none', fontFamily: 'monospace' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Version</label>
                          <input value={skillForm.version} onChange={e => setSkillForm(p => ({ ...p, version: e.target.value }))} placeholder="1.0.0" style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none', fontFamily: 'monospace' }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Description</label>
                        <input value={skillForm.description} onChange={e => setSkillForm(p => ({ ...p, description: e.target.value }))} placeholder="What this skill does" style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Author</label>
                        <input value={skillForm.author} onChange={e => setSkillForm(p => ({ ...p, author: e.target.value }))} placeholder="Team name" style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Instructions (Markdown)</label>
                        <textarea value={skillForm.instructions} onChange={e => setSkillForm(p => ({ ...p, instructions: e.target.value }))} placeholder="# Skill Title&#10;&#10;## When to Activate&#10;- ..." rows={12} style={{ width: '100%', padding: '0.65rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.75rem', fontFamily: 'monospace', outline: 'none', resize: 'vertical', lineHeight: 1.5 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <RippleButton rippleColor="rgba(99,102,241,0.15)" duration="600ms" onClick={() => setIsCreatingSkill(false)} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.35rem 0.85rem', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</RippleButton>
                        <RippleButton rippleColor="rgba(99,102,241,0.15)" duration="600ms" onClick={handleCreateSkill} className="glass-btn glass-btn-primary" style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.35rem 0.85rem', borderRadius: 8, cursor: 'pointer' }}>Create Skill</RippleButton>
                      </div>
                    </div>
                  ) : editingSkill ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Editing: {editingSkill.name}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Version</label>
                          <input value={skillForm.version} onChange={e => setSkillForm(p => ({ ...p, version: e.target.value }))} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none', fontFamily: 'monospace' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Author</label>
                          <input value={skillForm.author} onChange={e => setSkillForm(p => ({ ...p, author: e.target.value }))} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none' }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Description</label>
                        <input value={skillForm.description} onChange={e => setSkillForm(p => ({ ...p, description: e.target.value }))} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Instructions (Markdown)</label>
                        <textarea value={skillForm.instructions} onChange={e => setSkillForm(p => ({ ...p, instructions: e.target.value }))} rows={14} style={{ width: '100%', padding: '0.65rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.75rem', fontFamily: 'monospace', outline: 'none', resize: 'vertical', lineHeight: 1.5 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <RippleButton rippleColor="rgba(99,102,241,0.15)" duration="600ms" onClick={() => setEditingSkill(null)} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.35rem 0.85rem', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</RippleButton>
                        <RippleButton rippleColor="rgba(99,102,241,0.15)" duration="600ms" onClick={handleSaveSkill} className="glass-btn glass-btn-primary" style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.35rem 0.85rem', borderRadius: 8, cursor: 'pointer' }}>Save Changes</RippleButton>
                      </div>
                    </div>
                  ) : selectedSkill ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedSkill.name}</h4>
                          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: 2 }}>v{selectedSkill.version} • {selectedSkill.author}</div>
                        </div>
                        <RippleButton rippleColor="rgba(99,102,241,0.15)" duration="600ms" onClick={() => { setEditingSkill(selectedSkill); setSkillForm({ name: selectedSkill.name, description: selectedSkill.description, version: selectedSkill.version, author: selectedSkill.author, instructions: selectedSkill.instructions }); }} style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: 999, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.1)', color: '#6366f1', cursor: 'pointer', flexShrink: 0 }}>Edit</RippleButton>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{selectedSkill.description}</div>
                      <pre style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto', lineHeight: 1.6 }}>
                        {selectedSkill.instructions}
                      </pre>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)' }}>Select a playbook to inspect, or click + New to create one.</div>
                  )}
                </div>
              </div>
            )}

            {activeSubTab === 'mem0' && (
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-card)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <Search size={16} color="var(--text-muted)" />
                  <input type="text" placeholder="Search memories..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '400px', overflowY: 'auto' }}>
                  {filteredMemories.map((m) => (
                    <div key={m.id} style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', marginBottom: '0.25rem', gap: 8 }}>
                        <span style={{ color: 'var(--accent-blue)', fontWeight: 700, flex: 1 }}>{m.title}</span>
                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Confidence: {Math.round(m.confidence * 100)}%</span>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete Mem0 memory "${m.title}"? This also unlocks its trace log for deletion.`)) return;
                            try { await api.deleteMem0Memory(m.id); setMemories(prev => prev.filter(x => x.id !== m.id)); } catch (e:any){ alert(e?.message||'Delete failed'); }
                          }}
                          title="Delete — removes from Mem0 project DB and cloud"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', margin: 0 }}>{m.content}</p>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-faint)', marginTop: 4, fontFamily: 'monospace' }}>{m.project_id || 'global'} · {new Date(m.validity_from).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === 'qdrant' && (
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>Qdrant Local Analytics</h4>
                <pre style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {JSON.stringify(qdrantStats || { collections: { evidence_vectors: { vectors_count: 492, status: "green", index_type: "HNSW" } } }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EVIDENCE EXPLORER */}
        {activeTab === 'evidence' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1.75fr', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-card)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <Search size={16} color="var(--text-muted)" />
                <input type="text" placeholder="Search source records..." value={evidenceSearch} onChange={e => setEvidenceSearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '420px', overflowY: 'auto' }}>
                {filteredEvidence.map((e) => (
                  <div key={e.id} onClick={() => setSelectedEvidence(e)} style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: selectedEvidence?.id === e.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-blue)', marginBottom: '0.15rem' }}>{e.external_id}</div>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{e.source_title}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              {selectedEvidence ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <span className="glass-pill active" style={{ fontSize: 'var(--fs-xs)' }}>{selectedEvidence.source_type.toUpperCase()}</span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem' }}>{selectedEvidence.source_title}</h3>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Excerpt Extract</div>
                    <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>{selectedEvidence.excerpt}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                    <span>Author: <strong>{selectedEvidence.author || 'Lead architect'}</strong></span>
                    <span>Authority: {selectedEvidence.authority}</span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)' }}>Select a source record to inspect metadata.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MCP DATASETS */}
        {activeTab === 'mcp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <RippleButton rippleColor="rgba(99,102,241,0.15)" duration="600ms" onClick={() => setActiveMcpTab('git')} style={{ background: activeMcpTab === 'git' ? 'rgba(99,102,241,0.12)' : 'transparent', border: 'none', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', color: activeMcpTab === 'git' ? 'var(--text-primary)' : 'var(--text-muted)' }}>Git Commits</RippleButton>
                <RippleButton rippleColor="rgba(99,102,241,0.15)" duration="600ms" onClick={() => setActiveMcpTab('jira')} style={{ background: activeMcpTab === 'jira' ? 'rgba(99,102,241,0.12)' : 'transparent', border: 'none', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', color: activeMcpTab === 'jira' ? 'var(--text-primary)' : 'var(--text-muted)' }}>Jira Issues</RippleButton>
              </div>

              <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms" className="glass-btn" onClick={handleExportJsonl} disabled={datasetRecords.length === 0}>
                <Download size={14} style={{ marginRight: '4px' }} />
                Export JSONL Manifest
              </RippleButton>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', maxHeight: '420px', overflowY: 'auto' }}>
              {mcpLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Normalizing dataset instructions...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {datasetRecords.map((r, idx) => (
                    <div key={idx} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                        Instruction: {r.instruction}
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-emerald)', padding: '0.35rem', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '3px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                        Target: {r.target_synthesis}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AI QUALITY SUITE */}
        {activeTab === 'eval' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>CI/CD Regression &amp; Guardrails test</h3>
              <RippleButton rippleColor="rgba(99,102,241,0.15)" duration="600ms" className="glass-btn glass-btn-primary" onClick={handleRunBenchmarks} disabled={isEvalRunning}>
                {isEvalRunning ? 'Executing Benchmarks...' : 'Run Golden Benchmarks'}
              </RippleButton>
            </div>

            {/* Quality Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="glass-card">
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Claim Groundedness</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: benchmarkResult && benchmarkResult.metrics.groundedness_rate >= 90 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{benchmarkResult ? `${benchmarkResult.metrics.groundedness_rate}%` : 'N/A'}</div>
                {benchmarkResult && <div style={{ fontSize: '0.6rem', color: 'var(--text-faint)', marginTop: 2 }}>target: {benchmarkResult.metrics.target_groundedness}%</div>}
              </div>
              <div className="glass-card">
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Citation Accuracy</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: benchmarkResult && benchmarkResult.metrics.citation_accuracy_rate >= 90 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{benchmarkResult ? `${benchmarkResult.metrics.citation_accuracy_rate}%` : 'N/A'}</div>
                {benchmarkResult && <div style={{ fontSize: '0.6rem', color: 'var(--text-faint)', marginTop: 2 }}>target: {benchmarkResult.metrics.target_citation_accuracy}%</div>}
              </div>
              <div className="glass-card">
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Entity Coverage</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: benchmarkResult && benchmarkResult.metrics.entity_coverage_rate >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>{benchmarkResult ? `${benchmarkResult.metrics.entity_coverage_rate}%` : 'N/A'}</div>
              </div>
              <div className="glass-card">
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Conflict Detection</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{benchmarkResult ? `${benchmarkResult.metrics.conflict_detection_rate}%` : 'N/A'}</div>
              </div>
              {benchmarkResult && (
                <div className="glass-card">
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Results</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: benchmarkResult.failed_count === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{benchmarkResult.passed_count}/{benchmarkResult.total_benchmarks_run} passed</div>
                </div>
              )}
            </div>

            {/* Benchmark results — expandable per case */}
            <div className="glass-panel" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {(benchmarkResult?.detailed_results || []).map((t) => (
                  <EvalCaseRow key={t.case_id} result={t} />
                ))}
                {!benchmarkResult && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-faint)' }}>Click "Run Golden Benchmarks" to execute real evaluation.</div>}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const EvalCaseRow: React.FC<{ result: any }> = ({ result }) => {
  const [expanded, setExpanded] = useState(false);
  const passed = result.status === 'PASSED';
  return (
    <div style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}><strong>{result.case_id}</strong>: {result.question}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.6rem', color: passed ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 700 }}>{result.status}</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Groundedness: {result.groundedness}%</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Entities: {result.entity_coverage}%</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Citations: {result.citations_accuracy}%</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{result.latency_ms}ms</span>
          </div>
        </div>
        {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
      </div>
      {expanded && (
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Answer preview */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Answer</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--bg-surface)', padding: '0.5rem 0.65rem', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>{result.answer_preview}</div>
          </div>
          {/* Entity check */}
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Entity Coverage ({result.entity_coverage}%)</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(result.entities_found || []).map((e: string) => <span key={e} style={{ fontSize: '0.6rem', padding: '0.12rem 0.4rem', borderRadius: 999, background: 'rgba(16,185,129,0.12)', color: 'var(--accent-emerald)', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 700 }}>{e}</span>)}
              {(result.entities_missing || []).map((e: string) => <span key={e} style={{ fontSize: '0.6rem', padding: '0.12rem 0.4rem', borderRadius: 999, background: 'rgba(239,68,68,0.12)', color: 'var(--accent-rose)', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 700 }}>{e}</span>)}
            </div>
          </div>
          {/* Claims */}
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Claims ({result.claims_supported}/{result.claim_count} supported)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(result.claim_details || []).map((c: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.68rem' }}>
                  <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: 999, background: c.verdict === 'supported' ? 'var(--accent-emerald)' : c.verdict === 'refuted' ? 'var(--accent-rose)' : 'var(--accent-amber)', marginTop: 3 }} />
                  <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{c.claim}</span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-faint)', flexShrink: 0 }}>{c.verdict} ({Math.round(c.confidence * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
          {/* Conflict */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conflict:</span>
            <span style={{ fontSize: '0.68rem', color: result.conflict_detected ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>{result.conflict_detected ? `Detected (${Math.round(result.conflict_confidence * 100)}% confidence)` : 'None detected'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperDiagnosticsView;

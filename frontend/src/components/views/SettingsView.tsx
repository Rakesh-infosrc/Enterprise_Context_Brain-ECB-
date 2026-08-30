// frontend/src/components/views/SettingsView.tsx

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Layers,
  Database,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Radio,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { RippleButton } from "@/components/ui/ripple-button";
import { api } from '../../lib/api';

export const SettingsView: React.FC = () => {
  const [policyProfile, setPolicyProfile] = useState('enterprise_strict');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);

  // Connection fields
  const [dbxHost, setDbxHost] = useState('');
  const [dbxToken, setDbxToken] = useState('');
  const [jiraUrl, setJiraUrl] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubHost, setGithubHost] = useState('https://github.com');
  const [githubRepos, setGithubRepos] = useState('');
  const [syncing, setSyncing] = useState<string | null>(null);

  // Active Webhook Integrations — Connect / Disconnect toggle
  // Disconnected repos are hidden from POC (filtered out) and persisted
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('ecb_hidden_webhooks');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ecb_hidden_webhooks', JSON.stringify(hiddenIds));
      window.dispatchEvent(new Event('ecb_hidden_webhooks_changed'));
    } catch {}
  }, [hiddenIds]);

  const loadProjects = () => {
    api.getProjects()
      .then((res: any) => {
        setProjects(res || []);
      })
      .catch((err) => {
        console.error('Failed to load projects:', err);
      });
  };

  useEffect(() => {
    // Fetch settings on mount
    api.getConnectionSettings()
      .then((res: any) => {
        setDbxHost(res.databricks_host || '');
        setDbxToken(res.databricks_token || '');
        setJiraUrl(res.jira_base_url || '');
        setJiraEmail(res.jira_user_email || '');
        setJiraToken(res.jira_api_token || '');
        setGithubToken(res.github_token || '');
        setGithubHost(res.github_host || 'https://github.com');
        setGithubRepos(res.github_repos || '');
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load connections:', err);
        setLoading(false);
      });

    loadProjects();

    const handleReload = () => {
      loadProjects();
    };
    window.addEventListener('ecb-reload-data', handleReload);
    return () => {
      window.removeEventListener('ecb-reload-data', handleReload);
    };
  }, []);

  const handleSave = () => {
    api.saveConnectionSettings({
      databricks_host: dbxHost,
      databricks_token: dbxToken,
      jira_base_url: jiraUrl,
      jira_user_email: jiraEmail,
      jira_api_token: jiraToken,
      github_token: githubToken,
      github_host: githubHost,
      github_repos: githubRepos
    })
      .then(() => {
        setSavedSuccess(true);
        window.dispatchEvent(new Event('ecb-reload-data'));
        setTimeout(() => setSavedSuccess(false), 3000);
      })
      .catch((err) => {
        console.error('Failed to save connections:', err);
      });
  };

  const handleDisconnect = (projectId: string) => {
    // Local POC toggle — hide from Active list, do NOT delete from backend
    // Keeps data intact and allows Re-Connect
    setHiddenIds((prev) => (prev.includes(projectId) ? prev : [...prev, projectId]));
  };

  const handleConnect = (projectId: string) => {
    setHiddenIds((prev) => prev.filter((id) => id !== projectId));
    // Optionally refresh to ensure POC picks it up
    window.dispatchEvent(new Event('ecb-reload-data'));
  };

  const handleHardDisconnect = (projectId: string) => {
    if (!window.confirm('Are you sure you want to disconnect this repository/webhook connector? This will remove all associated evidence and dashboard stats.')) {
      return;
    }
    // Optimistically remove from UI immediately
    setProjects(prev => prev.filter((p: any) => p.id !== projectId));
    setHiddenIds(prev => prev.filter(id => id !== projectId));

    api.deleteProject(projectId)
      .then(() => {
        window.dispatchEvent(new Event('ecb-reload-data'));
      })
      .catch((err) => {
        console.error('Failed to delete project:', err);
        // Restore list from server on failure
        loadProjects();
        const msg = err?.message || 'Unknown error';
        alert(`Failed to disconnect: ${msg}`);
      });
  };

  const handleSync = (connector: 'databricks' | 'jira' | 'github') => {
    setSyncing(connector);
    api.syncConnector(connector)
      .then((res) => {
        setSavedSuccess(true);
        window.dispatchEvent(new Event('ecb-reload-data'));
        loadProjects();
        setTimeout(() => setSavedSuccess(false), 3000);
      })
      .catch((err) => {
        console.error(`Failed to sync ${connector}:`, err);
        alert(`Sync failed: ${err?.message || 'Unknown error'}`);
      })
      .finally(() => setSyncing(null));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="glass-pill active" style={{ fontSize: 'var(--fs-xs)' }}>
            System Configuration
          </span>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            Governance Profiles, Ingestion Connectors &amp; Gateway Settings
          </span>
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Settings &amp; Data Plane Connectors
        </h2>
      </div>

      {savedSuccess && (
        <div style={{
          background: 'rgba(53, 208, 127, 0.15)',
          border: '1px solid rgba(53, 208, 127, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          color: 'var(--accent-emerald)',
          fontSize: 'var(--fs-base)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <CheckCircle2 size={18} />
          <span>Configuration saved successfully and applied dynamically!</span>
        </div>
      )}

      {/* Grid: Connectors vs Policy Profile */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
        {/* Left: Ingestion Connectors */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Canonical Ingestion Connectors (Credentials &amp; Settings)
            </h3>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading credentials...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Databricks Connector */}
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>Databricks Integration</h4>
                  <RippleButton rippleColor="rgba(99,102,241,0.25)" duration="600ms"
                    onClick={() => handleSync('databricks')}
                    disabled={syncing === 'databricks'}
                    style={{ fontSize: 'var(--fs-xs)', padding: '0.3rem 0.7rem', borderRadius: '9999px', background: syncing === 'databricks' ? 'rgba(100,116,139,0.2)' : 'rgba(99,102,241,0.15)', color: syncing === 'databricks' ? '#64748b' : '#6366f1', border: '1px solid rgba(99,102,241,0.3)', cursor: syncing === 'databricks' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <RefreshCw size={12} className={syncing === 'databricks' ? 'animate-spin' : ''} />
                    {syncing === 'databricks' ? 'Syncing...' : 'Sync'}
                  </RippleButton>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Workspace Host URL</label>
                    <input type="text" value={dbxHost} onChange={(e) => setDbxHost(e.target.value)} className="glass-input" style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-medium)', padding: '0.45rem', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Personal Access Token (PAT)</label>
                    <input type="password" value={dbxToken} onChange={(e) => setDbxToken(e.target.value)} className="glass-input" style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-medium)', padding: '0.45rem', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                </div>
              </div>

              {/* Jira Connector */}
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>Jira Enterprise Integration</h4>
                  <RippleButton rippleColor="rgba(99,102,241,0.25)" duration="600ms"
                    onClick={() => handleSync('jira')}
                    disabled={syncing === 'jira'}
                    style={{ fontSize: 'var(--fs-xs)', padding: '0.3rem 0.7rem', borderRadius: '9999px', background: syncing === 'jira' ? 'rgba(100,116,139,0.2)' : 'rgba(99,102,241,0.15)', color: syncing === 'jira' ? '#64748b' : '#6366f1', border: '1px solid rgba(99,102,241,0.3)', cursor: syncing === 'jira' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <RefreshCw size={12} className={syncing === 'jira' ? 'animate-spin' : ''} />
                    {syncing === 'jira' ? 'Syncing...' : 'Sync'}
                  </RippleButton>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Jira Base URL</label>
                    <input type="text" value={jiraUrl} onChange={(e) => setJiraUrl(e.target.value)} className="glass-input" style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-medium)', padding: '0.45rem', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>User Email Address</label>
                    <input type="text" value={jiraEmail} onChange={(e) => setJiraEmail(e.target.value)} className="glass-input" style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-medium)', padding: '0.45rem', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>API Token</label>
                    <input type="password" value={jiraToken} onChange={(e) => setJiraToken(e.target.value)} className="glass-input" style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-medium)', padding: '0.45rem', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                </div>
              </div>

              {/* GitHub Connector */}
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>GitHub Integration</h4>
                  <RippleButton rippleColor="rgba(99,102,241,0.25)" duration="600ms"
                    onClick={() => handleSync('github')}
                    disabled={syncing === 'github'}
                    style={{ fontSize: 'var(--fs-xs)', padding: '0.3rem 0.7rem', borderRadius: '9999px', background: syncing === 'github' ? 'rgba(100,116,139,0.2)' : 'rgba(99,102,241,0.15)', color: syncing === 'github' ? '#64748b' : '#6366f1', border: '1px solid rgba(99,102,241,0.3)', cursor: syncing === 'github' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <RefreshCw size={12} className={syncing === 'github' ? 'animate-spin' : ''} />
                    {syncing === 'github' ? 'Syncing...' : 'Sync'}
                  </RippleButton>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>GitHub Host URL</label>
                    <input type="text" value={githubHost} onChange={(e) => setGithubHost(e.target.value)} placeholder="https://github.com" className="glass-input" style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-medium)', padding: '0.45rem', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Personal Access Token</label>
                    <input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} className="glass-input" style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-medium)', padding: '0.45rem', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Repositories to Sync (comma-separated, e.g. owner/repo1, owner/repo2)</label>
                    <textarea value={githubRepos} onChange={(e) => setGithubRepos(e.target.value)} placeholder="Leave empty to sync all accessible repositories" rows={2} className="glass-input" style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-medium)', padding: '0.45rem', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', resize: 'vertical' }} />
                  </div>
                </div>
              </div>

              {/* Connected Git Webhook integrations — Connect / Disconnect toggle */}
              {(() => {
                const allWebhookProjects = projects.filter((p: any) => typeof p.name === 'string' && p.name.includes('/'));
                const activeWebhooks = allWebhookProjects.filter((p: any) => !hiddenIds.includes(p.id));
                const disconnectedWebhooks = allWebhookProjects.filter((p: any) => hiddenIds.includes(p.id));

                return (
                  <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                      <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>Active Webhook Integrations</h4>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: activeWebhooks.length ? 'rgba(99, 102, 241, 0.12)' : 'rgba(100,116,139,0.12)', color: activeWebhooks.length ? '#6366f1' : '#94a3b8', border: `1px solid ${activeWebhooks.length ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-subtle)'}`, boxShadow: activeWebhooks.length ? '0 0 10px rgba(99, 102, 241, 0.1)' : 'none' }}>
                        {activeWebhooks.length} Active
                      </span>
                    </div>

                    {allWebhookProjects.length === 0 ? (
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>No Git webhooks detected. Send a push / pull-request webhook event to auto-register.</div>
                    ) : activeWebhooks.length === 0 ? (
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', padding: '0.75rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.15)' }}>
                        All webhooks are disconnected — none will show in your POC. Click <span style={{ color: '#6366f1', fontWeight: 700 }}>Connect</span> below to re-enable.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {activeWebhooks.map((p: any) => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-card)', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                              <div style={{ fontSize: 'var(--fs-xs)', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#6366f1', display: 'inline-block', flexShrink: 0 }} />
                                Webhook Active
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                              <RippleButton rippleColor="rgba(239,68,68,0.18)" duration="600ms"
                                onClick={() => handleDisconnect(p.id)}
                                title="Hide from POC — keeps data, can Re-Connect"
                                className="font-bold uppercase tracking-wide"
                                style={{
                                  background: 'rgba(254, 242, 242, 0.92)',
                                  backdropFilter: 'blur(12px)',
                                  WebkitBackdropFilter: 'blur(12px)',
                                  border: '1px solid rgba(239,68,68,0.18)',
                                  color: '#dc2626',
                                  padding: '0.4rem 1rem 0.4rem 0.5rem',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  letterSpacing: '0.04em',
                                  borderRadius: '9999px',
                                  boxShadow: '0 2px 10px rgba(239,68,68,0.12), inset 0 1px 0 rgba(255,255,255,0.85), 0 1px 2px rgba(0,0,0,0.04)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.55rem',
                                }}
                              >
                                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fee2e2', border: '1.5px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <X size={11} color="#dc2626" strokeWidth={3} />
                                </span>
                                Disconnect
                              </RippleButton>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Disconnected — shows Connect to re-enable in POC */}
                    {disconnectedWebhooks.length > 0 && (
                      <div style={{ marginTop: '1.1rem', paddingTop: '0.9rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748b' }} />
                          Disconnected — hidden from POC ({disconnectedWebhooks.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          {disconnectedWebhooks.map((p: any) => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-card)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(100,116,139,0.25)', opacity: 0.9 }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'line-through' }}>{p.name}</div>
                                <div style={{ fontSize: 'var(--fs-xs)', color: '#64748b', marginTop: '0.15rem' }}>Hidden from POC</div>
                              </div>
                              <RippleButton rippleColor="rgba(34,197,94,0.18)" duration="600ms"
                                onClick={() => handleConnect(p.id)}
                                title="Show again in POC"
                                className="font-bold uppercase tracking-wide"
                                style={{
                                  background: 'rgba(240, 253, 244, 0.92)',
                                  backdropFilter: 'blur(12px)',
                                  WebkitBackdropFilter: 'blur(12px)',
                                  border: '1px solid rgba(34,197,94,0.18)',
                                  color: '#15803d',
                                  padding: '0.4rem 1rem 0.4rem 0.5rem',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  letterSpacing: '0.04em',
                                  borderRadius: '9999px',
                                  boxShadow: '0 2px 10px rgba(34,197,94,0.12), inset 0 1px 0 rgba(255,255,255,0.85), 0 1px 2px rgba(0,0,0,0.04)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.55rem',
                                }}
                              >
                                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#dcfce7', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Check size={11} color="#15803d" strokeWidth={3} />
                                </span>
                                Connect
                              </RippleButton>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Right: Policy & Security Profile */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Governance &amp; Policy Profile
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--fs-xs)', marginBottom: '1.5rem' }}>
            {[
              { id: 'enterprise_strict', name: 'Enterprise Strict (Default)', desc: 'Mandatory two-person approval for all Jira mutations, Git tags, and architectural modifications.' },
              { id: 'standard_audit', name: 'Standard Audit', desc: 'Auto-approve low-impact items with audit log; require human approval for critical milestones.' },
              { id: 'permissive_dev', name: 'Developer Sandbox', desc: 'Permissive tool execution within synthetic test sandboxes only.' },
            ].map((prof) => (
              <div
                key={prof.id}
                onClick={() => setPolicyProfile(prof.id)}
                className="glass-card"
                style={{
                  padding: '0.85rem 1rem',
                  background: policyProfile === prof.id
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)'
                    : undefined,
                  border: policyProfile === prof.id
                    ? '1.5px solid rgba(99, 102, 241, 0.5)'
                    : undefined,
                  borderLeft: policyProfile === prof.id ? '3.5px solid #6366f1' : '3.5px solid transparent',
                  boxShadow: policyProfile === prof.id
                    ? '0 0 0 3px rgba(99, 102, 241, 0.1), 0 4px 12px rgba(99, 102, 241, 0.12)'
                    : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: policyProfile === prof.id ? '#6366f1' : 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {prof.name}
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {prof.desc}
                </div>
              </div>
            ))}
          </div>

          <RippleButton rippleColor="rgba(255,255,255,0.35)" duration="600ms"
            onClick={handleSave}
            className="glass-btn glass-btn-primary"
            style={{ width: '100%', padding: '0.65rem' }}
          >
            Save Configuration
          </RippleButton>
        </div>
      </div>
    </div>
  );
};
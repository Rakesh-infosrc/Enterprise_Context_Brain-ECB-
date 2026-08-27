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
} from 'lucide-react';
import { RippleButton } from "@/components/ui/ripple-button";
import { api } from '../../lib/api';

export const SettingsView: React.FC = () => {
  const [policyProfile, setPolicyProfile] = useState('enterprise_strict');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Connection fields
  const [dbxHost, setDbxHost] = useState('');
  const [dbxToken, setDbxToken] = useState('');
  const [jiraUrl, setJiraUrl] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [githubToken, setGithubToken] = useState('');

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
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load connections:', err);
        setLoading(false);
      });
  }, []);

  const handleSave = () => {
    api.saveConnectionSettings({
      databricks_host: dbxHost,
      databricks_token: dbxToken,
      jira_base_url: jiraUrl,
      jira_user_email: jiraEmail,
      jira_api_token: jiraToken,
      github_token: githubToken
    })
      .then(() => {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      })
      .catch((err) => {
        console.error('Failed to save connections:', err);
      });
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
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
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
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              Canonical Ingestion Connectors (Credentials &amp; Settings)
            </h3>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading credentials...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Databricks Connector */}
              <div style={{ background: 'rgba(17, 34, 54, 0.55)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>Databricks Integration</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Workspace Host URL</label>
                    <input type="text" value={dbxHost} onChange={(e) => setDbxHost(e.target.value)} className="glass-input" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.45rem', color: '#ffffff', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Personal Access Token (PAT)</label>
                    <input type="password" value={dbxToken} onChange={(e) => setDbxToken(e.target.value)} className="glass-input" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.45rem', color: '#ffffff', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                </div>
              </div>

              {/* Jira Connector */}
              <div style={{ background: 'rgba(17, 34, 54, 0.55)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>Jira Enterprise Integration</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Jira Base URL</label>
                    <input type="text" value={jiraUrl} onChange={(e) => setJiraUrl(e.target.value)} className="glass-input" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.45rem', color: '#ffffff', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>User Email Address</label>
                    <input type="text" value={jiraEmail} onChange={(e) => setJiraEmail(e.target.value)} className="glass-input" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.45rem', color: '#ffffff', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>API Token</label>
                    <input type="password" value={jiraToken} onChange={(e) => setJiraToken(e.target.value)} className="glass-input" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.45rem', color: '#ffffff', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                </div>
              </div>

              {/* GitHub Connector */}
              <div style={{ background: 'rgba(17, 34, 54, 0.55)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>GitHub Integration</h4>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Personal Access Token</label>
                  <input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} className="glass-input" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.45rem', color: '#ffffff', borderRadius: 'var(--radius-sm)' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Policy & Security Profile */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
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
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: policyProfile === prof.id ? 'rgba(92, 168, 255, 0.15)' : 'rgba(17, 34, 54, 0.4)',
                  border: policyProfile === prof.id ? '1px solid #5ca8ff' : '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: policyProfile === prof.id ? 'var(--accent-blue)' : '#ffffff', marginBottom: '0.2rem' }}>
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
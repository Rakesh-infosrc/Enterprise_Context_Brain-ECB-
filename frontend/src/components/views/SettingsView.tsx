// frontend/src/components/views/SettingsView.tsx

import React, { useState } from 'react';
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

export const SettingsView: React.FC = () => {
  const [policyProfile, setPolicyProfile] = useState('enterprise_strict');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const sources = [
    { name: 'Jira Enterprise', type: 'JIRA', status: 'Connected', endpoint: 'https://jira.acmefin.internal', lastSync: '1 hour ago', records: 18 },
    { name: 'GitHub Enterprise (acmefin/payments-core)', type: 'GIT', status: 'Connected', endpoint: 'git@github.com:acmefin/payments-core.git', lastSync: '2 hours ago', records: 45 },
    { name: 'Architecture Decision Records (ADRs)', type: 'ADR', status: 'Connected', endpoint: 'docs/architecture/decisions/', lastSync: '4 hours ago', records: 3 },
    { name: 'Slack Integration (#payments-architecture)', type: 'SLACK', status: 'Connected', endpoint: 'C05PAYMENTS', lastSync: '1 hour ago', records: 120 },
  ];

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="glass-pill active" style={{ fontSize: '0.75rem' }}>
            System Configuration
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Governance Profiles, Ingestion Connectors &amp; Gateway
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
          borderRadius: '10px',
          padding: '1rem',
          color: '#35d07f',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <CheckCircle2 size={18} />
          <span>Configuration saved successfully and applied to active Context Planning Engine!</span>
        </div>
      )}

      {/* Grid: Connectors vs Policy Profile */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
        {/* Left: Ingestion Connectors */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              Canonical Ingestion Connectors
            </h3>
            <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms" className="glass-btn" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
              <RefreshCw size={12} />
              <span>Sync All</span>
            </RippleButton>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {sources.map((src, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(17, 34, 54, 0.55)',
                  borderRadius: '10px',
                  padding: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                    {src.name}
                  </span>
                  <span className="glass-pill glass-btn-success" style={{ fontSize: '0.65rem' }}>
                    ● {src.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                  {src.endpoint}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: '#64748b' }}>
                  <span>Last Synced: {src.lastSync}</span>
                  <span>{src.records} canonical records</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Policy & Security Profile */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
            Governance &amp; Policy Profile
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
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
                  borderRadius: '10px',
                  background: policyProfile === prof.id ? 'rgba(92, 168, 255, 0.15)' : 'rgba(17, 34, 54, 0.4)',
                  border: policyProfile === prof.id ? '1px solid #5ca8ff' : '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: policyProfile === prof.id ? '#70b4ff' : '#ffffff', marginBottom: '0.2rem' }}>
                  {prof.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
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
// frontend/src/components/views/EvidenceExplorerView.tsx

import React, { useState } from 'react';
import {
  FileSearch,
  Search,
  Filter,
  FileText,
  GitCommit,
  GitPullRequest,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
  Shield,
  Clock,
} from 'lucide-react';
import { Evidence, SourceType } from '../../types';
import { RippleButton } from "@/components/ui/ripple-button";

interface EvidenceExplorerViewProps {
  evidenceList: Evidence[];
}

export const EvidenceExplorerView: React.FC<EvidenceExplorerViewProps> = ({ evidenceList }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<SourceType | 'all'>('all');
  const [onlyConflicts, setOnlyConflicts] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(evidenceList[0] || null);

  const filteredEvidence = evidenceList.filter((e) => {
    const matchesSearch =
      e.source_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.external_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = filterSource === 'all' || e.source_type === filterSource;
    const matchesConflict = !onlyConflicts || e.is_conflicting;
    return matchesSearch && matchesSource && matchesConflict;
  });

  const getIcon = (type: SourceType) => {
    switch (type) {
      case 'jira': return <FileText size={15} color="#5ca8ff" />;
      case 'git': return <GitCommit size={15} color="#35d07f" />;
      case 'adr': return <GitPullRequest size={15} color="#9b7cff" />;
      case 'slack': return <MessageSquare size={15} color="#f7b955" />;
      default: return <FileText size={15} color="#94a3b8" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="glass-pill active" style={{ fontSize: '0.75rem' }}>
            Provenance &amp; Multi-Source Search
          </span>
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
          Evidence Explorer
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
          Search cross-system canonical records across Jira, Git, ADR documents, and Slack with verifiable freshness and authority scores.
        </p>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by keyword, issue key (AEGIS-108), commit hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input"
            style={{ paddingLeft: '2.4rem', fontSize: '0.85rem' }}
          />
        </div>

        {/* Source Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Source:</span>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value as any)}
            style={{
              background: 'rgba(10, 20, 32, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '0.4rem 0.75rem',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          >
            <option value="all">All Sources</option>
            <option value="jira">Jira Tickets</option>
            <option value="git">Git Commits</option>
            <option value="adr">ADR Decisions</option>
            <option value="slack">Slack Messages</option>
          </select>
        </div>

        {/* Conflict Filter Toggle */}
        <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
          onClick={() => setOnlyConflicts(!onlyConflicts)}
          style={{
            background: onlyConflicts ? 'rgba(255, 107, 122, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: onlyConflicts ? '1px solid #ff6b7a' : '1px solid rgba(255, 255, 255, 0.1)',
            color: onlyConflicts ? '#ff6b7a' : '#94a3b8',
            borderRadius: '8px',
            padding: '0.4rem 0.85rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <AlertTriangle size={14} />
          <span>Show Contradictions Only</span>
        </RippleButton>
      </div>

      {/* Main Grid: Evidence Cards List vs Detailed Provenance Box */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* List of Evidence */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '640px', overflowY: 'auto' }}>
          {filteredEvidence.map((ev) => {
            const isSelected = selectedEvidence?.id === ev.id;
            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEvidence(ev)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: isSelected
                    ? 'rgba(92, 168, 255, 0.15)'
                    : ev.is_conflicting
                    ? 'rgba(255, 107, 122, 0.08)'
                    : 'rgba(17, 34, 54, 0.55)',
                  border: isSelected
                    ? '1px solid #5ca8ff'
                    : ev.is_conflicting
                    ? '1px solid rgba(255, 107, 122, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {getIcon(ev.source_type)}
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                      {ev.external_id} • {ev.source_title}
                    </span>
                  </div>
                  <span className="glass-pill" style={{ fontSize: '0.65rem' }}>
                    {ev.authority} auth
                  </span>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4, margin: '0.35rem 0' }}>
                  {ev.excerpt}
                </div>

                {ev.conflict_summary && (
                  <div style={{ fontSize: '0.7rem', color: '#ff6b7a', marginTop: '0.35rem', background: 'rgba(255, 107, 122, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    ⚠️ {ev.conflict_summary}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail Inspector */}
        {selectedEvidence && (
          <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Shield size={16} color="#5ca8ff" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                Provenance &amp; Source Verification
              </h3>
            </div>

            <div style={{
              background: 'rgba(10, 20, 32, 0.7)',
              borderRadius: '10px',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '1rem',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5ca8ff', marginBottom: '0.3rem' }}>
                Canonical Excerpt
              </div>
              <p style={{ fontSize: '0.85rem', color: '#f1f5f9', fontStyle: 'italic', lineHeight: 1.5 }}>
                &quot;{selectedEvidence.excerpt}&quot;
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.78rem', color: '#94a3b8' }}>
              <div><strong>Source System:</strong> {selectedEvidence.source_title} ({selectedEvidence.source_type.toUpperCase()})</div>
              <div><strong>External ID:</strong> {selectedEvidence.external_id}</div>
              <div><strong>Author / Committer:</strong> {selectedEvidence.author || 'System'}</div>
              <div><strong>Observed Timestamp:</strong> {new Date(selectedEvidence.observed_at).toLocaleString()}</div>
              <div><strong>Freshness Score:</strong> {(selectedEvidence.freshness_score * 100).toFixed(0)}%</div>
              <div><strong>Authority Rating:</strong> {selectedEvidence.authority.toUpperCase()}</div>

              {selectedEvidence.url && (
                <a
                  href={selectedEvidence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#5ca8ff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    marginTop: '0.5rem',
                    fontWeight: 600,
                  }}
                >
                  <span>Open in {selectedEvidence.source_type.toUpperCase()}</span>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
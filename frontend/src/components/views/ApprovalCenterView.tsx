// frontend/src/components/views/ApprovalCenterView.tsx

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Shield,
  AlertTriangle,
  Clock,
  ExternalLink,
  User,
  RefreshCw,
} from 'lucide-react';
import { ActionPreview, ActionStatus } from '../../types';
import { api } from '../../lib/api';

interface ApprovalCenterViewProps {
  actions: ActionPreview[];
  onRefresh: () => void;
}

export const ApprovalCenterView: React.FC<ApprovalCenterViewProps> = ({ actions, onRefresh }) => {
  const [selectedAction, setSelectedAction] = useState<ActionPreview | null>(actions[0] || null);
  const [comment, setComment] = useState('Approved following architectural review and Git roadmap reconciliation.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [outcomeMessage, setOutcomeMessage] = useState<string | null>(null);

  const pendingActions = actions.filter((a) => a.status === 'pending_approval');
  const pastActions = actions.filter((a) => a.status !== 'pending_approval');

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      const res = await api.approveAction(id, 'usr-sarah-jenkins', comment);
      setOutcomeMessage(`Action approved and executed successfully via MCP Gateway! Tool result: ${res.execution?.execution_result?.operation || 'COMPLETED'}`);
      onRefresh();
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    setIsProcessing(true);
    try {
      await api.rejectAction(id, 'usr-sarah-jenkins', comment || 'Rejected by operator');
      setOutcomeMessage('Action was rejected. No changes were made to downstream systems.');
      onRefresh();
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="glass-pill active" style={{ fontSize: '0.75rem' }}>
            Human-in-the-Loop Governance
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Zero Autonomous Production Bypass Gate
          </span>
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
          Governed Approval Center
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
          All high-impact mutations (Jira release schedules, Kafka partitions, Git tags, and architectural state changes) require explicit human review and cryptographic audit logging.
        </p>
      </div>

      {outcomeMessage && (
        <div style={{
          background: 'rgba(53, 208, 127, 0.15)',
          border: '1px solid rgba(53, 208, 127, 0.4)',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          color: '#35d07f',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <CheckCircle2 size={18} />
          <span>{outcomeMessage}</span>
        </div>
      )}

      {/* Main Grid: Pending Queue vs Action Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '1.5rem' }}>
        {/* Left: Actions Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Pending Approvals */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                Pending Review ({pendingActions.length})
              </h3>
              <span className="glass-pill" style={{ color: '#fb923c', borderColor: 'rgba(251, 146, 60, 0.4)' }}>
                Action Required
              </span>
            </div>

            {pendingActions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
                No pending actions requiring review.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {pendingActions.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAction(a)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: selectedAction?.id === a.id ? 'rgba(92, 168, 255, 0.15)' : 'rgba(17, 34, 54, 0.55)',
                      border: selectedAction?.id === a.id ? '1px solid #5ca8ff' : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span className="glass-pill" style={{ color: '#ff6b7a', fontSize: '0.65rem' }}>
                        {a.risk_class.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {a.target_system}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem' }}>
                      {a.summary}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                      Suggested by: <strong>{a.suggested_by_agent}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Audited Actions */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Recently Executed Actions ({pastActions.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pastActions.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setSelectedAction(a)}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(17, 34, 54, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{a.summary}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{a.target_system}</div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      background: a.status === 'completed' || a.status === 'approved' ? 'rgba(53, 208, 127, 0.15)' : 'rgba(255, 107, 122, 0.15)',
                      color: a.status === 'completed' || a.status === 'approved' ? '#35d07f' : '#ff6b7a',
                    }}
                  >
                    {a.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Selected Action Detail & Diff & Approve Button */}
        {selectedAction && (
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="glass-pill" style={{ color: '#ff6b7a', borderColor: 'rgba(255, 107, 122, 0.4)' }}>
                    {selectedAction.risk_class.toUpperCase()} MUTATION
                  </span>
                  <span className="glass-pill" style={{ color: '#5ca8ff' }}>
                    {selectedAction.tool_name}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedAction.summary}
                </h3>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1rem' }}>
              {selectedAction.description}
            </p>

            {/* Impact & Target System */}
            <div style={{
              background: 'rgba(10, 20, 32, 0.7)',
              borderRadius: '10px',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '1rem',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5ca8ff', marginBottom: '0.3rem' }}>
                Impact Assessment
              </div>
              <div style={{ fontSize: '0.825rem', color: '#f1f5f9' }}>
                {selectedAction.impact_assessment}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Target System: <strong>{selectedAction.target_system}</strong> • Reversibility: <strong>{(selectedAction.reversibility || 'moderate').toUpperCase()}</strong>
              </div>
            </div>

            {/* Diff Preview */}
            {selectedAction.diff_preview && (
              <div style={{
                background: 'rgba(5, 11, 20, 0.85)',
                borderRadius: '10px',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ color: '#64748b', marginBottom: '0.35rem' }}>// Mutation Payload Diff</div>
                <pre style={{ margin: 0, color: '#a5b4fc', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(selectedAction.diff_preview, null, 2)}
                </pre>
              </div>
            )}

            {/* Decision Controls */}
            {selectedAction.status === 'pending_approval' ? (
              <div>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                    Approver Audit Comment:
                  </label>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="glass-input"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    disabled={isProcessing}
                    onClick={() => handleApprove(selectedAction.id)}
                    className="glass-btn glass-btn-primary"
                    style={{ flex: 1, padding: '0.65rem' }}
                  >
                    {isProcessing ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    <span>Approve &amp; Execute</span>
                  </button>

                  <button
                    disabled={isProcessing}
                    onClick={() => handleReject(selectedAction.id)}
                    className="glass-btn glass-btn-danger"
                    style={{ flex: 1, padding: '0.65rem' }}
                  >
                    <XCircle size={16} />
                    <span>Reject Action</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(53, 208, 127, 0.15)',
                border: '1px solid rgba(53, 208, 127, 0.4)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#35d07f',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}>
                This action is already {selectedAction.status.toUpperCase()} and registered in the audit ledger.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

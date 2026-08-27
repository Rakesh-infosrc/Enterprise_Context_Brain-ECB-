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
import { RippleButton } from "@/components/ui/ripple-button";

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
      const res = await api.approveAction(id, comment, 'usr-sarah-jenkins');
      setOutcomeMessage(`Action approved and executed successfully via MCP Gateway! Tool result: ${res.execution?.message || 'COMPLETED'}`);
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
      await api.rejectAction(id, comment || 'Rejected by operator', 'usr-sarah-jenkins');
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
          <span className="glass-pill active" style={{ fontSize: 'var(--fs-xs)' }}>
            Human-in-the-Loop Governance
          </span>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            Zero Autonomous Production Bypass Gate
          </span>
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
          Governed Approval Center
        </h2>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          All high-impact mutations (Jira release schedules, Kafka partitions, Git tags, and architectural state changes) require explicit human review and cryptographic audit logging.
        </p>
      </div>

      {outcomeMessage && (
        <div style={{
          background: 'rgba(53, 208, 127, 0.15)',
          border: '1px solid rgba(53, 208, 127, 0.4)',
          borderRadius:'var(--radius-md)',
          padding: '1rem 1.25rem',
          color: 'var(--accent-emerald)',
          fontSize: 'var(--fs-base)',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--fs-base)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                Pending Review ({pendingActions.length})
              </h3>
              <span className="glass-pill" style={{ color: 'var(--accent-amber)', borderColor: 'rgba(251, 146, 60, 0.4)' }}>
                Action Required
              </span>
            </div>

            {pendingActions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-faint)', fontSize: 'var(--fs-base)' }}>
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
                      borderRadius:'var(--radius-md)',
                      background: selectedAction?.id === a.id ? 'rgba(92, 168, 255, 0.15)' : 'rgba(17, 34, 54, 0.55)',
                      border: selectedAction?.id === a.id ? '1px solid #5ca8ff' : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span className="glass-pill" style={{ color: 'var(--accent-rose)', fontSize: '0.65rem' }}>
                        {a.risk_class.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {a.target_system}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem' }}>
                      {a.summary}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                      Suggested by: <strong>{a.suggested_by_agent}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Audited Actions */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--fs-xs)' }}>
              Recently Executed Actions ({pastActions.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pastActions.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setSelectedAction(a)}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius:'var(--radius-sm)',
                    background: 'rgba(17, 34, 54, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>{a.summary}</div>
                    <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-faint)' }}>{a.target_system}</div>
                  </div>
                  <span
                    style={{
                      fontSize: 'var(--fs-2xs)',
                      fontWeight: 700,
                      padding: '0.15rem 0.4rem',
                      borderRadius:'var(--radius-sm)',
                      background: a.status === 'completed' || a.status === 'approved' ? 'rgba(53, 208, 127, 0.15)' : 'rgba(255, 107, 122, 0.15)',
                      color: a.status === 'completed' || a.status === 'approved' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
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
                  <span className="glass-pill" style={{ color: 'var(--accent-rose)', borderColor: 'rgba(255, 107, 122, 0.4)' }}>
                    {selectedAction.risk_class.toUpperCase()} MUTATION
                  </span>
                  <span className="glass-pill" style={{ color: 'var(--accent-blue)' }}>
                    {selectedAction.tool_name}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedAction.summary}
                </h3>
              </div>
            </div>

            <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
              {selectedAction.description}
            </p>

            {/* Impact & Target System */}
            <div style={{
              background: 'rgba(10, 20, 32, 0.7)',
              borderRadius:'var(--radius-md)',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '1rem',
            }}>
              <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '0.3rem' }}>
                Impact Assessment
              </div>
              <div style={{ fontSize: 'var(--fs-sm)', color: '#f1f5f9' }}>
                {selectedAction.impact_assessment}
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Target System: <strong>{selectedAction.target_system}</strong> • Reversibility: <strong>{(selectedAction.reversibility || 'moderate').toUpperCase()}</strong>
              </div>
            </div>

            {/* Diff Preview */}
            {selectedAction.diff_preview && (
              <div style={{
                background: 'rgba(5, 11, 20, 0.85)',
                borderRadius:'var(--radius-md)',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontFamily: 'monospace',
                fontSize: 'var(--fs-sm)',
                marginBottom: '1.25rem',
              }}>
                <div style={{ color: 'var(--text-faint)', marginBottom: '0.35rem' }}>// Mutation Payload Diff</div>
                <pre style={{ margin: 0, color: '#a5b4fc', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(selectedAction.diff_preview, null, 2)}
                </pre>
              </div>
            )}

            {/* Decision Controls */}
            {selectedAction.status === 'pending_approval' ? (
              <div>
                <div style={{ marginBottom: 'var(--fs-base)' }}>
                  <label style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Approver Audit Comment:
                  </label>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="glass-input"
                    style={{ fontSize: 'var(--fs-base)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 'var(--fs-xs)' }}>
                  <RippleButton rippleColor="rgba(255,255,255,0.35)" duration="600ms"
                    disabled={isProcessing}
                    onClick={() => handleApprove(selectedAction.id)}
                    className="glass-btn glass-btn-primary"
                    style={{ flex: 1, padding: '0.65rem' }}
                  >
                    {isProcessing ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    <span>Approve &amp; Execute</span>
                  </RippleButton>

                  <RippleButton rippleColor="rgba(92,168,255,0.25)" duration="600ms"
                    disabled={isProcessing}
                    onClick={() => handleReject(selectedAction.id)}
                    className="glass-btn glass-btn-danger"
                    style={{ flex: 1, padding: '0.65rem' }}
                  >
                    <XCircle size={16} />
                    <span>Reject Action</span>
                  </RippleButton>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(53, 208, 127, 0.15)',
                border: '1px solid rgba(53, 208, 127, 0.4)',
                borderRadius:'var(--radius-sm)',
                padding: '0.75rem 1rem',
                color: 'var(--accent-emerald)',
                fontSize: 'var(--fs-base)',
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
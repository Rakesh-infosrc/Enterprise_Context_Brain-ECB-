// frontend/src/components/views/AgentTraceView.tsx

import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Zap,
  Shield,
  Layers,
  Sparkles,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { AgentRun, AgentStep } from '../../types';

interface AgentTraceViewProps {
  agentRuns: AgentRun[];
}

export const AgentTraceView: React.FC<AgentTraceViewProps> = ({ agentRuns }) => {
  const [selectedRun, setSelectedRun] = useState<AgentRun | null>(agentRuns[0] || null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="glass-pill active" style={{ fontSize: '0.75rem' }}>
            OpenTelemetry &amp; Observability
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Operational Execution DAG &amp; Step Telemetry
          </span>
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
          Agent Trace &amp; Operations Inspector
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
          Inspect the exact step-by-step workflow DAG for every agent run: Authorization, Context Planning, Hybrid Retrieval, Evidence Scoring, Reasoning, Policy Check, and MCP Execution.
        </p>
      </div>

      {/* Main Grid: Runs List vs DAG Step Waterfall */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem' }}>
        {/* Left: Recent Agent Runs */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
            Recent Agent Runs ({agentRuns.length})
          </h3>

          {agentRuns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
              No runs recorded yet. Ask a question in Ask ECB to see real-time trace telemetry.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {agentRuns.map((run) => (
                <div
                  key={run.id}
                  onClick={() => setSelectedRun(run)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    background: selectedRun?.id === run.id ? 'rgba(92, 168, 255, 0.15)' : 'rgba(17, 34, 54, 0.55)',
                    border: selectedRun?.id === run.id ? '1px solid #5ca8ff' : '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5ca8ff', fontFamily: 'monospace' }}>
                      {run.trace_id}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                        background: 'rgba(53, 208, 127, 0.15)',
                        color: '#35d07f',
                      }}
                    >
                      {run.latency_ms}ms
                    </span>
                  </div>

                  <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.35rem' }}>
                    &quot;{run.query}&quot;
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
                    <span>Workflow: <strong>{run.workflow}</strong></span>
                    <span>Tokens: {run.total_tokens}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Detailed Execution DAG Waterfall */}
        {selectedRun ? (
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="glass-pill active" style={{ fontSize: '0.75rem' }}>
                    {selectedRun.trace_id}
                  </span>
                  <span className="glass-pill" style={{ color: '#35d07f' }}>
                    {(selectedRun.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                  Execution Pipeline Waterfall
                </h3>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8' }}>
                <div>Total Latency: <strong style={{ color: '#5ca8ff' }}>{selectedRun.latency_ms}ms</strong></div>
                <div>Tokens: <strong style={{ color: '#ffffff' }}>{selectedRun.total_tokens}</strong></div>
              </div>
            </div>

            {/* Steps Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {selectedRun.steps?.map((step, idx) => (
                <div
                  key={step.step_id || idx}
                  style={{
                    background: 'rgba(10, 20, 32, 0.7)',
                    borderRadius: '10px',
                    padding: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'rgba(53, 208, 127, 0.15)',
                        color: '#35d07f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}>
                        {idx + 1}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                        {step.title}
                      </span>
                      <span className="glass-pill" style={{ fontSize: '0.65rem' }}>
                        {step.stage}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#5ca8ff', fontWeight: 600 }}>
                      {step.duration_ms}ms
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4, margin: '0.35rem 0' }}>
                    {step.description}
                  </p>

                  {step.payload && Object.keys(step.payload).length > 0 && (
                    <div style={{
                      marginTop: '0.5rem',
                      background: 'rgba(5, 11, 20, 0.6)',
                      borderRadius: '6px',
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      color: '#94a3b8',
                    }}>
                      {JSON.stringify(step.payload)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            Select an agent run on the left to inspect execution steps.
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { GitBranch, ShieldCheck, Cpu, Database, CheckCircle2 } from 'lucide-react';

export default function TracesPage() {
  const steps = [
    {
      step: '1. Intent Recognition',
      agent: 'Context Intelligence Engine',
      details: 'Identified query intent as Root Cause Analysis (Confidence: 0.98)',
      status: 'SUCCESS',
    },
    {
      step: '2. Hybrid Context Retrieval',
      agent: 'HybridRetriever',
      details: 'Retrieved 5 memories across Semantic, Episodic, Procedural + Decision DEC-2026-0142',
      status: 'SUCCESS',
    },
    {
      step: '3. Evidence Ranking & Conflict Check',
      agent: 'AuthorityRanker & ContradictionDetector',
      details: 'Ranked Jira ticket JIRA-402 (High Trust) vs Teams Chat (Medium Trust). Flagged Status Conflict.',
      status: 'SUCCESS',
    },
    {
      step: '4. Sub-Agent Execution',
      agent: 'RiskAgent & DecisionAgent & ProjectAgent',
      details: 'Evaluated delivery bottleneck: Pending AWS IAM permission JIRA-402 causing 4-day project delay',
      status: 'SUCCESS',
    },
    {
      step: '5. Synthesis & HITL Policy Check',
      agent: 'ManagerAgent & PolicyEngine',
      details: 'Synthesized evidence-backed answer. Identified High-Risk action (Escalate AWS Access). Created approval ACT-AWS-001.',
      status: 'SUCCESS',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-blue-400" />
          Agent Execution Traces & Reasoning Graph
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Full execution tracing for agent decisions, context retrieval, tool calls, and governance policy evaluations.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-card border border-border space-y-6">
        {steps.map((s, idx) => (
          <div key={idx} className="relative flex items-start gap-4">
            {idx < steps.length - 1 && (
              <div className="absolute left-4 top-8 w-0.5 h-12 bg-gray-800" />
            )}
            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 z-10">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 p-4 rounded-xl bg-gray-900 border border-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">{s.step}</h4>
                <span className="text-xs font-mono text-gray-400">{s.agent}</span>
              </div>
              <p className="text-xs text-gray-300 mt-1.5">{s.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

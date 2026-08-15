'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Clock, ShieldAlert } from 'lucide-react';

interface ApprovalCardProps {
  approval: {
    id: string;
    action_type: string;
    target_system: string;
    risk_level: string;
    evidence_summary: string;
    status: string;
    payload: any;
  };
  onApprove: (id: string) => void;
}

export default function ApprovalCard({ approval, onApprove }: ApprovalCardProps) {
  const isPending = approval.status === 'PENDING';

  return (
    <div className="p-5 rounded-xl bg-card border border-border flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            {approval.risk_level} Risk Action
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            isPending ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            {approval.status}
          </span>
        </div>

        <h3 className="text-base font-semibold text-white mt-3">{approval.action_type}</h3>
        <p className="text-xs text-gray-400 mt-1">Target System: <span className="text-blue-400 font-mono">{approval.target_system}</span></p>

        <div className="mt-3 p-3 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-300">
          <span className="font-semibold text-gray-400">Justification Evidence:</span> {approval.evidence_summary}
        </div>
      </div>

      {isPending ? (
        <button
          onClick={() => onApprove(approval.id)}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Authorize & Execute Action via MCP
        </button>
      ) : (
        <div className="text-center text-xs text-emerald-400 font-medium py-2">
          ✅ Action Authorized and Audit Logged
        </div>
      )}
    </div>
  );
}

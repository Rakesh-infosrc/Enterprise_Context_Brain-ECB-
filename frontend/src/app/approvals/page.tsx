'use client';

import React, { useEffect, useState } from 'react';
import { fetchPendingApprovals, approveAction } from '@/lib/api';
import ApprovalCard from '@/components/approvals/ApprovalCard';
import { CheckSquare } from 'lucide-react';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);

  const loadApprovals = () => {
    fetchPendingApprovals().then(setApprovals).catch(console.error);
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleApprove = async (id: string) => {
    await approveAction(id);
    loadApprovals();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-purple-400" />
          Human-in-the-Loop (HITL) Action Queue
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Review high-impact actions recommended by AI agents before execution through governed MCP tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {approvals.length > 0 ? (
          approvals.map((a) => (
            <ApprovalCard key={a.id} approval={a} onApprove={handleApprove} />
          ))
        ) : (
          <div className="col-span-2 p-8 rounded-xl bg-card border border-border text-center text-gray-500">
            No pending action approvals in queue.
          </div>
        )}
      </div>
    </div>
  );
}

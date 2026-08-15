'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock, Cpu, ShieldCheck } from 'lucide-react';
import { fetchDecisions, fetchPendingApprovals } from '@/lib/api';

export default function DashboardPage() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);

  useEffect(() => {
    fetchDecisions().then(setDecisions).catch(console.error);
    fetchPendingApprovals().then(setApprovals).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Manager Executive Overview</h2>
        <p className="text-sm text-gray-400 mt-1">Real-time organizational context, delivery health, and active decisions for Project X.</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Project Health</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-2">Delayed (-4 days)</div>
          <p className="text-[11px] text-gray-500 mt-1">AWS IAM access permission pending</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Active Decisions</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">{decisions.length || 1} Record</div>
          <p className="text-[11px] text-gray-500 mt-1">Structured Decision Memory active</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Pending HITL Approvals</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400 mt-2">{approvals.filter(a => a.status === 'PENDING').length} Action</div>
          <p className="text-[11px] text-gray-500 mt-1">High-risk action requiring approval</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Context Freshness</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-2">Real-time (&lt; 5m)</div>
          <p className="text-[11px] text-gray-500 mt-1">Jira, Git & Telemetry synced</p>
        </div>
      </div>

      {/* Structured Decision Memory Table */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <h3 className="text-base font-semibold text-white mb-4">Structured Decision Memory (ADRs & Scope Changes)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-800 text-gray-400 uppercase font-semibold">
              <tr>
                <th className="pb-3">Decision ID</th>
                <th className="pb-3">Decision</th>
                <th className="pb-3">Owner</th>
                <th className="pb-3">Reason</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Supersedes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {decisions.length > 0 ? (
                decisions.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-900/50">
                    <td className="py-3 font-mono text-blue-400 font-semibold">{d.id}</td>
                    <td className="py-3 max-w-xs">{d.decision}</td>
                    <td className="py-3 text-gray-400">{d.owner}</td>
                    <td className="py-3 max-w-xs text-gray-400">{d.reason}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-gray-500">{d.supersedes || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">
                    Connect backend to load decisions dataset.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

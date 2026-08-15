'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface EvidenceCardProps {
  evidence: Array<{
    id: string;
    source_type: string;
    source_id: string;
    content: string;
    trust_label: string;
    score: number;
  }>;
  conflicts: Array<{
    type: string;
    description: string;
    authoritative_source: string;
    conflicting_source: string;
  }>;
}

export default function EvidenceCard({ evidence, conflicts }: EvidenceCardProps) {
  return (
    <div className="mt-4 space-y-4">
      {/* Contradiction Alert if present */}
      {conflicts && conflicts.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-400">Source Contradiction Detected</h4>
            {conflicts.map((c, i) => (
              <p key={i} className="text-xs text-amber-200/80 mt-1">
                {c.description} (Authoritative: <span className="font-semibold">{c.authoritative_source}</span>)
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Evidence Sources Accordion/List */}
      <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          Ranked Enterprise Evidence Lineage
        </h4>

        <div className="space-y-2">
          {evidence && evidence.map((item) => (
            <div key={item.id} className="p-3 rounded-lg bg-gray-950 border border-gray-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {item.source_type}
                  </span>
                  <span className="text-xs font-mono text-gray-400">{item.source_id}</span>
                </div>
                <p className="text-xs text-gray-300 mt-1.5">{item.content}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-semibold text-emerald-400">{item.trust_label} Trust</span>
                <div className="text-[10px] text-gray-500 font-mono">Score: {item.score}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Database, Search, ShieldCheck } from 'lucide-react';

export default function MemoryPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-emerald-400" />
          Organizational Memory Store
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Explore structured and vector memory across 5 types: Semantic, Episodic, Procedural, Decision, and Experiential.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-card border border-border text-center text-gray-400">
        <Search className="w-10 h-10 mx-auto mb-2 text-gray-500" />
        <p className="text-sm font-medium">Vector & Hybrid Search Explorer Active</p>
        <p className="text-xs text-gray-500 mt-1">Indexed with pgvector (1536-dim OpenAI Embeddings)</p>
      </div>
    </div>
  );
}

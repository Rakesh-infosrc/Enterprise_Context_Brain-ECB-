'use client';

import React from 'react';
import { Brain, ShieldCheck, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-wide">Enterprise Context Brain</h1>
          <p className="text-xs text-gray-400">Governed Decision Intelligence & Organizational Memory</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>RBAC: Manager / Project Lead</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
          <User className="w-4 h-4 text-gray-300" />
        </div>
      </div>
    </header>
  );
}

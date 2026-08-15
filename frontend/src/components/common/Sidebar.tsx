'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, CheckSquare, GitBranch, Database } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Decision Support Chat', href: '/chat', icon: MessageSquare },
    { name: 'Pending Approvals (HITL)', href: '/approvals', icon: CheckSquare },
    { name: 'Agent Execution Traces', href: '/traces', icon: GitBranch },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card/40 flex flex-col p-4 gap-2 min-h-[calc(100vh-4rem)]">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 py-2">
        Manager Views
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </aside>
  );
}

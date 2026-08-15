'use client';

import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { queryManagerAgent } from '@/lib/api';
import EvidenceCard from '@/components/chat/EvidenceCard';
import Link from 'next/link';

export default function ChatPage() {
  const [question, setQuestion] = useState('Why is Project X delayed, what changed this week, and what should I do?');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  const handleSend = async (qText?: string) => {
    const query = qText || question;
    if (!query.trim()) return;

    const userMsg = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const data = await queryManagerAgent(query);
      const agentMsg = {
        role: 'agent',
        content: data.final_answer,
        intent: data.intent,
        confidence: data.confidence_score,
        evidence: data.evidence,
        conflicts: data.conflicts,
        recommended_action: data.recommended_action,
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: '⚠️ Backend API offline. Please start backend container via `docker-compose up` or `uvicorn`.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          Manager Decision Intelligence Assistant
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Ask complex managerial questions with context-aware, evidence-backed reasoning.
        </p>
      </div>

      {/* Quick Prompt Presets */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => {
            const q = 'Why is Project X delayed, what changed this week, and what should I do?';
            setQuestion(q);
            handleSend(q);
          }}
          className="px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-medium shrink-0 transition-all"
        >
          🔍 Primary Demo: Root Cause & Action Analysis
        </button>
        <button
          onClick={() => {
            const q = 'What are the top risks for Project X this week?';
            setQuestion(q);
            handleSend(q);
          }}
          className="px-3 py-1.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium shrink-0 transition-all"
        >
          ⚠️ Risk Intelligence & Blocker Assessment
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-xl bg-card border border-border">
        {messages.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Bot className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm">Click a preset above or ask a question to start reasoning over Organizational Memory.</p>
          </div>
        )}

        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'agent' && (
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
            )}

            <div className={`max-w-2xl rounded-xl p-4 ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-200'}`}>
              {m.intent && (
                <div className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-gray-800">
                  <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                    Intent: {m.intent}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Confidence: {(m.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}

              <div className="text-sm whitespace-pre-line leading-relaxed">{m.content}</div>

              {/* Recommended Action Box */}
              {m.recommended_action && (
                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      Recommended HITL Action
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      High Risk (Approval Needed)
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">{m.recommended_action.title}</p>
                  <Link
                    href="/approvals"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:underline mt-2"
                  >
                    Go to Pending Approvals Queue <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Evidence Lineage & Contradiction accordion */}
              {m.evidence && (
                <EvidenceCard evidence={m.evidence} conflicts={m.conflicts} />
              )}
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-gray-400 italic py-4">
            <Bot className="w-4 h-4 animate-spin text-blue-400" />
            Analyzing Organizational Memory & specialized sub-agents...
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a project or manager question..."
          className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>Ask Agent</span>
        </button>
      </div>
    </div>
  );
}

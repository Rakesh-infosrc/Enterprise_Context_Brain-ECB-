// frontend/src/components/views/SkillsMem0View.tsx

import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  BookOpen,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Shield,
  Clock,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { SkillMetadata, Mem0MemoryItem } from '../../types';
import { api } from '../../lib/api';

export const SkillsMem0View: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'skills' | 'mem0' | 'qdrant'>('skills');
  const [skills, setSkills] = useState<SkillMetadata[]>([]);
  const [memories, setMemories] = useState<Mem0MemoryItem[]>([]);
  const [qdrantStats, setQdrantStats] = useState<any>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillMetadata | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.getSkills().then((res) => {
      setSkills(res);
      if (res.length > 0) setSelectedSkill(res[0]);
    }).catch(console.error);

    api.getMem0Memories().then(setMemories).catch(console.error);
    api.getQdrantStats().then(setQdrantStats).catch(console.error);
  }, []);

  const filteredMemories = memories.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="glass-pill active" style={{ fontSize: '0.75rem' }}>
            Advanced GenAI Stack
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            SKILL.md Modules • Mem0 Long-Term Memory • Qdrant Vector Engine
          </span>
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
          Skills, Memory &amp; Vector Subsystems
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
          Inspect dynamic runtime skills loaded from <code style={{ color: '#5ca8ff' }}>backend/skills/</code>, continuous Mem0 episodic learnings, and Qdrant hybrid vector embeddings.
        </p>

        {/* Sub-tab Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            onClick={() => setActiveTab('skills')}
            className={`glass-pill ${activeTab === 'skills' ? 'active' : ''}`}
            style={{ cursor: 'pointer', padding: '0.45rem 1rem', fontSize: '0.825rem' }}
          >
            <BookOpen size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
            SKILL.md Playbooks ({skills.length})
          </button>
          <button
            onClick={() => setActiveTab('mem0')}
            className={`glass-pill ${activeTab === 'mem0' ? 'active' : ''}`}
            style={{ cursor: 'pointer', padding: '0.45rem 1rem', fontSize: '0.825rem' }}
          >
            <BrainCircuit size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
            Mem0 Long-Term Memory ({memories.length})
          </button>
          <button
            onClick={() => setActiveTab('qdrant')}
            className={`glass-pill ${activeTab === 'qdrant' ? 'active' : ''}`}
            style={{ cursor: 'pointer', padding: '0.45rem 1rem', fontSize: '0.825rem' }}
          >
            <Database size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
            Qdrant Vector Engine
          </button>
        </div>
      </div>

      {/* Tab 1: Skills Explorer */}
      {activeTab === 'skills' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '1.5rem' }}>
          {/* Skills List */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
              Discovered Skills ({skills.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {skills.map((skill) => (
                <div
                  key={skill.name}
                  onClick={() => setSelectedSkill(skill)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    background: selectedSkill?.name === skill.name ? 'rgba(92, 168, 255, 0.15)' : 'rgba(17, 34, 54, 0.55)',
                    border: selectedSkill?.name === skill.name ? '1px solid #5ca8ff' : '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedSkill?.name === skill.name ? '#70b4ff' : '#ffffff' }}>
                      {skill.name}
                    </span>
                    <span className="glass-pill" style={{ fontSize: '0.65rem' }}>
                      v{skill.version}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.3 }}>
                    {skill.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Detail / Playbook Inspector */}
          {selectedSkill ? (
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className="glass-pill active" style={{ fontSize: '0.75rem' }}>
                      {selectedSkill.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Author: {selectedSkill.author}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                    Executable Procedural Playbook
                  </h3>
                </div>
              </div>

              <div style={{
                background: 'rgba(5, 11, 20, 0.7)',
                borderRadius: '10px',
                padding: '1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '0.825rem',
                color: '#cbd5e1',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                maxHeight: '480px',
                overflowY: 'auto',
              }}>
                {selectedSkill.instructions}
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Select a skill to inspect its YAML metadata and executable steps.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Mem0 Memory Explorer */}
      {activeTab === 'mem0' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                Continuous Mem0 Memory Ledger ({memories.length})
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Dynamic long-term memory capturing resolution patterns and human approval context.
              </p>
            </div>

            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search long-term memory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '2.2rem', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredMemories.map((mem) => (
              <div
                key={mem.id}
                style={{
                  background: 'rgba(17, 34, 54, 0.55)',
                  borderRadius: '10px',
                  padding: '1.1rem',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="glass-pill active" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    {mem.type}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#35d07f', fontWeight: 600 }}>
                    {(mem.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </div>

                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff' }}>
                  {mem.title}
                </div>

                <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4, margin: 0 }}>
                  {mem.content}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.68rem', color: '#64748b' }}>
                  <span>User: {mem.user_id}</span>
                  <span>Decay: {mem.decay_half_life_days}d</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Qdrant Vector Stats */}
      {activeTab === 'qdrant' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div className="glass-card">
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem' }}>
              Collection Name
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#5ca8ff' }}>
              {qdrantStats?.collection_name || 'ecb_canonical_evidence'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#35d07f', marginTop: '0.35rem' }}>
              ● Status: {qdrantStats?.status || 'GREEN'}
            </div>
          </div>

          <div className="glass-card">
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem' }}>
              Vector Dimension
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
              {qdrantStats?.vector_dimension || 384}-dim Dense
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              Distance Metric: {qdrantStats?.distance_metric || 'Cosine'}
            </div>
          </div>

          <div className="glass-card">
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem' }}>
              Indexed Payload Fields
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
              {qdrantStats?.indexed_payload_fields?.join(', ') || 'project_id, source_type, authority'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#5ca8ff', marginTop: '0.35rem' }}>
              HNSW P95 Search: {qdrantStats?.p95_search_latency_ms || 12.4}ms
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

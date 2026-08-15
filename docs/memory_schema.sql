-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR PRIMARY KEY,
    code VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    status VARCHAR DEFAULT 'Active',
    owner_role VARCHAR DEFAULT 'Engineering Lead',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Structured Decision Memory (PRD Section 9)
CREATE TABLE IF NOT EXISTS decision_memories (
    id VARCHAR PRIMARY KEY, -- DEC-2026-XXXX
    project_code VARCHAR NOT NULL,
    decision TEXT NOT NULL,
    owner VARCHAR NOT NULL,
    reason TEXT NOT NULL,
    alternatives JSONB DEFAULT '[]',
    evidence JSONB DEFAULT '[]',
    expected_outcome TEXT,
    actual_outcome TEXT DEFAULT 'Pending',
    status VARCHAR DEFAULT 'Active',
    confidence FLOAT DEFAULT 0.95,
    supersedes VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizational Memories Store (Vector + Structured)
CREATE TABLE IF NOT EXISTS organizational_memories (
    id VARCHAR PRIMARY KEY,
    project_code VARCHAR,
    memory_type VARCHAR NOT NULL, -- semantic, episodic, procedural, experiential
    content TEXT NOT NULL,
    source_type VARCHAR, -- System of Record, Approved Decision, Official Ticket, Repository, Meeting Notes, Chat
    source_id VARCHAR,
    source_trust_level VARCHAR DEFAULT 'High',
    embedding vector(1536),
    extra_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Action Approvals (HITL)
CREATE TABLE IF NOT EXISTS action_approvals (
    id VARCHAR PRIMARY KEY,
    action_type VARCHAR NOT NULL,
    target_system VARCHAR NOT NULL,
    risk_level VARCHAR NOT NULL, -- Low, Medium, High, Critical
    payload JSONB DEFAULT '{}',
    evidence_summary TEXT,
    status VARCHAR DEFAULT 'PENDING',
    requested_by_agent VARCHAR DEFAULT 'ManagerAgent',
    approved_by_user VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP
);

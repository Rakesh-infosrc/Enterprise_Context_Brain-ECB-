import asyncio
import os
import sys

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.db.session import engine, Base
from app.db.models.organization import Project
from app.db.models.memory import OrganizationalMemory
from app.db.models.decision import DecisionMemory
from app.db.models.evidence import EvidenceSource
from app.db.models.approval import ActionApproval

async def seed_data():
    print("🚀 Initializing Database Schema and pgvector extension...")
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    print("🌱 Seeding Synthetic Organizational Memory (Project X / KCF Demo Scenario)...")
    
    from sqlalchemy.ext.asyncio import AsyncSession
    async with AsyncSession(engine) as db:
        # 1. Project
        proj = Project(
            code="PROJECT_X",
            name="KCF Core Framework",
            description="Enterprise Context Intelligence Data Pipeline",
            status="Delayed",
            owner_role="Engineering Lead"
        )
        db.add(proj)

        # 2. Decision Memory (Section 9 PRD)
        dec1 = DecisionMemory(
            id="DEC-2026-0142",
            project_code="PROJECT_X",
            decision="Move data pipeline processing from Databricks to AWS Lambda serverless architecture",
            owner="Engineering Lead",
            reason="Achieve 30% lower processing costs and improve horizontal scaling latency",
            alternatives=["Stay on Databricks", "Deploy on Kubernetes ECS", "AWS Lambda Serverless"],
            evidence=["JIRA-402", "ADR-2026-012", "Architecture Review Meeting Aug 10"],
            expected_outcome="30% lower processing cost & sub-500ms latency",
            actual_outcome="Pending AWS IAM Permission Approval",
            status="Active",
            confidence=0.95,
            supersedes="DEC-2026-0101"
        )
        db.add(dec1)

        # 3. Memories across 5 memory types
        m1 = OrganizationalMemory(
            project_code="PROJECT_X",
            memory_type="semantic",
            content="Project X utilizes AWS Lambda and Databricks for real-time telemetry processing.",
            source_type="Approved Decision",
            source_id="ADR-2026-012",
            source_trust_level="Very High"
        )

        m2 = OrganizationalMemory(
            project_code="PROJECT_X",
            memory_type="episodic",
            content="AWS IAM permission access ticket JIRA-402 opened on Aug 12 is BLOCKED due to security review delay.",
            source_type="Official Ticket",
            source_id="JIRA-402",
            source_trust_level="High"
        )

        m3 = OrganizationalMemory(
            project_code="PROJECT_X",
            memory_type="procedural",
            content="Production deployment policy requires Security Lead approval for cross-account IAM role assumptions.",
            source_type="System of Record",
            source_id="SOP-SEC-004",
            source_trust_level="Very High"
        )

        m4 = OrganizationalMemory(
            project_code="PROJECT_X",
            memory_type="episodic",
            content="Teams chat message from lead dev: 'AWS access is fine, we are on track for Friday release.'",
            source_type="Chat",
            source_id="TEAMS-MSG-9921",
            source_trust_level="Medium"
        )

        m5 = OrganizationalMemory(
            project_code="PROJECT_X",
            memory_type="experiential",
            content="Previous migration failed in Q1 due to missing IAM role validation before deployment window.",
            source_type="Meeting Notes",
            source_id="MEET-POSTMORTEM-Q1",
            source_trust_level="Medium"
        )

        db.add_all([m1, m2, m3, m4, m5])

        # 4. Action Approval (Pending)
        approval = ActionApproval(
            action_type="Create Escalation",
            target_system="Jira / IAM Gateway",
            risk_level="High",
            payload={
                "title": "Escalate AWS IAM Access Dependency for Project X",
                "assignee": "Infra Lead",
                "jira_key": "JIRA-402"
            },
            evidence_summary="Blocked AWS IAM permission JIRA-402 causing 4-day project delay",
            status="PENDING",
            requested_by_agent="ManagerAgent"
        )
        db.add(approval)

        await db.commit()
        print("✅ Database successfully seeded with demo dataset!")

if __name__ == "__main__":
    asyncio.run(seed_data())

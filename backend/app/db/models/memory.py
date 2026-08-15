from sqlalchemy import Column, String, Text, DateTime, Float, JSON, Enum
from pgvector.sqlalchemy import Vector
from datetime import datetime
import uuid
import enum
from app.db.session import Base
from app.config import settings

class MemoryType(str, enum.Enum):
    SEMANTIC = "semantic"       # Stable facts (e.g. "Project uses Databricks")
    EPISODIC = "episodic"       # Events/history (e.g. "Deployment failed on Aug 11")
    PROCEDURAL = "procedural"   # SOPs & Playbooks (e.g. "Prod deployment procedure")
    EXPERIENTIAL = "experiential"# Lessons learned (e.g. "Previous migration failed due to validation")

class OrganizationalMemory(Base):
    __tablename__ = "organizational_memories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_code = Column(String, index=True)
    memory_type = Column(String, index=True, nullable=False) # semantic, episodic, procedural, experiential
    content = Column(Text, nullable=False)
    source_type = Column(String, index=True) # Jira, Git, ADR, Meeting, Incident, Telemetry
    source_id = Column(String, nullable=True) # ticket key, commit hash, ADR filename
    source_trust_level = Column(String, default="High") # Very High, High, Medium, Low
    
    # Vector embedding using pgvector
    embedding = Column(Vector(settings.VECTOR_DIMENSION), nullable=True)
    
    extra_metadata = Column(JSON, default=dict) # TTL, timestamps, entities
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

from sqlalchemy import Column, String, Text, DateTime, Float, JSON
from datetime import datetime
import uuid
from app.db.session import Base

class DecisionMemory(Base):
    __tablename__ = "decision_memories"

    id = Column(String, primary_key=True) # e.g. "DEC-2026-0142"
    project_code = Column(String, index=True, nullable=False)
    decision = Column(Text, nullable=False) # e.g. "Move pipeline from X to Y"
    owner = Column(String, nullable=False) # e.g. "Engineering Lead"
    reason = Column(Text, nullable=False) # e.g. "Cost and scalability"
    alternatives = Column(JSON, default=list) # ["Option A", "Option B", "Option C"]
    evidence = Column(JSON, default=list) # ["Jira ticket", "ADR", "meeting"]
    expected_outcome = Column(Text) # e.g. "30% lower processing cost"
    actual_outcome = Column(Text, default="Pending")
    status = Column(String, default="Active") # Active, Superseded, Expired
    confidence = Column(Float, default=0.95)
    supersedes = Column(String, nullable=True) # e.g. "DEC-2026-0101"
    created_at = Column(DateTime, default=datetime.utcnow)

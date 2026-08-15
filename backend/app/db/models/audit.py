from sqlalchemy import Column, String, Text, DateTime, JSON
from datetime import datetime
import uuid
from app.db.session import Base

class AuditTrail(Base):
    __tablename__ = "audit_trails"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String, nullable=False) # QUERY, RETRIEVAL, TOOL_CALL, APPROVAL
    actor = Column(String, nullable=False) # Agent ID or User ID
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

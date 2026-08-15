from sqlalchemy import Column, String, Text, DateTime, JSON
from datetime import datetime
import uuid
from app.db.session import Base

class EvidenceSource(Base):
    __tablename__ = "evidence_sources"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source_type = Column(String, index=True) # System of Record, Approved Decision, Official Ticket, Repository, Meeting Notes, Chat
    title = Column(String, nullable=False)
    trust_level = Column(String, nullable=False) # Very High, High, Medium, Low
    url_or_ref = Column(String)
    content_snippet = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

from sqlalchemy import Column, String, Text, DateTime, JSON
from datetime import datetime
import uuid
from app.db.session import Base

class ActionApproval(Base):
    __tablename__ = "action_approvals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    action_type = Column(String, nullable=False) # e.g. "Create Escalation", "Change Prod Config"
    target_system = Column(String, nullable=False) # Jira, AWS, Git
    risk_level = Column(String, nullable=False) # Low, Medium, High, Critical
    payload = Column(JSON, default=dict)
    evidence_summary = Column(Text)
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED, EXECUTED
    requested_by_agent = Column(String, default="ManagerAgent")
    approved_by_user = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    executed_at = Column(DateTime, nullable=True)

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.session import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String, unique=True, index=True, nullable=False) # e.g. "KCF" or "PROJECT_X"
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="Active") # Active, Delayed, Completed
    owner_role = Column(String, default="Engineering Lead")
    created_at = Column(DateTime, default=datetime.utcnow)

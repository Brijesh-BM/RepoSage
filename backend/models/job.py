import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from db.session import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    repo_url = Column(String(255), nullable=False)
    status = Column(String(50), default="pending")  # pending, running, done, failed
    github_token = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

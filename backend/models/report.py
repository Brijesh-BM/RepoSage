import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from db.session import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    health_score = Column(Integer, nullable=False, default=100)
    tech_stack = Column(JSON, nullable=False, default=list)
    critical_issues = Column(JSON, nullable=False, default=list)
    security_risks = Column(JSON, nullable=False, default=list)
    tech_debt = Column(JSON, nullable=False, default=list)
    recommendations = Column(JSON, nullable=False, default=list)
    next_actions = Column(JSON, nullable=False, default=list)
    positive_signals = Column(JSON, nullable=True, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

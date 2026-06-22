from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from backend.db.session import Base

class AgentStep(Base):
    __tablename__ = "agent_steps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    phase = Column(String(50), nullable=False)  # observe, understand, reason, act, report
    message = Column(String(500), nullable=False)
    status = Column(String(50), nullable=False)  # pending, running, done, failed
    progress = Column(Float, nullable=False, default=0.0)  # 0.0 to 1.0
    created_at = Column(DateTime, default=datetime.utcnow)

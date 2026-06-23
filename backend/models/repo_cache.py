from datetime import datetime, timedelta
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON
from db.session import Base

class RepoCache(Base):
    __tablename__ = "repo_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repo_url = Column(String(255), nullable=False, unique=True, index=True)
    file_tree = Column(JSON, nullable=False, default=list)
    readme = Column(Text, nullable=True)
    issues = Column(JSON, nullable=False, default=list)
    prs = Column(JSON, nullable=False, default=list)
    commits = Column(JSON, nullable=False, default=list)
    cached_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(hours=6))

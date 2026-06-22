from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class CriticalIssue(BaseModel):
    title: str
    severity: str
    affected_files: List[str]
    root_cause: str
    fix: str
    confidence: float
    exploitability: Optional[str] = None
    attack_vector: Optional[str] = None

class SecurityRisk(BaseModel):
    title: str
    severity: str
    description: str
    suggested_fix: str
    exploitability: Optional[str] = None
    attack_vector: Optional[str] = None

class TechDebtItem(BaseModel):
    category: str
    description: str
    severity: str
    estimated_effort: str

class Recommendation(BaseModel):
    action: str
    rationale: str
    priority: str

class PositiveSignal(BaseModel):
    signal: str
    evidence: str

class ReportResponse(BaseModel):
    id: str
    job_id: str
    health_score: int
    tech_stack: List[str]
    critical_issues: List[CriticalIssue]
    security_risks: List[SecurityRisk]
    tech_debt: List[TechDebtItem]
    recommendations: List[Recommendation]
    next_actions: List[str]
    created_at: datetime
    positive_signals: List[PositiveSignal] = []

    class Config:
        from_attributes = True

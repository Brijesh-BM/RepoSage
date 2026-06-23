from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from db.session import get_db
from models.report import Report
from schemas.report import ReportResponse

router = APIRouter()

@router.get("/reports/{job_id}", response_model=ReportResponse)
async def get_report(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).where(Report.job_id == job_id))
    db_report = result.scalars().first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found for this job")
    
    response_data = ReportResponse(
        id=db_report.id,
        job_id=db_report.job_id,
        health_score=db_report.health_score,
        tech_stack=db_report.tech_stack,
        critical_issues=db_report.critical_issues,
        security_risks=db_report.security_risks,
        tech_debt=db_report.tech_debt,
        recommendations=db_report.recommendations,
        next_actions=db_report.next_actions,
        created_at=db_report.created_at,
        positive_signals=db_report.positive_signals or []
    )
    return response_data

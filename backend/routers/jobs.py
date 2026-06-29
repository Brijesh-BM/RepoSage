import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from db.session import get_db
from models.job import Job
from schemas.job import JobCreate, JobResponse

# The orchestrator will be implemented next
from agent.orchestrator import run_agent_job

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/jobs", response_model=JobResponse)
async def create_job(
    payload: JobCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    try:
        db_job = Job(
            repo_url=payload.repo_url,
            status="pending"
        )
        db.add(db_job)
        await db.commit()
        await db.refresh(db_job)
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating job: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    
    # Start the agent orchestrator as a FastAPI BackgroundTask
    job_id = db_job.id
    background_tasks.add_task(run_agent_job, job_id, payload.github_token)
    logger.info(f"Background task scheduled for {db_job.id}")
    
    return db_job

@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Job).where(Job.id == job_id))
        db_job = result.scalars().first()
    except Exception as e:
        logger.error(f"Error retrieving job: {e}")
        raise HTTPException(status_code=500, detail="Database error")
        
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    return db_job

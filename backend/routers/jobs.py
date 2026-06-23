from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from db.session import get_db
from models.job import Job
from schemas.job import JobCreate, JobResponse

# The orchestrator will be implemented next
from agent.orchestrator import run_agent_job

router = APIRouter()

@router.post("/jobs", response_model=JobResponse)
async def create_job(
    payload: JobCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    db_job = Job(
        repo_url=payload.repo_url,
        github_token=payload.github_token,
        status="pending"
    )
    db.add(db_job)
    await db.commit()
    await db.refresh(db_job)
    
    # Start the agent orchestrator as a FastAPI BackgroundTask
    job_id = db_job.id
    background_tasks.add_task(run_agent_job, job_id)
    print(f"Background task scheduled for {db_job.id}")
    
    return db_job

@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    db_job = result.scalars().first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    return db_job

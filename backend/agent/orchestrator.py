import asyncio
import logging
import traceback
import time
from sqlalchemy.future import select
from db.session import SessionLocal
from models.job import Job
from models.agent_step import AgentStep

# Import phases
from agent.phases.observe import run_observe
from agent.phases.understand import run_understand
from agent.phases.reason import run_reason
from agent.phases.act import run_act
from agent.phases.report import run_report
from agent.tools.github_client import GitHubClient, parse_repo_url

logger = logging.getLogger(__name__)

async def write_step(db, job_id: str, phase: str, message: str, status: str, progress: float):
    step = AgentStep(
        job_id=job_id,
        phase=phase,
        message=message,
        status=status,
        progress=progress
    )
    db.add(step)
    await db.commit()

async def run_agent_job(job_id: str, github_token: str = None):
    logger.info(f"Starting agent job {job_id}")
    
    async with SessionLocal() as db:
        # 1. Fetch job
        try:
            result = await db.execute(select(Job).where(Job.id == job_id))
            job = result.scalars().first()
            if not job:
                logger.error(f"Job {job_id} not found in database")
                return
            
            # Update job status to running
            job.status = "running"
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.error(f"Database error during initialization of job {job_id}: {e}")
            return
        
        # Instantiate and configure GitHubClient
        github_client = GitHubClient(token=github_token)
        try:
            owner, repo_name = parse_repo_url(job.repo_url)
            # Wrap blocking PyGithub call using asyncio.to_thread
            github_client.repo = await asyncio.to_thread(github_client.client.get_repo, f"{owner}/{repo_name}")
        except Exception as e:
            logger.warning(f"Failed to pre-initialize repo object on GitHubClient: {e}")
        
        try:
            logger.info("Phase 1: Starting repository observation")

            await write_step(
                db,
                job_id,
                "observe",
                "Accessing GitHub repository and reading metadata...",
                "running",
                0.1
            )

            logger.info("[PHASE START] Phase: observe")
            start_observe = time.time()
            repo_data = await run_observe(job.repo_url, github_token, db)
            duration_observe = time.time() - start_observe
            logger.info(f"[PHASE END] Phase: observe, Duration: {duration_observe:.2f}s")

            logger.info("Phase 1: Observation completed successfully")
            
            # === PHASE 2: UNDERSTAND ===
            await write_step(db, job_id, "understand", "Analyzing repository architecture and tech stack...", "running", 0.3)
            logger.info("[PHASE START] Phase: understand")
            start_understand = time.time()
            understand_data = await run_understand(repo_data, github_client)
            duration_understand = time.time() - start_understand
            logger.info(f"[PHASE END] Phase: understand, Duration: {duration_understand:.2f}s")
            await write_step(db, job_id, "understand", f"Detected tech stack: {', '.join(understand_data.tech_stack)}", "done", 0.4)
            
            # === PHASE 3: REASON ===
            await write_step(db, job_id, "reason", "Analyzing open issues, commits, and reasoning about root causes...", "running", 0.5)
            logger.info("[PHASE START] Phase: reason")
            start_reason = time.time()
            reason_data = await run_reason(
                repo_data,
                tech_stack=understand_data.tech_stack,
                job_id=job_id,
                repo_url=job.repo_url,
                github_token=github_token
            )
            duration_reason = time.time() - start_reason
            logger.info(f"[PHASE END] Phase: reason, Duration: {duration_reason:.2f}s")
            await write_step(db, job_id, "reason", f"Completed issue correlation. Identified {len(reason_data.critical_issues)} critical issues.", "done", 0.6)
            
            # === PHASE 4: ACT ===
            await write_step(db, job_id, "act", "Fetching code files and generating targeted fixes and refactoring plans...", "running", 0.7)
            logger.info("[PHASE START] Phase: act")
            start_act = time.time()
            act_data = await run_act(job.repo_url, github_token, repo_data, reason_data)
            duration_act = time.time() - start_act
            logger.info(f"[PHASE END] Phase: act, Duration: {duration_act:.2f}s")
            await write_step(db, job_id, "act", "Generated engineering recommendations and test cases.", "done", 0.8)
            
            # === PHASE 5: REPORT ===
            await write_step(db, job_id, "report", "Compiling final engineering health report...", "running", 0.9)
            logger.info("[PHASE START] Phase: report")
            start_report = time.time()
            try:
                report_id = await asyncio.wait_for(
                    run_report(job_id, understand_data, reason_data, act_data, db),
                    timeout=120.0
                )
            except asyncio.TimeoutError:
                logger.error(f"Timeout during final report generation for job {job_id}")
                raise Exception("Final report generation timed out after 120 seconds")
            duration_report = time.time() - start_report
            logger.info(f"[PHASE END] Phase: report, Duration: {duration_report:.2f}s")
            await write_step(db, job_id, "report", "Engineering report compiled and persisted successfully.", "done", 1.0)
            
            # Update job status to done
            job.status = "done"
            await db.commit()
            logger.info(f"Agent job {job_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Error executing agent job {job_id}: {str(e)}")
            logger.error(traceback.format_exc())
            
            try:
                # Record failed step
                await write_step(db, job_id, "failed", f"Failed: {str(e)}", "failed", 1.0)
                
                # Set job status to failed
                job.status = "failed"
                await db.commit()
            except Exception as db_err:
                await db.rollback()
                logger.error(f"Database error during failure recording: {db_err}")

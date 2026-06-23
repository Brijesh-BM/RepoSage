import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.future import select
from db.session import SessionLocal
from models.agent_step import AgentStep
from models.job import Job

router = APIRouter()

@router.websocket("/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    await websocket.accept()
    sent_step_ids = set()
    
    try:
        while True:
            # Query db for new steps and job status
            async with SessionLocal() as db:
                # Check job status
                job_result = await db.execute(select(Job).where(Job.id == job_id))
                job = job_result.scalars().first()
                if not job:
                    await websocket.send_json({"error": "Job not found"})
                    break
                
                # Fetch steps
                steps_result = await db.execute(
                    select(AgentStep)
                    .where(AgentStep.job_id == job_id)
                    .order_by(AgentStep.id.asc())
                )
                steps = steps_result.scalars().all()
                
                for step in steps:
                    if step.id not in sent_step_ids:
                        await websocket.send_json({
                            "phase": step.phase,
                            "message": step.message,
                            "status": step.status,
                            "progress": step.progress,
                            "created_at": step.created_at.isoformat()
                        })
                        sent_step_ids.add(step.id)
                
                # Check if job is finished
                if job.status in ["done", "failed"]:
                    # Do a final sweep for any last second steps before closing
                    await asyncio.sleep(0.5)
                    steps_result_final = await db.execute(
                        select(AgentStep)
                        .where(AgentStep.job_id == job_id)
                        .order_by(AgentStep.id.asc())
                    )
                    steps_final = steps_result_final.scalars().all()
                    for step in steps_final:
                        if step.id not in sent_step_ids:
                            await websocket.send_json({
                                "phase": step.phase,
                                "message": step.message,
                                "status": step.status,
                                "progress": step.progress,
                                "created_at": step.created_at.isoformat()
                            })
                            sent_step_ids.add(step.id)
                    break
            
            await asyncio.sleep(1.0)
            try:
                await websocket.send_json({"type": "ping"})
            except Exception:
                break
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except:
            pass
    finally:
        try:
            await websocket.close()
        except:
            pass

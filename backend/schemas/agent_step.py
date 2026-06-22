from datetime import datetime
from pydantic import BaseModel

class AgentStepBase(BaseModel):
    phase: str
    message: str
    status: str
    progress: float

class AgentStepCreate(AgentStepBase):
    job_id: str

class AgentStepResponse(AgentStepBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

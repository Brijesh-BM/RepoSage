from datetime import datetime
from typing import Optional
from pydantic import BaseModel, HttpUrl, field_validator

class JobCreate(BaseModel):
    repo_url: str
    github_token: Optional[str] = None

    @field_validator("repo_url")
    @classmethod
    def validate_github_url(cls, v: str) -> str:
        import re
        # Normalize and validate GitHub URL
        val = v.strip().rstrip("/")
        
        match = re.search(r"(?:https?://)?(?:www\.)?github\.com/([^/]+)/([^/]+)", val)
        if not match or not match.group(1) or not match.group(2):
            raise ValueError("Must be a valid GitHub repository URL containing organization/user and repository name")
            
        return val

class JobResponse(BaseModel):
    id: str
    repo_url: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

        

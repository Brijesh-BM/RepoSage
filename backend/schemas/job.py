from datetime import datetime
from typing import Optional
from pydantic import BaseModel, HttpUrl, field_validator

class JobCreate(BaseModel):
    repo_url: str
    github_token: Optional[str] = None

    @field_validator("repo_url")
    @classmethod
    def validate_github_url(cls, v: str) -> str:
        # Normalize and validate GitHub URL
        val = v.strip().rstrip("/")
        if not val.startswith("https://github.com/") and not val.startswith("github.com/"):
            raise ValueError("Must be a valid GitHub repository URL")
        
        # Ensure it has at least org/repo structure
        parts = val.split("github.com/")[-1].split("/")
        if len(parts) < 2:
            raise ValueError("URL must contain the organization/user and repository name")
            
        return val

class JobResponse(BaseModel):
    id: str
    repo_url: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

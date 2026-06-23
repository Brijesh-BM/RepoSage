import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import os
import sys

# Prepend parent directory to sys.path to allow running from root or backend folder seamlessly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from db.session import engine, Base

# Import routers after they are created
from routers import jobs, reports, ws

app = FastAPI(
    title="RepoSage API",
    description="Software Engineering Agent API Backend",
    version="1.0"
)

# CORS configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    # Automatically create database tables for ease of local development
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Mount routers
app.include_router(jobs.router, prefix="/v1")
app.include_router(reports.router, prefix="/v1")
app.include_router(ws.router, prefix="/v1")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

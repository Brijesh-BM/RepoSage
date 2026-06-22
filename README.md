# RepoSage — Software Engineering Agent

RepoSage is an AI-powered agentic assistant designed to analyze a public or private GitHub repository, understand its code/issues/PRs/commits, and produce a detailed engineering report containing health scores, critical issues, security risks, technical debt, and action items.

## Architecture
- **Frontend**: Next.js (App Router, Tailwind CSS, TypeScript)
- **Backend**: FastAPI (Python 3.14+, SQLAlchemy async, WebSockets, PyGithub, Google Gemini API)
- **Database**: PostgreSQL (Railway) / SQLite (Local fallback)

## Directory Structure
- `frontend/` - Next.js client application.
- `backend/` - FastAPI backend and agent code.

## Getting Started

### Prerequisites
- Node.js (v20+)
- Python (v3.10+)
- A GitHub Personal Access Token (for accessing repos/private APIs)
- A Gemini API Key (from Google AI Studio)

### Local Development

1. **Clone & Setup Environment**
   Copy the `.env.example` file to `.env` in the root:
   ```bash
   cp .env.example .env
   ```
   Add your `GEMINI_API_KEY` and optional `GITHUB_TOKEN`.

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
   Run the backend:
   ```bash
   python main.py
   ```
   The backend will be running at `http://localhost:8000`.

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will be running at `http://localhost:3000`.

### Docker Compose
You can also run the entire setup locally with PostgreSQL:
```bash
docker compose up
```

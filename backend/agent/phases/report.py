import json
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from models.report import Report
from agent.phases.understand import UnderstandOutput
from agent.phases.act import ActOutput
from models.job import Job
from models.repo_cache import RepoCache
from sqlalchemy.future import select

def generate_positive_findings(repo_data: dict, understand_data: UnderstandOutput) -> list[dict]:
    from datetime import datetime, timezone
    positive_signals = []
    
    # 1. TypeScript
    is_ts = any("typescript" in t.lower() for t in understand_data.tech_stack)
    if is_ts:
        ts_files = [f for f in repo_data["file_tree"] if f.endswith(".ts") or f.endswith(".tsx")]
        positive_signals.append({
            "signal": "Typed codebase (TypeScript)",
            "evidence": f"TypeScript is enforced, with {len(ts_files)} source files using .ts or .tsx extensions."
        })
        
    # 2. Test files
    test_files = [f for f in repo_data["file_tree"] if ".test." in f or ".spec." in f or "__tests__" in f]
    if test_files:
        positive_signals.append({
            "signal": "Test coverage present",
            "evidence": f"Found {len(test_files)} test files (e.g. *.test.*, *.spec.*) in the repository."
        })
        
    # 3. CI Config
    ci_provider = None
    for f in repo_data["file_tree"]:
        if ".github/workflows/" in f:
            ci_provider = "GitHub Workflows"
            break
        elif ".travis.yml" in f:
            ci_provider = "Travis CI"
            break
        elif "circle.ci" in f or ".circleci/" in f or "circle.yml" in f:
            ci_provider = "CircleCI"
            break
        elif "gitlab-ci.yml" in f or ".gitlab-ci.yml" in f:
            ci_provider = "GitLab CI"
            break
    if ci_provider:
        positive_signals.append({
            "signal": "Continuous Integration configured",
            "evidence": f"Repository is configured with {ci_provider} for automated integration and testing."
        })
        
    # 4. README word count
    readme_content = repo_data.get("readme", "")
    word_count = len(readme_content.split())
    if word_count > 200:
        positive_signals.append({
            "signal": "Well-documented repository",
            "evidence": f"README.md exists and is well-written with {word_count} words."
        })
        
    # 5. Commits in last 14 days
    days_since = None
    now = datetime.now(timezone.utc)
    for commit in repo_data.get("commits", []):
        date_str = commit.get("date", "")
        if date_str:
            try:
                commit_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                diff = now - commit_date
                if days_since is None or diff.days < days_since:
                    days_since = diff.days
            except Exception:
                pass
    if days_since is not None and days_since <= 14:
        positive_signals.append({
            "signal": "Actively maintained",
            "evidence": f"The repository has recent activity with the last commit occurring {days_since} days ago."
        })
        
    # 6. Prisma or ORM
    orms = ["prisma", "sequelize", "typeorm", "mongoose", "sqlalchemy", "peewee", "hibernate", "orm"]
    has_orm = any(any(orm in item.lower() for orm in orms) for item in (understand_data.tech_stack + understand_data.frameworks))
    if has_orm:
        positive_signals.append({
            "signal": "ORM in use (reduces raw SQL risk)",
            "evidence": "The codebase utilizes an ORM, which helps mitigate database vulnerability and raw SQL risks."
        })
        
    # 7. Docker
    has_docker = any("dockerfile" in f.lower() or "docker-compose" in f.lower() for f in repo_data["file_tree"])
    if has_docker:
        positive_signals.append({
            "signal": "Containerized setup present",
            "evidence": "Docker configuration or docker-compose file found, enabling containerized environments."
        })
        
    return positive_signals

async def run_report(
    job_id: str,
    understand_data: UnderstandOutput,
    reason_data: Any,
    act_data: ActOutput,
    db: AsyncSession
) -> str:
    # 1. Fetch job to get repo_url
    job_result = await db.execute(select(Job).where(Job.id == job_id))
    job = job_result.scalars().first()
    if not job:
        raise ValueError(f"Job {job_id} not found")
    
    # Fetch cache entry using repo_url
    cache_result = await db.execute(select(RepoCache).where(RepoCache.repo_url == job.repo_url))
    cache = cache_result.scalars().first()
    
    repo_data = {
        "file_tree": cache.file_tree if cache else [],
        "readme": cache.readme if cache else "",
        "issues": cache.issues if cache else [],
        "prs": cache.prs if cache else [],
        "commits": cache.commits if cache else []
    }
    
    # 2. Generate positive signals
    positive_signals = generate_positive_findings(repo_data, understand_data)

    # 3. Calculate health score dynamically
    # START with a base score of 60.
    health_score = 60.0
    
    # ADD points for positive signals found in the repository data:
    # - +5 if a CI configuration file exists
    has_ci = any(".github/workflows/" in f or ".travis.yml" in f or "circle.yml" in f or "circle.ci" in f or ".circleci/" in f or "gitlab-ci.yml" in f or ".gitlab-ci.yml" in f for f in repo_data["file_tree"])
    if has_ci:
        health_score += 5
        
    # - +5 if a test directory or test files exist
    has_tests = any("__tests__" in f or f.endswith(".test.ts") or f.endswith(".spec.py") or ".test." in f or ".spec." in f for f in repo_data["file_tree"])
    if has_tests:
        health_score += 5
        
    # - +5 if README.md exists and has more than 200 words
    readme_content = repo_data.get("readme", "")
    word_count = len(readme_content.split())
    if word_count > 200:
        health_score += 5
        
    # - +5 if the repo has had commits in the last 30 days
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    has_recent_commits = False
    for commit in repo_data.get("commits", []):
        date_str = commit.get("date", "")
        if date_str:
            try:
                commit_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                if (now - commit_date).days <= 30:
                    has_recent_commits = True
                    break
            except Exception:
                pass
    if has_recent_commits:
        health_score += 5
        
    # - +3 if TypeScript is detected in the tech stack
    is_ts = any("typescript" in t.lower() for t in understand_data.tech_stack)
    if is_ts:
        health_score += 3
        
    # - +3 if a linter config exists (.eslintrc, .pylintrc, pyproject.toml)
    has_linter = any(f.endswith(".eslintrc") or f.endswith(".pylintrc") or f.endswith("pyproject.toml") for f in repo_data["file_tree"])
    if has_linter:
        health_score += 3
        
    # SUBTRACT points for findings:
    subtractions = 0.0
    for issue in act_data.critical_issues:
        sev = issue.severity.lower()
        if "critical" in sev:
            subtractions += 8
        elif "high" in sev:
            subtractions += 5
        elif "medium" in sev or "med" in sev:
            subtractions += 2
        elif "low" in sev:
            subtractions += 0.5
            
    for risk in act_data.security_risks:
        sev = risk.severity.lower()
        if "critical" in sev:
            subtractions += 8
        elif "high" in sev:
            subtractions += 5
        elif "medium" in sev or "med" in sev:
            subtractions += 2
        elif "low" in sev:
            subtractions += 0.5
            
    for debt in act_data.tech_debt:
        sev = debt.severity.lower()
        if "critical" in sev:
            subtractions += 8
        elif "high" in sev:
            subtractions += 5
        elif "medium" in sev or "med" in sev:
            subtractions += 2
        elif "low" in sev:
            subtractions += 0.5
            
    health_score -= subtractions
    
    # FLOOR the score at 10. CEIL at 95. Round to nearest integer.
    health_score = max(10, min(95, round(health_score)))
    
    # 4. Convert Pydantic schemas into JSON-compatible dictionaries
    critical_issues = [issue.model_dump() for issue in act_data.critical_issues]
    security_risks = [risk.model_dump() for risk in act_data.security_risks]
    tech_debt = [debt.model_dump() for debt in act_data.tech_debt]
    recommendations = [rec.model_dump() for rec in act_data.recommendations]
    
    tech_stack_payload = list(understand_data.tech_stack)
    
    # 5. Create database report entry
    db_report = Report(
        job_id=job_id,
        health_score=health_score,
        tech_stack=tech_stack_payload,
        critical_issues=critical_issues,
        security_risks=security_risks,
        tech_debt=tech_debt,
        recommendations=recommendations,
        next_actions=act_data.next_actions,
        positive_signals=positive_signals
    )
    db.add(db_report)
    await db.commit()
    await db.refresh(db_report)
    
    return db_report.id

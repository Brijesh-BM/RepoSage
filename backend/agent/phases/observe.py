from datetime import datetime
from sqlalchemy.future import select
from models.repo_cache import RepoCache
from agent.tools.github_client import GitHubClient

async def run_observe(repo_url: str, github_token: str, db) -> dict:
    # Check if a cache entry exists and is not expired
    result = await db.execute(select(RepoCache).where(RepoCache.repo_url == repo_url))
    cache = result.scalars().first()
    
    if cache and cache.expires_at > datetime.utcnow():
        return {
            "owner": repo_url.split("github.com/")[-1].split("/")[0],
            "name": repo_url.split("github.com/")[-1].split("/")[1],
            "file_tree": cache.file_tree,
            "readme": cache.readme,
            "issues": cache.issues,
            "prs": cache.prs,
            "commits": cache.commits
        }
        
    # Cache miss - fetch from GitHub API
    client = GitHubClient(token=github_token)
    repo_data = client.get_repo_data(repo_url)
    
    # Delete old cache entry if it exists to refresh database cleanly
    if cache:
        await db.delete(cache)
        await db.commit()
        
    new_cache = RepoCache(
        repo_url=repo_url,
        file_tree=repo_data["file_tree"],
        readme=repo_data["readme"],
        issues=repo_data["issues"],
        prs=repo_data["prs"],
        commits=repo_data["commits"]
    )
    db.add(new_cache)
    await db.commit()
    
    return repo_data

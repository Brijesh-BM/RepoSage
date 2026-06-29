import logging
from datetime import datetime
from sqlalchemy.future import select
from models.repo_cache import RepoCache
from agent.tools.github_client import GitHubClient, parse_repo_url

logger = logging.getLogger(__name__)

async def run_observe(repo_url: str, github_token: str, db) -> dict:
    # Check if a cache entry exists and is not expired
    try:
        result = await db.execute(select(RepoCache).where(RepoCache.repo_url == repo_url))
        cache = result.scalars().first()
    except Exception as e:
        logger.error(f"Error querying repo cache: {e}")
        raise e
    
    owner, repo_name = parse_repo_url(repo_url)
    
    if cache and cache.expires_at > datetime.utcnow():
        return {
            "owner": owner,
            "name": repo_name,
            "file_tree": cache.file_tree,
            "readme": cache.readme,
            "issues": cache.issues,
            "prs": cache.prs,
            "commits": cache.commits
        }
        
    # Cache miss - fetch from GitHub API
    client = GitHubClient(token=github_token)
    repo_data = await client.get_repo_data(repo_url)
    
    try:
        # Delete old cache entry if it exists to refresh database cleanly in a single transaction
        if cache:
            await db.delete(cache)
            
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
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating repo cache: {e}")
        raise e
    
    return repo_data

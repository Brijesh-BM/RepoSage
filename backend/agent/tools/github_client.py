import re
import asyncio
import logging
from typing import Dict, List, Any, Optional
from github import Github
from github.GithubException import GithubException, RateLimitExceededException
from config import settings

logger = logging.getLogger(__name__)


def parse_repo_url(url: str) -> tuple[str, str]:
    # Normalize URL: strip trailing slash, remove protocol and domain
    cleaned = url.strip().rstrip("/")
    match = re.search(r"github\.com/([^/]+)/([^/]+)", cleaned)
    if not match:
        raise ValueError(f"Invalid GitHub repository URL: {url}")
    return match.group(1), match.group(2)

class GitHubClient:
    def __init__(self, token: Optional[str] = None):
        # Use provided token, fallback to backend settings token, or run unauthenticated
        self.token = token or settings.GITHUB_TOKEN
        if self.token:
            self.client = Github(self.token)
        else:
            self.client = Github()

    def get_repo_data(self, repo_url: str) -> Dict[str, Any]:
        try:
            owner, repo_name = parse_repo_url(repo_url)
            repo = self.client.get_repo(f"{owner}/{repo_name}")
            
            # 1. Fetch File Tree (recursive)
            file_tree = []
            try:
                # Use default branch tree recursive
                git_tree = repo.get_git_tree(repo.default_branch, recursive=True)
                # Keep blobs only, cap at 1000 files to avoid rate-limiting/overwhelming context
                file_tree = [
                    el.path for el in git_tree.tree 
                    if el.type == "blob" and not any(p in el.path for p in [".git/", "node_modules/", "venv/", "__pycache__/"])
                ][:1000]
            except Exception as e:
                # Fallback: non-recursive listing of root files if git_tree fails
                contents = repo.get_contents("")
                file_tree = [c.path for c in contents if c.type == "file"][:100]

            # 2. Fetch README
            readme = ""
            try:
                readme_file = repo.get_readme()
                readme = readme_file.decoded_content.decode("utf-8", errors="replace")
            except Exception:
                readme = "No README.md found in this repository."

            # 3. Fetch Issues (top 30, filter out PRs since GitHub issues API returns both)
            issues = []
            try:
                gh_issues = repo.get_issues(state="open", sort="created", direction="desc")
                count = 0
                for issue in gh_issues:
                    if count >= 30:
                        break
                    # PRs have a pull_request property
                    if issue.pull_request is None:
                        issues.append({
                            "number": issue.number,
                            "title": issue.title,
                            "body": issue.body or "",
                            "state": issue.state,
                            "comments_count": issue.comments,
                            "created_at": issue.created_at.isoformat()
                        })
                        count += 1
            except Exception:
                pass

            # 4. Fetch PRs (top 20)
            prs = []
            try:
                gh_prs = repo.get_pulls(state="all", sort="created", direction="desc")
                for pr in gh_prs[:20]:
                    prs.append({
                        "number": pr.number,
                        "title": pr.title,
                        "state": pr.state,
                        "body": pr.body or "",
                        "created_at": pr.created_at.isoformat(),
                        "merged": pr.merged
                    })
            except Exception:
                pass

            # 5. Fetch Commits (top 20)
            commits = []
            try:
                gh_commits = repo.get_commits()
                for commit in gh_commits[:20]:
                    commits.append({
                        "sha": commit.sha[:7],
                        "message": commit.commit.message,
                        "author": commit.commit.author.name if commit.commit.author else "Unknown",
                        "date": commit.commit.author.date.isoformat() if commit.commit.author else ""
                    })
            except Exception:
                pass

            # Return unified repo payload
            return {
                "owner": owner,
                "name": repo_name,
                "file_tree": file_tree,
                "readme": readme,
                "issues": issues,
                "prs": prs,
                "commits": commits
            }

        except RateLimitExceededException:
            raise Exception("GitHub API Rate Limit exceeded. Please provide a GitHub Personal Access Token to continue.")
        except GithubException as e:
            if e.status == 404:
                raise Exception("GitHub Repository not found. Check the URL and token permissions.")
            raise Exception(f"GitHub API Error: {e.data.get('message', str(e))}")
        except Exception as e:
            raise Exception(f"Failed to fetch repository data: {str(e)}")

    def fetch_file_content(self, repo_url: str, path: str) -> str:
        """Helper to fetch a specific source code file from the repo."""
        try:
            owner, repo_name = parse_repo_url(repo_url)
            repo = self.client.get_repo(f"{owner}/{repo_name}")
            file_content = repo.get_contents(path)
            if isinstance(file_content, list):
                return "Directory path provided instead of a file."
            return file_content.decoded_content.decode("utf-8", errors="replace")
        except Exception as e:
            return f"Error reading file {path}: {str(e)}"

    async def get_file_content(self, file_path: str) -> str:
        for attempt in range(2):
            try:
                # Use the PyGithub repo object already initialized
                file_content = self.repo.get_contents(file_path)
                if isinstance(file_content, list):
                    logger.warning(f"Path {file_path} is a directory, not a file.")
                    return ""
                decoded_bytes = file_content.decoded_content
                limit = 100 * 1024
                if len(decoded_bytes) > limit:
                    content_str = decoded_bytes[:limit].decode("utf-8", errors="replace")
                    content_str += "\n# [FILE TRUNCATED AT 100KB]"
                else:
                    content_str = decoded_bytes.decode("utf-8", errors="replace")
                return content_str
            except RateLimitExceededException:
                if attempt == 0:
                    logger.warning("GitHub API rate limit exceeded. Sleeping 60 seconds and retrying...")
                    await asyncio.sleep(60)
                else:
                    logger.warning("GitHub API rate limit exceeded. Retry failed.")
                    return ""
            except Exception as e:
                logger.warning(f"Failed to fetch content for file {file_path}: {str(e)}")
                return ""

    def validate_file_paths(self, file_paths: list[str], 
                            repo_file_tree: list[str]) -> list[str]:
        normalized_tree_set = {path.lstrip("/").lower() for path in repo_file_tree}
        valid_paths = []
        for path in file_paths:
            if path.lstrip("/").lower() in normalized_tree_set:
                valid_paths.append(path)
        return valid_paths

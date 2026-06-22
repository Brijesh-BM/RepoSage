from pydantic import BaseModel
from typing import List
from backend.agent.tools.gemini_client import GeminiClient
from backend.agent.tools.github_client import GitHubClient

class UnderstandOutput(BaseModel):
    tech_stack: List[str]
    frameworks: List[str]
    languages: List[str]
    summary: str

def get_key_files(file_tree: list[str]) -> list[str]:
    key_files = []
    
    def add_file(path: str):
        if path not in key_files and len(key_files) < 8:
            key_files.append(path)
            
    # Priority 1: dependency manifest
    for path in file_tree:
        normalized = path.replace("\\", "/")
        basename = normalized.split("/")[-1]
        if basename in {"package.json", "requirements.txt", "pyproject.toml"}:
            add_file(path)
            
    # Priority 2: data model
    for path in file_tree:
        normalized = path.replace("\\", "/")
        basename = normalized.split("/")[-1]
        if basename in {"schema.prisma", "models.py", "schema.sql"} or normalized.endswith("prisma/schema.prisma"):
            add_file(path)
            
    # Priority 3: middleware/auth
    for path in file_tree:
        normalized = path.replace("\\", "/")
        basename = normalized.split("/")[-1]
        if basename in {"middleware.ts", "middleware.py", "auth.ts", "auth.py"}:
            add_file(path)
            
    # Priority 4: main entry point
    for path in file_tree:
        normalized = path.replace("\\", "/")
        basename = normalized.split("/")[-1]
        if basename in {"main.py", "app.py", "index.ts", "server.ts"}:
            add_file(path)
            
    # Priority 5: first 4 files in api/routes/routers
    api_files_count = 0
    for path in file_tree:
        if api_files_count >= 4:
            break
        normalized = path.replace("\\", "/")
        if ("src/app/api/" in normalized or 
            "src/routes/" in normalized or 
            "routers/" in normalized):
            before = len(key_files)
            add_file(path)
            if len(key_files) > before:
                api_files_count += 1
                        
    return key_files

async def run_understand(repo_data: dict, 
                         github_client: GitHubClient) -> UnderstandOutput:
    client = GeminiClient()
    
    # Identify and fetch key files
    key_files_to_read = get_key_files(repo_data["file_tree"])
    key_files = {}
    for file_path in key_files_to_read:
        content = await github_client.get_file_content(file_path)
        key_files[file_path] = content
        
    source_context = ""
    for path, content in key_files.items():
        source_context += f"=== {path} ===\n{content}\n\n"
        
    file_tree_str = "\n".join(repo_data["file_tree"][:500])  # Cap to prevent too much context
    readme_str = repo_data["readme"][:10000]                 # Cap readme length to fit prompt
    
    system_instruction = (
        "You are an expert senior software engineer and architect analyzing a repository. "
        "Your task is to identify the technology stack, main frameworks, primary languages, "
        "and produce a concise summary explaining what the project does. "
        "You have access to actual source code of key files. Use them "
        "to make accurate determinations about the tech stack, frameworks, "
        "architectural patterns, and code quality signals. Do not guess — "
        "read the code."
    )
    
    prompt = f"""
Analyze the following repository file structure and README.

Repository: {repo_data['owner']}/{repo_data['name']}

File tree:
{file_tree_str}

Key Source Files (actual code):
{source_context}

README:
{readme_str}
"""
    
    output = client.generate_structured(
        prompt=prompt,
        schema=UnderstandOutput,
        system_instruction=system_instruction
    )
    
    return output

from pydantic import BaseModel
from typing import List, Dict, Optional
from agent.tools.github_client import GitHubClient
from agent.tools.gemini_client import GeminiClient
from agent.phases.reason import ReasonOutput

class ActCriticalIssue(BaseModel):
    title: str
    severity: str
    affected_files: List[str]
    root_cause: str
    fix: str
    confidence: float
    exploitability: Optional[str] = None
    attack_vector: Optional[str] = None

class ActSecurityRisk(BaseModel):
    title: str
    severity: str
    description: str
    suggested_fix: str
    exploitability: Optional[str] = None
    attack_vector: Optional[str] = None

class ActTechDebtItem(BaseModel):
    category: str
    description: str
    severity: str
    estimated_effort: str  # low, medium, high

class ActRecommendation(BaseModel):
    action: str
    rationale: str
    priority: str

class ActOutput(BaseModel):
    critical_issues: List[ActCriticalIssue]
    security_risks: List[ActSecurityRisk]
    tech_debt: List[ActTechDebtItem]
    recommendations: List[ActRecommendation]
    next_actions: List[str]

async def run_act(
    repo_url: str,
    github_token: str,
    repo_data: dict,
    reason_data: ReasonOutput
) -> ActOutput:
    client = GitHubClient(token=github_token)
    gemini = GeminiClient()
    
    # 1. Fetch file content for affected files.
    # To avoid blowing up tokens, we collect unique file paths and fetch up to 3 total files.
    unique_paths = set()
    for issue in reason_data.critical_issues:
        for path in issue.affected_files:
            unique_paths.add(path)
            
    for risk in reason_data.security_risks:
        for path in risk.affected_files:
            unique_paths.add(path)
            
    fetched_files: Dict[str, str] = {}
    path_list = list(unique_paths)[:4]  # fetch top 4 files maximum
    
    from agent.tools.github_client import parse_repo_url
    owner, repo_name = parse_repo_url(repo_url)
    client.repo = client.client.get_repo(f"{owner}/{repo_name}")
    
    for path in path_list:
        content = await client.get_file_content(path)
        fetched_files[path] = content[:8000] if content else ""

    # Format file contents for prompt
    files_context = ""
    for path, content in fetched_files.items():
        files_context += f"=== FILE: {path} ===\n{content}\n\n"

    # Format issues and risks for prompt context
    issues_context = ""
    for idx, issue in enumerate(reason_data.critical_issues):
        issues_context += f"{idx+1}. {issue.title} ({issue.severity} severity)\n"
        issues_context += f"   Reasoning: {issue.description}\n"
        issues_context += f"   Affected Files: {', '.join(issue.affected_files)}\n"
        
    risks_context = ""
    for idx, risk in enumerate(reason_data.security_risks):
        risks_context += f"{idx+1}. {risk.title} ({risk.severity} severity)\n"
        risks_context += f"   Description: {risk.description}\n"
        risks_context += f"   Affected Files: {', '.join(risk.affected_files)}\n"

    system_instruction = (
        "You are an expert principal software developer and security engineer. "
        "Your task is to analyze critical issues and security risks along with the provided "
        "source code file contents, and generate precise fixes, root-cause explanations, "
        "confidence scores, refactoring recommendations, technical debt summaries, and a list of "
        "concrete next actions for the developers. "
        "For every critical issue and security risk, you must reason about "
        "exploitability in the context of this specific tech stack and "
        "deployment environment. "
        "Set exploitability to one of: "
        "- directly_exploitable: any unauthenticated user can trigger this "
        "- requires_auth: only authenticated users can reach this code path "
        "- theoretical: the vulnerability class exists but no clear attack "
        "  path is evident from the code "
        "- requires_specific_conditions: exploitable only under specific "
        "  runtime conditions "
        "Set attack_vector to a one-sentence description of how an attacker "
        "would actually exploit this in this specific application. Be "
        "specific to the tech stack — not generic. "
        "This is not optional. Every finding must have both fields."
    )

    prompt = f"""
Analyze the codebase files and issues/risks details below to generate structural fixes and recommendations.

Codebase Files Context:
{files_context if files_context else "No files fetched."}

Critical Issues:
{issues_context if issues_context else "No critical issues."}

Security Risks:
{risks_context if risks_context else "No security risks."}
"""

    output = await gemini.generate_structured(
        prompt=prompt,
        schema=ActOutput,
        system_instruction=system_instruction
    )
    
    return output

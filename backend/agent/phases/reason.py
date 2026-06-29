import asyncio
import logging
from pydantic import BaseModel
from typing import List, Optional
from agent.tools.gemini_client import GeminiClient

logger = logging.getLogger(__name__)

def validate_file_paths(file_paths: list[str], 
                        repo_file_tree: list[str]) -> list[str]:
    tree_set = {p.lstrip("/").lower() for p in repo_file_tree}
    return [p for p in file_paths 
            if p.lstrip("/").lower() in tree_set]


class ReasonCriticalIssue(BaseModel):
    title: str
    severity: str
    affected_files: List[str]
    root_cause: str
    description: str
    suggested_fix: Optional[str] = None
    confidence: Optional[float] = None
    note: Optional[str] = None


class ReasonSecurityRisk(BaseModel):
    title: str
    severity: str
    description: str
    affected_files: List[str]
    root_cause: Optional[str] = None
    suggested_fix: Optional[str] = None
    confidence: Optional[float] = None
    note: Optional[str] = None


class ReasonOutput(BaseModel):
    critical_issues: List[ReasonCriticalIssue]
    security_risks: List[ReasonSecurityRisk]


class SuspectedFinding(BaseModel):
    title: str
    description: str
    severity: str
    suspected_files: List[str]
    finding_type: str  # 'critical_issue' or 'security_risk'


class SubStep1Output(BaseModel):
    findings: List[SuspectedFinding]


class VerificationResponse(BaseModel):
    status: str  # confirmed / partial / not_found
    root_cause: Optional[str] = None
    suggested_fix: Optional[str] = None
    confidence: Optional[float] = None


class CritiqueResponse(BaseModel):
    keep: bool
    revised_confidence: Optional[float] = None
    revised_root_cause: Optional[str] = None
    reason: Optional[str] = None


async def run_reason(
    repo_data: dict,
    tech_stack: list[str],
    job_id: str,
    repo_url: str,
    github_token: Optional[str] = None
) -> ReasonOutput:
    from agent.tools.github_client import GitHubClient, parse_repo_url
    from db.session import SessionLocal
    from models.agent_step import AgentStep
    
    tech_stack_str = ", ".join(tech_stack)
    
    file_tree_str = "\n".join(repo_data["file_tree"][:500])
    readme_str = repo_data.get("readme", "")[:10000]
    
    # Format issues and commits
    issues_str = ""
    for issue in repo_data["issues"]:
        issues_str += f"- #{issue['number']}: {issue['title']}\n  Body: {issue['body'][:300]}\n"
        
    commits_str = ""
    for commit in repo_data["commits"]:
        files_changed = commit.get("files_changed", [])
        files_str = f" (Files changed: {', '.join(files_changed)})" if files_changed else ""
        commits_str += f"- {commit['sha']}: {commit['message']}{files_str} (by {commit['author']})\n"
        
    prs_str = ""
    for pr in repo_data.get("prs", []):
        state = pr.get("state", "unknown")
        title = pr.get("title", "")
        body = (pr.get("body") or "")[:200]
        files = pr.get("files_changed", [])
        files_str = ", ".join(files[:5]) if files else "unknown"
        prs_str += (
            f"- PR #{pr.get('number')}: [{state.upper()}] {title}\n"
            f"  Body: {body}\n"
            f"  Files changed: {files_str}\n"
        )
        
    # Sub-step 1 (Identify)
    system_instruction_step1 = (
        "You are an expert systems engineer and debugger. "
        "Your task is to analyze the issues, commit history, tech stack, and file tree of a repository, "
        "and identify suspected findings (critical bugs, structural problems, and security risks). "
        "For each suspected finding, identify up to 5 file paths from the file tree most likely implicated. "
        "Each finding must include finding_type as 'critical_issue' or 'security_risk'. "
        "CRITICAL: You must only list file paths that are explicitly present in the provided File Tree. "
        "Do not invent or assume file paths. "
        "Pay special attention to CLOSED pull requests that attempted to "
        "fix open issues. If a PR was closed without merging, the issue "
        "it addressed is likely still present. If a PR was merged but the "
        "issue it referenced is still open, the fix may have been "
        "incomplete. Correlate PRs with issues to identify recurring or "
        "partially-fixed problems."
    )
    
    prompt_step1 = f"""
Identify suspected repository findings based on the repository context below.

Repository: {repo_data['owner']}/{repo_data['name']}
Tech Stack: {tech_stack_str}

File Tree:
{file_tree_str}

README:
{readme_str}

Open Issues:
{issues_str if issues_str else "No open issues found."}

Recent Commits:
{commits_str if commits_str else "No recent commits found."}

Recent Pull Requests (including closed/merged):
{prs_str if prs_str else "No pull requests found."}
"""

    gemini_client = GeminiClient()
    sub_step1_res = await gemini_client.generate_structured(
        prompt=prompt_step1,
        schema=SubStep1Output,
        system_instruction=system_instruction_step1
    )
    suspected_findings = sub_step1_res.findings[:3]
    
    logger.info(f"Reason Phase: Gemini returned {len(suspected_findings)} suspected findings")
    # Add a new agent_step log entry between sub-step 1 and sub-step 2
    try:
        async with SessionLocal() as db:
            step = AgentStep(
                job_id=job_id,
                phase="reason",
                message=f"Verifying {len(suspected_findings)} suspected findings against actual source code...",
                status="running",
                progress=0.55
            )
            db.add(step)
            await db.commit()
    except Exception:
        pass
        
    # Sub-step 2 (Verify)
    gh_client = GitHubClient(token=github_token)
    owner, repo_name = parse_repo_url(repo_url)
    gh_client.repo = await asyncio.to_thread(gh_client.client.get_repo, f"{owner}/{repo_name}")
    
    verified_critical_issues = []
    verified_security_risks = []
    
    system_instruction_step2 = (
        "You are an expert principal software developer and security auditor. "
        "Your task is to analyze the suspected finding and the provided actual source code file contents, "
        "and verify if the finding is confirmed, partial, or not found. "
        "You must answer with status as 'confirmed', 'partial', or 'not_found'. "
        "If the finding status is 'confirmed' or 'partial', you must provide a detailed root_cause and suggested_fix "
        "that are specific to the provided source code, and a confidence score between 0.0 and 1.0."
    )
    
    for finding in suspected_findings:
        logger.info(f"Verifying suspected finding: {finding.title}")

        # Validate file paths using our helper
        finding.suspected_files = validate_file_paths(
            finding.suspected_files,
            repo_data["file_tree"]
        )
        if not finding.suspected_files:
            finding.suspected_files = ["(file path could not be confirmed)"]

        file_contents = {}
        any_file_read = False
        valid_suspected_paths = [p for p in finding.suspected_files if p != "(file path could not be confirmed)"]
        if valid_suspected_paths:
            contents = await asyncio.gather(*(gh_client.get_file_content(path) for path in valid_suspected_paths))
            for path, content in zip(valid_suspected_paths, contents):
                if content:
                    file_contents[path] = content
                    any_file_read = True

        # Verification call
        if any_file_read:
            files_context = ""
            for path, content in file_contents.items():
                files_context += f"=== FILE: {path} ===\n{content}\n\n"

            prompt_step2 = f"""
Given the actual code below, does this finding hold?

Finding Title: {finding.title}
Finding Description: {finding.description}
Severity: {finding.severity}

Actual Code Files:
{files_context}
"""
            try:
                verification = await gemini_client.generate_structured(
                    prompt=prompt_step2,
                    schema=VerificationResponse,
                    system_instruction=system_instruction_step2
                )

                status = verification.status.lower()
                if status == "not_found":
                    continue

                root_cause = verification.root_cause or finding.description
                suggested_fix = verification.suggested_fix or "Please review code manually."
                confidence = verification.confidence if verification.confidence is not None else 1.0

                # Apply confidence cap rules (Rule 1 & Rule 2)
                if status == "confirmed":
                    confidence = min(confidence, 0.95)
                elif status == "partial":
                    confidence = min(confidence, 0.55)
                note = None
            except Exception as e:
                # Handle structured JSON parsing or API failure by treating it as confirmed/unverified
                status = "confirmed"
                root_cause = f"Could not perform verification due to API/JSON error: {str(e)}"
                suggested_fix = "Please verify the source code manually."
                confidence = 0.5
                note = "Verification failed due to API error"
        else:
            # If no files could be read, treat as confirmed (we'll apply Rule 3 in Fix #6 next)
            status = "confirmed"
            root_cause = finding.description
            suggested_fix = "Please verify the source code manually."
            confidence = 0.35
            note = "Confidence limited — source file could not be retrieved for verification"

        # Add to appropriate list based on category
        if finding.finding_type == "security_risk":
            verified_security_risks.append(
                ReasonSecurityRisk(
                    title=finding.title,
                    severity=finding.severity,
                    description=finding.description,
                    affected_files=finding.suspected_files,
                    root_cause=root_cause,
                    suggested_fix=suggested_fix,
                    confidence=confidence,
                    note=note
                )
            )
        else:
            verified_critical_issues.append(
                ReasonCriticalIssue(
                    title=finding.title,
                    severity=finding.severity,
                    affected_files=finding.suspected_files,
                    root_cause=root_cause,
                    description=finding.description,
                    suggested_fix=suggested_fix,
                    confidence=confidence,
                    note=note
                )
            )

    # Sub-step 3: Self-Critique
    system_instruction_critique = (
        "You are a senior principal engineer performing a final quality "
        "check on AI-generated findings about a software repository. "
        "For each finding, decide: is this finding specific, grounded, "
        "and actionable? Or is it generic advice that could apply to any "
        "codebase? "
        "If the finding is too generic (e.g., 'consider adding tests', "
        "'use Redis for rate limiting' without specific code evidence), "
        "set keep=false. "
        "If the finding is specific but the confidence is too high given "
        "the evidence, revise it downward. "
        "If the root cause can be made more specific based on the "
        "evidence, revise it. "
        "Only keep findings that a senior engineer would consider "
        "genuinely useful and specific to this codebase."
    )
    
    all_findings = (
        [(f, "critical") for f in verified_critical_issues] + 
        [(f, "security") for f in verified_security_risks]
    )
    
    final_critical = []
    final_security = []
    
    for finding, ftype in all_findings:
        critique_prompt = f"""
Review this finding and decide if it should be kept in the 
final engineering report.

Finding Title: {finding.title}
Severity: {finding.severity}
Root Cause: {finding.root_cause}
Suggested Fix: {finding.suggested_fix}
Affected Files: {', '.join(finding.affected_files)}
Confidence: {finding.confidence}
Note: {finding.note or 'None'}

Is this finding specific and grounded in this codebase, 
or is it generic advice?
"""
        try:
            critique = await gemini_client.generate_structured(
                prompt=critique_prompt,
                schema=CritiqueResponse,
                system_instruction=system_instruction_critique
            )
            if not critique.keep:
                continue
            if critique.revised_confidence is not None:
                finding.confidence = critique.revised_confidence
            if critique.revised_root_cause is not None:
                finding.root_cause = critique.revised_root_cause
        except Exception:
            pass  # If critique fails, keep the finding as-is
            
        if ftype == "critical":
            final_critical.append(finding)
        else:
            final_security.append(finding)
            
    return ReasonOutput(
        critical_issues=final_critical,
        security_risks=final_security
    )

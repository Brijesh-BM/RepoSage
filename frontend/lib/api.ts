const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const API_URL = RAW_API_URL.replace(/\/$/, '');

export async function createJob(repoUrl: string, githubToken?: string, signal?: AbortSignal) {
  const res = await fetch(`${API_URL}/v1/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repo_url: repoUrl,
      github_token: githubToken || null,
    }),
    signal,
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create job');
  }
  
  return res.json();
}

export async function getJob(jobId: string) {
  const res = await fetch(`${API_URL}/v1/jobs/${jobId}`);
  if (!res.ok) {
    throw new Error('Failed to fetch job status');
  }
  return res.json();
}

export async function getReport(jobId: string) {
  const res = await fetch(`${API_URL}/v1/reports/${jobId}`);
  if (!res.ok) {
    throw new Error('Failed to fetch report');
  }
  return res.json();
}

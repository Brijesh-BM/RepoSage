"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "@/styles/design-tokens.css";

export default function Page() {
  const [repoUrl, setRepoUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);

    try {
      const res = await fetch("https://reposage-c236.onrender.com/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: repoUrl.trim(),
          github_token: githubToken.trim() || null,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to analyze repository. Please check the URL.");
      }

      const data = await res.json();
      const jobId = data.job_id || data.id || data.jobId;
      if (!jobId) {
        throw new Error("No job ID returned from server.");
      }

      router.push(`/analyze?job_id=${jobId}&repo=${encodeURIComponent(repoUrl.trim())}`);
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        setError("Backend is waking up from sleep — wait 30 seconds and try again.");
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--void)] text-[var(--text)] font-[family-name:var(--font-ui)] flex flex-col justify-between items-center pt-24 pb-8">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 h-14 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="text-[var(--signal)] text-sm">●</span>
          <span className="font-[family-name:var(--font-mono)] font-semibold text-[var(--text)] tracking-tight">RepoSage</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-[family-name:var(--font-mono)] text-[var(--muted)] border border-[var(--border)] px-1.5 py-0.5 rounded">v1.0</span>
          <a
            href="https://github.com/Brijesh-BM/RepoSage"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
            aria-label="GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center items-center w-full max-w-[560px] px-4 my-auto">
        {/* Hero */}
        <div className="text-center mb-8 space-y-3">
          <div className="text-[11px] font-[family-name:var(--font-mono)] text-[var(--signal)] tracking-widest uppercase">
            AI Engineering Agent
          </div>
          <h1 className="text-[40px] font-semibold text-white tracking-tight leading-tight">
            Understand any codebase.
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Paste a GitHub URL. The agent reads, reasons, and reports.
          </p>
        </div>

        {/* Input Card */}
        <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 text-left">
              <label className="block text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-wider text-[var(--muted)]">
                Repository URL
              </label>
              <input
                type="url"
                required
                disabled={loading}
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius)] font-[family-name:var(--font-mono)] text-sm text-[var(--text)] placeholder-[var(--muted)] px-3.5 py-2.5 transition-all focus:border-[var(--signal)] focus:outline-none focus:shadow-[0_0_0_3px_var(--signal-dim)] disabled:opacity-50"
              />
            </div>

            {/* Collapsible toggle */}
            <div className="text-left">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowToken(!showToken)}
                className="text-[12px] font-[family-name:var(--font-mono)] text-[var(--signal)] hover:underline focus:outline-none cursor-pointer disabled:opacity-50"
              >
                {showToken ? "Public repo?" : "Private repo?"}
              </button>
            </div>

            {/* Collapsible token input */}
            {showToken && (
              <div className="space-y-2 text-left animate-fadeIn">
                <label className="block text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-wider text-[var(--muted)]">
                  GitHub Token
                </label>
                <input
                  type="password"
                  disabled={loading}
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius)] font-[family-name:var(--font-mono)] text-sm text-[var(--text)] placeholder-[var(--muted)] px-3.5 py-2.5 transition-all focus:border-[var(--signal)] focus:outline-none focus:shadow-[0_0_0_3px_var(--signal-dim)] disabled:opacity-50"
                />
              </div>
            )}

            {error && (
              <div className="text-xs text-[var(--critical)] bg-[var(--critical-dim)] border border-[var(--critical)]/20 p-3 rounded-[var(--radius)] font-[family-name:var(--font-mono)] text-left">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !repoUrl.trim()}
              className="w-full bg-[var(--signal)] text-[#0A0C0F] font-[family-name:var(--font-mono)] font-bold rounded-[var(--radius)] h-[44px] flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "INITIALIZING…" : "→ ANALYZE REPOSITORY"}
            </button>
          </form>
        </div>

        {/* Phase Preview Strip */}
        <div className="flex flex-wrap gap-2.5 justify-center items-center mt-8">
          {[
            { name: "Observe", color: "var(--signal)", num: 1 },
            { name: "Understand", color: "var(--info)", num: 2 },
            { name: "Reason", color: "var(--warning)", num: 3 },
            { name: "Act", color: "var(--critical)", num: 4 },
            { name: "Report", color: "var(--signal)", num: 5 }
          ].map((phase) => (
            <div
              key={phase.name}
              className="flex items-center bg-[var(--elevated)] border border-[var(--border)] rounded-[20px] py-1.5 px-3.5"
            >
              <span
                style={{ backgroundColor: phase.color }}
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-[#0A0C0F] font-[family-name:var(--font-mono)] mr-2"
              >
                {phase.num}
              </span>
              <span className="text-[11px] font-[family-name:var(--font-mono)] text-[var(--muted)] uppercase tracking-wider">
                {phase.name}
              </span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[560px] border-t border-[var(--border)] py-6 mt-16 text-center text-[12px] font-[family-name:var(--font-mono)] text-[var(--muted)] px-4">
        FastAPI &middot; Next.js &middot; Gemini 1.5 Pro
      </footer>
    </div>
  );
}

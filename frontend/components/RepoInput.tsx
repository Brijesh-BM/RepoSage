"use client";

import { useState } from "react";
import { createJob } from "../lib/api";

interface RepoInputProps {
  onJobCreated: (jobId: string) => void;
}

export default function RepoInput({ onJobCreated }: RepoInputProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await createJob(repoUrl.trim(), token.trim() || undefined);
      onJobCreated(data.id);
    } catch (err: any) {
      setError(err.message || "Failed to start analysis. Check URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl p-8 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-2xl relative overflow-hidden group">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
      
      <h2 className="text-2xl font-bold text-white mb-2">Analyze Repository</h2>
      <p className="text-slate-400 text-sm mb-6">
        Enter a public or private GitHub repository URL to trigger the Software Engineering Agent.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="repoUrl" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            GitHub Repository URL
          </label>
          <input
            type="url"
            id="repoUrl"
            required
            placeholder="https://github.com/owner/repository"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            disabled={loading}
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors focus:outline-none flex items-center gap-1"
          >
            {showToken ? "Hide Advanced Settings" : "Configure Private Repository / Add Github Token"}
          </button>

          {showToken && (
            <div className="mt-3 p-4 rounded-xl bg-slate-950/40 border border-slate-850/60 animate-fadeIn">
              <label htmlFor="token" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                GitHub Personal Access Token (Optional)
              </label>
              <input
                type="password"
                id="token"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm transition-all"
                disabled={loading}
              />
              <p className="text-[11px] text-slate-500 mt-2">
                Highly recommended for private repositories or to avoid GitHub API rate-limits. Your token is only used for this session and is never persisted.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl text-rose-200 text-sm leading-relaxed">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !repoUrl}
          className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-55 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Starting Agent...
            </>
          ) : (
            "Analyze Repository"
          )}
        </button>
      </form>
    </div>
  );
}

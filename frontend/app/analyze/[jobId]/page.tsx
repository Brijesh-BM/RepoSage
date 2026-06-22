"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getJob, getReport } from "@/lib/api";
import { useAgentWebSocket } from "@/lib/ws";
import { Job, Report } from "@/lib/types";
import AgentProgress from "@/components/AgentProgress";
import ReportViewer from "@/components/ReportViewer";

interface AnalyzePageProps {
  params: Promise<{ jobId: string }>;
}

export default function AnalyzePage({ params }: AnalyzePageProps) {
  const { jobId } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { steps, isConnected, error: wsError } = useAgentWebSocket(
    job && job.status !== "done" && job.status !== "failed" ? jobId : null
  );

  // 1. Initial job state load
  useEffect(() => {
    async function loadJob() {
      try {
        const jobData = await getJob(jobId);
        setJob(jobData);
        
        if (jobData.status === "done") {
          const reportData = await getReport(jobId);
          setReport(reportData);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load analysis job metadata.");
      } finally {
        setLoading(false);
      }
    }
    loadJob();
  }, [jobId]);

  // 2. Poll job status when WebSocket updates or indicates completion
  useEffect(() => {
    if (!job || job.status === "done" || job.status === "failed") return;

    // Check if the latest step indicates agent completion or failure
    const latestStep = steps[steps.length - 1];
    if (latestStep && (latestStep.phase === "report" && latestStep.status === "done")) {
      // WS indicates completed report! Wait briefly and fetch job & report
      const timer = setTimeout(async () => {
        try {
          const jobData = await getJob(jobId);
          setJob(jobData);
          const reportData = await getReport(jobId);
          setReport(reportData);
        } catch (err) {
          console.error("Failed to load completed report", err);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    if (latestStep && latestStep.phase === "failed") {
      setJob((prev) => prev ? { ...prev, status: "failed" } : null);
    }
  }, [steps, job, jobId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080d] text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-400 text-sm font-mono">Loading analysis metadata...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#07080d] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-450 mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Error Occurred</h2>
          <p className="text-slate-400 text-sm">{error}</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isJobRunning = job && (job.status === "pending" || job.status === "running");

  return (
    <div className="min-h-screen bg-[#07080d] text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900/40 relative z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg group-hover:scale-105 transition-transform">
            R
          </div>
          <span className="font-black text-xl tracking-tight text-white">RepoSage</span>
        </Link>
        
        {job && job.status === "done" && (
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs font-semibold text-slate-350 hover:text-white transition-all focus:outline-none"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Copied Link!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                Share Report
              </>
            )}
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 relative z-10 flex flex-col items-center">
        {isJobRunning ? (
          <div className="w-full flex justify-center py-10">
            <AgentProgress steps={steps} />
          </div>
        ) : job && job.status === "failed" ? (
          <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/60 border border-rose-900/40 text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-455 mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Agent Execution Failed</h2>
            <p className="text-slate-400 text-sm">
              The agent was unable to successfully compile a report for this repository.
            </p>
            {wsError && <p className="text-rose-400 text-xs font-mono">{wsError}</p>}
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-slate-850 hover:bg-slate-850/80 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Analyze Another Repo
            </Link>
          </div>
        ) : report ? (
          <ReportViewer report={report} repoUrl={job?.repo_url || ""} />
        ) : (
          <div className="flex flex-col items-center gap-4 py-16">
            <svg className="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-slate-400 text-sm font-mono">Retrieving report...</span>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-900/40 text-xs text-slate-500 relative z-10">
        <div>&copy; {new Date().getFullYear()} RepoSage. All reports are persisted securely.</div>
        <div className="flex gap-4">
          <Link href="/" className="hover:text-slate-350 transition-colors">
            Back to Home
          </Link>
        </div>
      </footer>
    </div>
  );
}

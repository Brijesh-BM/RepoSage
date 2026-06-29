"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import "@/styles/design-tokens.css";

const PHASES = [
  { id: "observe", name: "Observe", num: "01", color: "var(--signal)" },
  { id: "understand", name: "Understand", num: "02", color: "var(--info)" },
  { id: "reason", name: "Reason", num: "03", color: "var(--warning)" },
  { id: "act", name: "Act", num: "04", color: "var(--critical)" },
  { id: "report", name: "Report", num: "05", color: "var(--signal)" }
];

interface PhaseCardProps {
  phase: typeof PHASES[number];
  status: "pending" | "active" | "complete";
  logs: string[];
}

function PhaseCard({ phase, status, logs }: PhaseCardProps) {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [logs]);

  let borderStyle = "border-[var(--border)]";
  let bgStyle = "bg-[var(--surface)]";

  if (status === "complete") {
    bgStyle = "bg-[var(--signal-dim)]";
  }

  const customStyle: React.CSSProperties = {};
  if (status === "active") {
    customStyle.border = `1px solid ${phase.color}`;
    customStyle.borderLeft = `3px solid ${phase.color}`;
  }

  return (
    <div
      style={customStyle}
      className={`w-full border rounded-[var(--radius-lg)] p-5 transition-all duration-300 ${
        status === "active" ? "" : borderStyle
      } ${bgStyle} flex flex-col gap-3`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`font-[family-name:var(--font-mono)] text-xs ${
              status === "pending" ? "text-[var(--muted)]" : "text-[var(--text)] font-semibold"
            }`}
          >
            {phase.num}
          </span>
          <span
            className={`font-medium ${
              status === "pending"
                ? "text-[var(--text-secondary)]"
                : "text-[var(--text)] font-semibold"
            }`}
          >
            {phase.name}
          </span>
        </div>
        {status === "complete" && (
          <span className="text-[var(--signal)] font-bold text-sm">✓</span>
        )}
      </div>

      {status === "active" && (
        <div className="w-full space-y-3">
          {/* Thin progress bar */}
          <div className="w-full h-[3px] bg-[var(--elevated)] rounded-full overflow-hidden">
            <div
              style={{ backgroundColor: phase.color }}
              className="h-full animate-grow-bar rounded-full"
            />
          </div>

          {/* Streaming Log Area */}
          <pre
            ref={preRef}
            className="w-full bg-[var(--elevated)] rounded-[var(--radius)] font-[family-name:var(--font-mono)] text-[12px] text-[var(--text-secondary)] p-3 max-h-[120px] overflow-y-auto whitespace-pre-wrap text-left leading-relaxed"
          >
            {logs.length > 0 ? logs.join("\n") : "Initializing phase logs..."}
          </pre>
        </div>
      )}
    </div>
  );
}

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id");
  const repoParam = searchParams.get("repo");
  const repoUrl = repoParam ? decodeURIComponent(repoParam) : "GitHub Repository";
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [phaseStates, setPhaseStates] = useState<
    Record<string, { status: "pending" | "active" | "complete"; logs: string[] }>
  >({
    observe: { status: "pending", logs: [] },
    understand: { status: "pending", logs: [] },
    reason: { status: "pending", logs: [] },
    act: { status: "pending", logs: [] },
    report: { status: "pending", logs: [] }
  });

  const wsRef = useRef<WebSocket | null>(null);

  // Validate Job ID
  useEffect(() => {
    if (!jobId) {
      setError("No analysis job ID provided.");
    }
  }, [jobId]);

  // Connect to WebSocket
  useEffect(() => {
    if (!jobId) return;

    const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const API_URL = RAW_API_URL.replace(/\/$/, "");
    const WS_URL = API_URL.replace(/^http/, "ws");

    const ws = new WebSocket(`${WS_URL}/v1/ws/${jobId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "ping") return;

        // Check for error status
        if (
          msg.status === "error" ||
          msg.error ||
          msg.status === "failed" ||
          msg.phase === "failed"
        ) {
          setError(msg.message || msg.error || "An error occurred during agent execution.");
          return;
        }

        const rawPhase = msg.phase?.toLowerCase();
        if (!rawPhase) return;

        const phaseIndex = PHASES.findIndex((p) => p.id === rawPhase);
        if (phaseIndex !== -1) {
          setPhaseStates((prev) => {
            const next = { ...prev };

            // Complete all preceding phases
            for (let i = 0; i < phaseIndex; i++) {
              const pid = PHASES[i].id;
              if (next[pid].status !== "complete") {
                next[pid] = { ...next[pid], status: "complete" };
              }
            }

            const currentPid = PHASES[phaseIndex].id;
            const newLogs = msg.message
              ? [...next[currentPid].logs, msg.message]
              : next[currentPid].logs;

            if (msg.status === "complete") {
              next[currentPid] = { status: "complete", logs: newLogs };
            } else {
              next[currentPid] = { status: "active", logs: newLogs };
            }

            return next;
          });

          // Check if report phase is completed
          if (rawPhase === "report" && msg.status === "complete") {
            setTimeout(() => {
              router.push(`/report?job_id=${jobId}`);
            }, 1200);
          }
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setError("Failed to establish live progress connection.");
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      ws.close();
    };
  }, [jobId, router]);

  return (
    <div className="min-h-screen w-full bg-[var(--void)] text-[var(--text)] font-[family-name:var(--font-ui)] flex flex-col justify-between items-center">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes grow-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-pulse-dot {
          animation: pulse 1.5s infinite ease-in-out;
        }
        .animate-grow-bar {
          animation: grow-bar 10s ease-out forwards;
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 h-14 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-[var(--signal)] text-sm">●</span>
          <span className="font-[family-name:var(--font-mono)] font-semibold text-[var(--text)] tracking-tight">RepoSage</span>
        </Link>
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
      <main className="flex-1 w-full max-w-[680px] px-4 pt-[104px] pb-16 flex flex-col gap-6">
        {/* Repo context bar */}
        <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] font-[family-name:var(--font-mono)] text-[13px] truncate pr-4">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            <span className="truncate">{repoUrl}</span>
          </div>
          {!error && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] animate-pulse-dot" />
              <span className="font-[family-name:var(--font-mono)] text-[11px] font-bold text-[var(--signal)] tracking-wider">RUNNING</span>
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="w-full bg-[var(--critical-dim)] border border-[var(--critical)] rounded-[var(--radius)] p-4 flex flex-col gap-4 text-left animate-fadeIn">
            <div className="flex items-start gap-3 text-[var(--critical)]">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">Execution Error</h3>
                <p className="text-xs font-[family-name:var(--font-mono)] leading-relaxed">{error}</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              className="self-start px-4 py-2 bg-[var(--critical)] text-[#0A0C0F] font-[family-name:var(--font-mono)] font-bold text-xs rounded hover:opacity-90 transition-opacity cursor-pointer"
            >
              ← RETRY ANALYSIS
            </button>
          </div>
        )}

        {/* Phase List */}
        <div className="w-full flex flex-col gap-4">
          {PHASES.map((phase) => {
            const state = phaseStates[phase.id] || { status: "pending", logs: [] };
            return (
              <PhaseCard
                key={phase.id}
                phase={phase}
                status={state.status}
                logs={state.logs}
              />
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[680px] border-t border-[var(--border)] py-6 text-center text-[12px] font-[family-name:var(--font-mono)] text-[var(--muted)] px-4">
        &copy; {new Date().getFullYear()} RepoSage. All reports are persisted securely.
      </footer>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--void)] text-[var(--text)] flex items-center justify-center font-[family-name:var(--font-mono)] text-sm">
        Initializing analysis progress...
      </div>
    }>
      <AnalyzeContent />
    </Suspense>
  );
}

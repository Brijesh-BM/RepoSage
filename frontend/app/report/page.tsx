"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import "@/styles/design-tokens.css";

interface CriticalIssue {
  title: string;
  severity: string;
  affected_files: string[];
  root_cause: string;
  fix: string;
  confidence: number;
}

interface SecurityRisk {
  title: string;
  severity: string;
  description: string;
  suggested_fix: string;
}

interface TechDebtItem {
  category: string;
  description: string;
  severity: string;
  estimated_effort: string;
}

interface Recommendation {
  action: string;
  rationale: string;
  priority: string;
}

interface PositiveSignal {
  signal: string;
  evidence: string;
}

interface ReportData {
  id: string;
  job_id: string;
  health_score: number;
  tech_stack: string[];
  critical_issues: CriticalIssue[];
  security_risks: SecurityRisk[];
  tech_debt: TechDebtItem[];
  recommendations: Recommendation[];
  next_actions: string[];
  positive_signals: PositiveSignal[];
}

function ReportSkeleton() {
  return (
    <div className="w-full max-w-[800px] space-y-8 animate-pulse text-left pt-6 px-4">
      {/* Gauge skeleton */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-40 h-40 rounded-full bg-[var(--surface)] border-8 border-[var(--elevated)]" />
        <div className="h-4 bg-[var(--surface)] w-24 rounded" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[var(--elevated)] rounded-[var(--radius)] p-4 h-18 space-y-2">
            <div className="h-3 bg-[var(--surface)] w-16 rounded" />
            <div className="h-5 bg-[var(--surface)] w-10 rounded" />
          </div>
        ))}
      </div>

      {/* Sections skeleton */}
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-[var(--surface)] rounded animate-pulse" />
              <div className="h-4 bg-[var(--surface)] w-32 rounded animate-pulse" />
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 space-y-3">
              <div className="flex gap-2">
                <div className="h-4 bg-[var(--elevated)] w-16 rounded animate-pulse" />
                <div className="h-4 bg-[var(--elevated)] w-48 rounded animate-pulse" />
              </div>
              <div className="h-3 bg-[var(--elevated)] w-full rounded animate-pulse" />
              <div className="h-3 bg-[var(--elevated)] w-3/4 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getBadgeStyle(severity: string) {
  const sev = severity?.toUpperCase();
  if (sev === "CRITICAL" || sev === "HIGH") {
    return {
      label: "CRITICAL",
      className: "bg-[var(--critical-dim)] text-[var(--critical)]"
    };
  } else if (sev === "WARNING" || sev === "MEDIUM") {
    return {
      label: "WARNING",
      className: "bg-[var(--warning-dim)] text-[var(--warning)]"
    };
  } else if (sev === "INFO" || sev === "LOW") {
    return {
      label: "INFO",
      className: "bg-[var(--info-dim)] text-[var(--info)]"
    };
  } else {
    return {
      label: sev || "PASS",
      className: "bg-[var(--signal-dim)] text-[var(--signal-text)]"
    };
  }
}

function FindingCard({
  badge,
  title,
  body,
  affectedFiles,
  recommendation
}: {
  badge: { label: string; className: string };
  title: string;
  body: string;
  affectedFiles?: string[];
  recommendation?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] transition-all duration-200 overflow-hidden flex flex-col w-full text-left"
    >
      {/* Header Row - always visible, clickable */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-[family-name:var(--font-mono)] font-semibold shrink-0 ${badge.className}`}>
            {badge.label}
          </span>
          <span className="font-semibold text-[var(--text)] text-sm text-left leading-normal">{title}</span>
        </div>
        <svg
          className={`w-4 h-4 text-[var(--muted)] transition-transform duration-200 shrink-0 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-5 pt-1 border-t border-[var(--border)] space-y-4 text-left animate-fadeIn">
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{body}</p>

          {affectedFiles && affectedFiles.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-[family-name:var(--font-mono)] text-[var(--muted)] uppercase tracking-wider">
                Affected Files
              </div>
              <div className="flex flex-wrap gap-1.5">
                {affectedFiles.map((file, fIdx) => (
                  <span
                    key={fIdx}
                    className="bg-[var(--elevated)] px-2 py-0.5 rounded text-[11px] font-[family-name:var(--font-mono)] text-[var(--text-secondary)] max-w-full truncate"
                    title={file}
                  >
                    {file}
                  </span>
                ))}
              </div>
            </div>
          )}

          {recommendation && (
            <div className="pt-3 border-t border-[var(--border)] text-[var(--signal-text)] italic text-[13px] leading-relaxed">
              <span className="font-[family-name:var(--font-mono)] font-medium not-italic mr-1.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Mitigation / Fix:
              </span>
              {recommendation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--void)] text-[var(--text)] flex items-center justify-center font-[family-name:var(--font-mono)] text-sm">
        Initializing report viewer...
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}

function ReportContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id");

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayScore, setDisplayScore] = useState(0);

  // Fetch report data
  useEffect(() => {
    if (!jobId) {
      setError("No report job ID provided.");
      setLoading(false);
      return;
    }

    fetch(`https://reposage-c236.onrender.com/report/${jobId}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to load report data from the server.");
      })
      .then((data) => {
        setReport(data);
      })
      .catch((err) => {
        setError(err.message || "Could not retrieve report from server.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [jobId]);

  // Animate circular health gauge
  useEffect(() => {
    if (!report) return;
    const targetScore = report.health_score ?? 0;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic curve
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(easeOutProgress * targetScore));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [report]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[var(--void)] text-[var(--text)] font-[family-name:var(--font-ui)] flex flex-col justify-between items-center">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 w-full z-50 h-14 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[var(--signal)] text-sm">●</span>
            <span className="font-[family-name:var(--font-mono)] font-semibold text-[var(--text)] tracking-tight">RepoSage</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-[family-name:var(--font-mono)] text-[var(--muted)] border border-[var(--border)] px-1.5 py-0.5 rounded">v1.0</span>
          </div>
        </nav>
        <main className="flex-1 w-full max-w-[800px] px-4 pt-[104px] pb-16 flex flex-col items-center">
          <ReportSkeleton />
        </main>
        <footer className="w-full max-w-[800px] border-t border-[var(--border)] py-6 text-center text-[12px] font-[family-name:var(--font-mono)] text-[var(--muted)] px-4">
          &copy; {new Date().getFullYear()} RepoSage.
        </footer>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen w-full bg-[var(--void)] text-[var(--text)] font-[family-name:var(--font-ui)] flex flex-col justify-between items-center pt-24 pb-8">
        <nav className="fixed top-0 left-0 w-full z-50 h-14 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[var(--signal)] text-sm">●</span>
            <span className="font-[family-name:var(--font-mono)] font-semibold text-[var(--text)] tracking-tight">RepoSage</span>
          </Link>
        </nav>
        <main className="flex-1 flex flex-col justify-center items-center w-full max-w-md px-6">
          <div className="w-full bg-[var(--critical-dim)] border border-[var(--critical)] rounded-[var(--radius)] p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[var(--critical)] mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">Failed to Load Report</h2>
            <p className="text-sm text-[var(--text-secondary)]">{error || "The requested report is unavailable."}</p>
            <Link
              href="/"
              className="inline-block px-5 py-2 bg-[var(--critical)] text-[#0A0C0F] font-[family-name:var(--font-mono)] font-bold text-xs rounded hover:opacity-90 transition-opacity"
            >
              ← RETURN HOME
            </Link>
          </div>
        </main>
        <footer className="w-full max-w-[800px] border-t border-[var(--border)] py-6 text-center text-[12px] font-[family-name:var(--font-mono)] text-[var(--muted)] px-4">
          &copy; {new Date().getFullYear()} RepoSage.
        </footer>
      </div>
    );
  }

  // Determine color and status string for health gauge
  let gaugeColor = "var(--signal)";
  let gradeLabel = "EXCELLENT";

  if (displayScore < 60) {
    gaugeColor = "var(--critical)";
    gradeLabel = "CRITICAL";
  } else if (displayScore < 80) {
    gaugeColor = "var(--warning)";
    gradeLabel = "NEEDS WORK";
  } else if (displayScore < 90) {
    gaugeColor = "var(--signal)";
    gradeLabel = "HEALTHY";
  } else {
    gaugeColor = "var(--signal)";
    gradeLabel = "EXCELLENT";
  }

  const strokeDashoffset = (440 * (100 - displayScore)) / 100;

  return (
    <div className="min-h-screen w-full bg-[var(--void)] text-[var(--text)] font-[family-name:var(--font-ui)] flex flex-col justify-between items-center">
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
      <main className="flex-1 w-full max-w-[800px] px-4 pt-[104px] pb-16 flex flex-col items-center gap-8 text-center">
        {/* Animated Health Gauge */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 160 160">
              {/* Outer Ring Background */}
              <circle
                cx="80"
                cy="80"
                r="70"
                className="stroke-[var(--elevated)] fill-none"
                strokeWidth="10"
              />
              {/* Foreground Animated Arc */}
              <circle
                cx="80"
                cy="80"
                r="70"
                style={{
                  stroke: gaugeColor,
                  strokeDasharray: "440",
                  strokeDashoffset: strokeDashoffset,
                  transition: "stroke-dashoffset 0.05s linear",
                }}
                className="fill-none"
                strokeWidth="10"
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-[family-name:var(--font-mono)] text-4xl font-bold text-white">
                {displayScore}
              </span>
              <span className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--muted)]">
                / 100
              </span>
            </div>
          </div>

          <div
            style={{ color: gaugeColor }}
            className="font-[family-name:var(--font-mono)] font-bold text-xs uppercase tracking-widest mt-1"
          >
            {gradeLabel}
          </div>
        </div>

        {/* Summary Stat Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
          <div className="bg-[var(--elevated)] rounded-[var(--radius)] p-3 px-4.5 text-left border border-[var(--border)]">
            <div className="text-[10px] font-[family-name:var(--font-mono)] text-[var(--muted)] uppercase tracking-wider mb-1">
              Issues Count
            </div>
            <div className="text-xl font-bold font-[family-name:var(--font-mono)] text-[var(--critical)]">
              {report.critical_issues.length}
            </div>
          </div>
          <div className="bg-[var(--elevated)] rounded-[var(--radius)] p-3 px-4.5 text-left border border-[var(--border)]">
            <div className="text-[10px] font-[family-name:var(--font-mono)] text-[var(--muted)] uppercase tracking-wider mb-1">
              Security Risks
            </div>
            <div className="text-xl font-bold font-[family-name:var(--font-mono)] text-[var(--critical)]">
              {report.security_risks.length}
            </div>
          </div>
          <div className="bg-[var(--elevated)] rounded-[var(--radius)] p-3 px-4.5 text-left border border-[var(--border)]">
            <div className="text-[10px] font-[family-name:var(--font-mono)] text-[var(--muted)] uppercase tracking-wider mb-1">
              Tech Debt Items
            </div>
            <div className="text-xl font-bold font-[family-name:var(--font-mono)] text-[var(--warning)]">
              {report.tech_debt.length}
            </div>
          </div>
          <div className="bg-[var(--elevated)] rounded-[var(--radius)] p-3 px-4.5 text-left border border-[var(--border)]">
            <div className="text-[10px] font-[family-name:var(--font-mono)] text-[var(--muted)] uppercase tracking-wider mb-1">
              Positive Signals
            </div>
            <div className="text-xl font-bold font-[family-name:var(--font-mono)] text-[var(--signal)]">
              {report.positive_signals.length}
            </div>
          </div>
        </div>

        {report.tech_stack && report.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center w-full mt-2 animate-fadeIn">
            {report.tech_stack.map((tech, i) => (
              <span key={i} className="bg-[var(--elevated)] border border-[var(--border)] rounded-[20px] px-3 py-1 text-[11px] font-[family-name:var(--font-mono)] text-[var(--text-secondary)] uppercase tracking-wider">
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Findings Sections */}
        <div className="w-full space-y-8 mt-4">
          
          {/* Section: Critical Issues */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-[2px] bg-[var(--critical)]" />
              <h2 className="text-[18px] font-medium text-white">Critical Issues</h2>
            </div>
            {report.critical_issues.length === 0 ? (
              <div className="text-[12px] font-[family-name:var(--font-mono)] text-[var(--muted)] text-left pl-3">
                (none found)
              </div>
            ) : (
              <div className="space-y-4">
                {report.critical_issues.map((issue, idx) => {
                  const badge = getBadgeStyle(issue.severity);
                  return (
                    <FindingCard
                      key={idx}
                      badge={badge}
                      title={issue.title}
                      body={issue.root_cause}
                      affectedFiles={issue.affected_files}
                      recommendation={issue.fix}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Security Risks */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-[2px] bg-[var(--critical)]" />
              <h2 className="text-[18px] font-medium text-white">Security Risks</h2>
            </div>
            {report.security_risks.length === 0 ? (
              <div className="text-[12px] font-[family-name:var(--font-mono)] text-[var(--muted)] text-left pl-3">
                (none found)
              </div>
            ) : (
              <div className="space-y-4">
                {report.security_risks.map((risk, idx) => {
                  const badge = getBadgeStyle(risk.severity);
                  return (
                    <FindingCard
                      key={idx}
                      badge={badge}
                      title={risk.title}
                      body={risk.description}
                      recommendation={risk.suggested_fix}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Tech Debt */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-[2px] bg-[var(--warning)]" />
              <h2 className="text-[18px] font-medium text-white">Tech Debt</h2>
            </div>
            {report.tech_debt.length === 0 ? (
              <div className="text-[12px] font-[family-name:var(--font-mono)] text-[var(--muted)] text-left pl-3">
                (none found)
              </div>
            ) : (
              <div className="space-y-4">
                {report.tech_debt.map((debt, idx) => {
                  const badge = getBadgeStyle(debt.severity);
                  return (
                    <FindingCard
                      key={idx}
                      badge={badge}
                      title={debt.category}
                      body={debt.description}
                      recommendation={debt.estimated_effort ? `Estimated effort to refactor: ${debt.estimated_effort}` : undefined}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Recommendations */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-[2px] bg-[var(--info)]" />
              <h2 className="text-[18px] font-medium text-white">Recommendations</h2>
            </div>
            {report.recommendations.length === 0 ? (
              <div className="text-[12px] font-[family-name:var(--font-mono)] text-[var(--muted)] text-left pl-3">
                (none found)
              </div>
            ) : (
              <div className="space-y-4">
                {report.recommendations.map((rec, idx) => {
                  const badge = getBadgeStyle(rec.priority);
                  return (
                    <FindingCard
                      key={idx}
                      badge={badge}
                      title={rec.action}
                      body={rec.rationale}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Positive Signals */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-[2px] bg-[var(--signal)]" />
              <h2 className="text-[18px] font-medium text-white">Positive Signals</h2>
            </div>
            {report.positive_signals.length === 0 ? (
              <div className="text-[12px] font-[family-name:var(--font-mono)] text-[var(--muted)] text-left pl-3">
                (none found)
              </div>
            ) : (
              <div className="space-y-4">
                {report.positive_signals.map((sig, idx) => {
                  const badge = { label: "PASS", className: "bg-[var(--signal-dim)] text-[var(--signal-text)]" };
                  return (
                    <FindingCard
                      key={idx}
                      badge={badge}
                      title={sig.signal}
                      body={sig.evidence}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Next Actions */}
          {report.next_actions && report.next_actions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-[2px] bg-[var(--signal)]" />
                <h2 className="text-[18px] font-medium text-white">Suggested Next Actions</h2>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 text-left">
                <ul className="space-y-3">
                  {report.next_actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)] leading-relaxed font-sans">
                      <span className="w-4 h-4 rounded-md border border-[var(--signal)]/30 flex items-center justify-center text-[var(--signal)] shrink-0 mt-0.5 bg-[var(--signal-dim)] text-[9px] font-bold">
                        ✓
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Footer CTA */}
        <div className="w-full mt-12 mb-6 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-[var(--border)] rounded-[var(--radius)] px-6 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--text-secondary)] hover:text-white hover:border-[var(--signal)] hover:bg-[rgba(255,255,255,0.01)] transition-colors duration-300"
          >
            ← ANALYZE ANOTHER REPOSITORY
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[800px] border-t border-[var(--border)] py-6 text-center text-[12px] font-[family-name:var(--font-mono)] text-[var(--muted)] px-4">
        &copy; {new Date().getFullYear()} RepoSage. All reports are persisted securely.
      </footer>
    </div>
  );
}

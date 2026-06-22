"use client";

import { CriticalIssue } from "../lib/types";

interface IssueCardProps {
  issue: CriticalIssue;
}

export default function IssueCard({ issue }: IssueCardProps) {
  const getSeverityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    }
  };

  const confidencePct = Math.round(issue.confidence * 100);

  return (
    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 shadow-md relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
      {/* Decorative vertical bar representing severity */}
      <div className={`absolute top-0 bottom-0 left-0 w-1 ${
        issue.severity.toLowerCase() === "high" ? "bg-rose-500" :
        issue.severity.toLowerCase() === "medium" ? "bg-amber-500" : "bg-sky-500"
      }`} />
      
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
          {issue.title}
        </h4>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getSeverityStyle(issue.severity)}`}>
            {issue.severity}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Confidence: <span className="text-slate-300">{confidencePct}%</span>
          </span>
        </div>
      </div>

      <div className="space-y-3.5 mt-4">
        {/* Root Cause */}
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Root Cause Analysis
          </span>
          <p className="text-slate-300 text-sm leading-relaxed">{issue.root_cause}</p>
        </div>

        {/* Suggested Fix */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850/80">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1.5">
            Suggested Fix / Recommendation
          </span>
          <p className="text-slate-300 text-xs font-mono whitespace-pre-wrap leading-relaxed">
            {issue.fix}
          </p>
        </div>

        {/* Affected Files */}
        {issue.affected_files && issue.affected_files.length > 0 && (
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Implicated Files
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {issue.affected_files.map((file, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {file}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

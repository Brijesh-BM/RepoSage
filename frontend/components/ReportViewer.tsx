"use client";

import { useState } from "react";
import { Report } from "../lib/types";
import HealthScore from "./HealthScore";
import IssueCard from "./IssueCard";
import RecommendationCard from "./RecommendationCard";

interface ReportViewerProps {
  report: Report;
  repoUrl: string;
}

export default function ReportViewer({ report, repoUrl }: ReportViewerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "issues" | "security" | "debt">("overview");

  // Helper to extract repo name from URL for header
  const getRepoName = () => {
    try {
      const pathParts = repoUrl.replace("https://", "").replace("http://", "").split("github.com/");
      const parts = pathParts[pathParts.length - 1].split("/");
      return `${parts[0]}/${parts[1]}`;
    } catch {
      return repoUrl;
    }
  };

  return (
    <div className="w-full max-w-5xl space-y-6 animate-fadeIn">
      {/* Header snapshot */}
      <div className="p-8 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Analysis Report</span>
          <h1 className="text-3xl font-black text-white mt-1 break-all">{getRepoName()}</h1>
          <p className="text-slate-400 text-xs mt-2 flex items-center gap-1.5 font-mono">
            <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 hover:underline">
              {repoUrl}
            </a>
          </p>

          <div className="flex flex-wrap gap-1.5 mt-4">
            {report.tech_stack.map((tech, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-750">
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-center">
          <HealthScore score={report.health_score} />
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-850 gap-2 overflow-x-auto pb-px">
        {[
          { id: "overview", label: "Overview", icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
          ) },
          { id: "issues", label: `Critical Issues (${report.critical_issues.length})`, icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          ) },
          { id: "security", label: `Security Risks (${report.security_risks.length})`, icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          ) },
          { id: "debt", label: `Tech Debt (${report.tech_debt.length})`, icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          ) }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all focus:outline-none whitespace-nowrap ${
              activeTab === tab.id
                ? "border-emerald-500 text-emerald-400 bg-slate-900/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="py-4">
        {/* OVERVIEW PANEL */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Refactoring & Recommendations */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md">
                <h3 className="text-base font-bold text-white mb-4">Key Engineering Recommendations</h3>
                <div className="space-y-3">
                  {report.recommendations.length > 0 ? (
                    report.recommendations.map((rec, idx) => (
                      <RecommendationCard key={idx} recommendation={rec} />
                    ))
                  ) : (
                    <p className="text-slate-500 text-xs italic">No refactoring recommendations generated.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Next Actions checklist */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md">
                <h3 className="text-base font-bold text-white mb-4">Suggested Next Actions</h3>
                <ul className="space-y-3">
                  {report.next_actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-350 leading-relaxed font-sans">
                      <span className="w-4 h-4 rounded-md border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 bg-emerald-500/5">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* CRITICAL ISSUES PANEL */}
        {activeTab === "issues" && (
          <div className="space-y-4 max-w-4xl">
            {report.critical_issues.length > 0 ? (
              report.critical_issues.map((issue, idx) => (
                <IssueCard key={idx} issue={issue} />
              ))
            ) : (
              <div className="p-8 text-center bg-slate-900/20 rounded-2xl border border-slate-850">
                <p className="text-slate-400 text-sm">No critical issues identified. Great job!</p>
              </div>
            )}
          </div>
        )}

        {/* SECURITY RISKS PANEL */}
        {activeTab === "security" && (
          <div className="space-y-4 max-w-4xl">
            {report.security_risks.length > 0 ? (
              report.security_risks.map((risk, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-slate-900/40 border border-rose-950/40 shadow-md flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{risk.title}</h4>
                      <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {risk.severity} Risk
                      </span>
                    </div>
                    <p className="text-slate-350 text-xs leading-relaxed">{risk.description}</p>
                    
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850/80 mt-2">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-450 mb-1">
                        Mitigation Recommendation
                      </span>
                      <p className="text-slate-300 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                        {risk.suggested_fix}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-900/20 rounded-2xl border border-slate-850">
                <p className="text-slate-400 text-sm">No security vulnerabilities found.</p>
              </div>
            )}
          </div>
        )}

        {/* TECH DEBT PANEL */}
        {activeTab === "debt" && (
          <div className="space-y-4 max-w-4xl">
            {report.tech_debt.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.tech_debt.map((debt, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{debt.category}</span>
                        <div className="flex gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border ${
                            debt.severity === "high" ? "bg-rose-500/10 text-rose-400 border-rose-500/25" :
                            debt.severity === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/25" : "bg-sky-500/10 text-sky-400 border-sky-500/25"
                          }`}>
                            {debt.severity} Severity
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">{debt.description}</p>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-850/60 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-slate-500">Estimated Effort to Refactor</span>
                      <span className="text-xs font-bold text-teal-400 capitalize">{debt.estimated_effort}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-900/20 rounded-2xl border border-slate-850">
                <p className="text-slate-400 text-sm">No significant technical debt flagged.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

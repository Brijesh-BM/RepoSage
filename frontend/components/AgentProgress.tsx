"use client";

import { useEffect, useRef } from "react";
import { AgentStep } from "../lib/types";

interface AgentProgressProps {
  steps: AgentStep[];
}

export default function AgentProgress({ steps }: AgentProgressProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll progress log to bottom when a new step arrives
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [steps]);

  // Find the latest active step
  const latestStep = steps.length > 0 ? steps[steps.length - 1] : null;
  const overallProgress = latestStep ? Math.round(latestStep.progress * 100) : 0;

  // Phase badges helper
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "observe":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "understand":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "reason":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "act":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "report":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "failed":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="w-full max-w-2xl p-8 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-2xl relative">
      <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
        <svg className="animate-spin h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Agent Executing...
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        The agent is executing the 5-phase loop (Observe → Understand → Reason → Act → Report).
      </p>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Overall Progress
          </span>
          <span className="text-sm font-bold text-emerald-400">{overallProgress}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Timeline Steps Log */}
      <div
        ref={containerRef}
        className="h-64 overflow-y-auto pr-2 space-y-4 scroll-smooth border border-slate-850 p-4 rounded-xl bg-slate-950/80 font-mono text-xs leading-relaxed"
        style={{ scrollbarWidth: "thin" }}
      >
        {steps.length === 0 ? (
          <div className="text-slate-600 italic">Initializing agent connection...</div>
        ) : (
          steps.map((step, idx) => (
            <div key={idx} className="flex gap-3 border-b border-slate-900/50 pb-2.5 last:border-0 last:pb-0">
              <span className="text-slate-500 shrink-0">
                [{new Date(step.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shrink-0 border ${getPhaseColor(step.phase)}`}>
                {step.phase}
              </span>
              <div className="flex-1 text-slate-300">
                {step.message}
                {step.status === "running" && (
                  <span className="inline-flex items-center ml-1 text-emerald-400 animate-pulse">▋</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { Recommendation } from "../lib/types";

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export default function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const getPriorityStyle = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "text-rose-400 border-rose-500/20 bg-rose-500/5";
      case "medium":
        return "text-amber-400 border-amber-500/20 bg-amber-500/5";
      default:
        return "text-sky-400 border-sky-500/20 bg-sky-500/5";
    }
  };

  return (
    <div className="p-5 rounded-xl bg-slate-900/30 border border-slate-800/80 hover:border-slate-700/80 transition-all flex gap-4">
      {/* Icon representing priority */}
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${getPriorityStyle(recommendation.priority)}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          {recommendation.priority.toLowerCase() === "high" ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" />
          ) : recommendation.priority.toLowerCase() === "medium" ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75L12 3m0 0l3.75 3.75M12 3v18" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5" />
          )}
        </svg>
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-bold text-white">{recommendation.action}</h4>
          <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-widest border ${getPriorityStyle(recommendation.priority)}`}>
            {recommendation.priority}
          </span>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">{recommendation.rationale}</p>
      </div>
    </div>
  );
}

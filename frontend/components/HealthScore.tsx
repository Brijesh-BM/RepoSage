"use client";

interface HealthScoreProps {
  score: number;
}

export default function HealthScore({ score }: HealthScoreProps) {
  // Determine color theme based on score range
  const getColor = () => {
    if (score >= 80) return { text: "text-emerald-400", stroke: "stroke-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    if (score >= 50) return { text: "text-amber-400", stroke: "stroke-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    return { text: "text-rose-400", stroke: "stroke-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" };
  };

  const colors = getColor();
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/40 border backdrop-blur-sm ${colors.border}`}>
      <div className="relative flex items-center justify-center w-36 h-36">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            className="stroke-slate-800"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            className={`transition-all duration-1000 ease-out ${colors.stroke}`}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{score}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Score</span>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <h3 className="text-sm font-bold text-white">Repository Health</h3>
        <p className="text-xs text-slate-400 mt-0.5">Based on analyzed issues and tech debt.</p>
      </div>
    </div>
  );
}

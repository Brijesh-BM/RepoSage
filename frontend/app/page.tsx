"use client";

import { useRouter } from "next/navigation";
import RepoInput from "../components/RepoInput";

export default function Home() {
  const router = useRouter();

  const handleJobCreated = (jobId: string) => {
    router.push(`/analyze/${jobId}`);
  };

  return (
    <div className="min-h-screen bg-[#07080d] text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Decorative background glow circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900/40 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20">
            R
          </div>
          <span className="font-black text-xl tracking-tight text-white">RepoSage</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* Main hero & input */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative z-10">
        <div className="w-full max-w-3xl text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            AI Junior Software Engineer v1.0
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
            An AI Engineering Assistant that <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              understands your codebase.
            </span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Paste any GitHub repository URL. Our agent will autonomously traverse files, audit open issues, commits, and PRs, and generate a comprehensive engineering report with code fixes.
          </p>
        </div>

        <RepoInput onJobCreated={handleJobCreated} />

        {/* Workflow steps card */}
        <div className="w-full max-w-4xl mt-20 grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: "01", name: "Observe", desc: "Traverses file structures, issues, commits & PRs." },
            { step: "02", name: "Understand", desc: "Determines languages, architecture & tech stack." },
            { step: "03", name: "Reason", desc: "Correlates bugs with specific codebase files." },
            { step: "04", name: "Act", desc: "Formulates structural code fixes & refactoring plans." },
            { step: "05", name: "Report", desc: "Aggregates items into a detailed engineering audit." }
          ].map((item, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-slate-900/25 border border-slate-900/60 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-650 font-mono tracking-wider">{item.step}</span>
                <span className="w-1 h-1 rounded-full bg-slate-800" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">{item.name}</h3>
                <p className="text-slate-400 text-[11px] leading-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-900/40 text-xs text-slate-500 relative z-10">
        <div>
          &copy; {new Date().getFullYear()} RepoSage. Built for developers as a Software Engineering Agent.
        </div>
        <div className="flex gap-4">
          <span>FastAPI Backend</span>
          <span className="text-slate-800">•</span>
          <span>Next.js Frontend</span>
          <span className="text-slate-800">•</span>
          <span>Google Gemini AI</span>
        </div>
      </footer>
    </div>
  );
}

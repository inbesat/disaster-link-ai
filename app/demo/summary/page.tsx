import type { Metadata } from "next";

// ---------------------------------------------------------------------
// app/demo/summary/page.tsx — Phase 15 · Step 7 · Pitch Slide Auto-Generator.
//
// A single, beautiful, minimal presentation slide that summarises the
// project for the hackathon submission portal. The page is fully static
// (server component) and designed to fit exactly one A4 landscape page
// when printed:
//
//   CMD+P (macOS) / Ctrl+P → "Save as PDF" → submit.
//
// The injected @media print stylesheet isolates the slide (`#summary-slide`)
// from the app chrome (fixed cards, toggles, nav), hides every decorative
// layer, and re-keys the dark pitch colours to a clean white/black read so
// the PDF looks sharp on a printed page.
// ---------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Pitch Summary Slide | SafeSphere",
  description:
    "One-page summary — the problem, the SafeSphere solution, the tech stack, and the team.",
};

const PROBLEMS = [
  "Floods & cyclones displace lakhs across Bihar every year",
  "District ops still run on phone calls and spreadsheets",
  "Alerts arrive late, one-way, and too generic to act on",
  "No single view of shelters, boats, or who is in harm's way",
];

const PILLARS = [
  {
    kicker: "Predict",
    text: "AI flood forecast hours ahead, with per-village confidence scores",
    accent: "text-cyan-300 print:text-cyan-800",
    ring: "border-cyan-400/30 print:border-cyan-300",
  },
  {
    kicker: "Alert",
    text: "SMS · push · voice reaches exactly the people at risk, instantly",
    accent: "text-amber-300 print:text-amber-800",
    ring: "border-amber-400/30 print:border-amber-300",
  },
  {
    kicker: "Dispatch",
    text: "Allocation engine routes boats, med-kits and teams in minutes",
    accent: "text-emerald-300 print:text-emerald-800",
    ring: "border-emerald-400/30 print:border-emerald-300",
  },
  {
    kicker: "Empower",
    text: "Citizen app — shelters, safe routes, SOS and family check-in",
    accent: "text-rose-300 print:text-rose-800",
    ring: "border-rose-400/30 print:border-rose-300",
  },
];

const STACK = [
  { name: "Next.js", tag: "App Router · Server Actions · PWA", domain: "Frontend" },
  { name: "Supabase", tag: "Postgres · Auth · Realtime", domain: "Backend" },
  { name: "LangGraph", tag: "Multi-agent alert & allocation orchestration", domain: "AI / Agents" },
  { name: "OSRM", tag: "Routing to the safest shelter", domain: "Geo / Routing" },
];

const TEAM = ["Product & Design", "ML · Forecasting", "Platform · Full-Stack", "Field Ops"];

export default function DemoSummaryPage() {
  return (
    <>
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print {
          body { background: #ffffff !important; }
          body * { visibility: hidden; }
          #summary-slide, #summary-slide * { visibility: visible; }
          #summary-slide {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
        }
      `}</style>

      <main
        id="summary-slide"
        className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-[#060b16] px-10 py-8 text-white print:min-h-0 print:bg-white print:text-slate-900"
      >
        {/* Decorative glows — hidden on the printed page. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl print:hidden"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl print:hidden"
        />

        {/* Masthead */}
        <header className="relative z-10 flex items-end justify-between gap-6 border-b border-white/10 pb-4 print:border-slate-300">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300 print:text-cyan-800">
              SafeSphere · National Hackathon
            </p>
            <h1 className="mt-1.5 text-4xl font-black leading-tight tracking-tight">
              SafeSphere Platform
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400 print:text-slate-600">
              From prediction to rescue in minutes, not hours — AI forecasting, automated
              multi-channel alerting, and coordinated resource dispatch for district EOCs.
            </p>
          </div>
          <p className="shrink-0 pb-1 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-500 print:text-slate-400">
            Team DRIP
            <span className="mt-0.5 block font-normal normal-case tracking-normal">
              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </p>
        </header>

        {/* Sections */}
        <div className="relative z-10 grid flex-1 grid-cols-5 gap-4 py-5">
          {/* The Problem */}
          <section className="col-span-2 flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 print:border-slate-300 print:bg-slate-50">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-300 print:text-red-700">
              The Problem
            </p>
            <p className="text-xl font-black leading-tight">
              Minutes decide lives.
            </p>
            <ul className="mt-1 space-y-1.5">
              {PROBLEMS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-[13px] leading-snug text-slate-300 print:text-slate-700"
                >
                  <span aria-hidden className="mt-1.5 h-1 w-3 shrink-0 rounded-full bg-red-400 print:bg-red-500" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-auto pt-2 text-[11px] font-semibold text-slate-500 print:text-slate-500">
              “Every 15 minutes of delay costs more than the last one.”
            </p>
          </section>

          {/* The Solution */}
          <section className="col-span-3 flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 print:border-slate-300 print:bg-slate-50">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-300 print:text-emerald-700">
              The SafeSphere Solution
            </p>
            <div className="grid flex-1 grid-cols-2 gap-2.5">
              {PILLARS.map((pillar) => (
                <div
                  key={pillar.kicker}
                  className={`flex flex-col justify-between gap-1.5 rounded-xl border bg-black/20 p-3.5 ${pillar.ring} print:bg-white`}
                >
                  <p className={`text-sm font-black uppercase tracking-wider ${pillar.accent}`}>
                    {pillar.kicker}
                  </p>
                  <p className="text-xs leading-snug text-slate-300 print:text-slate-700">
                    {pillar.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* The Tech Stack */}
          <section className="col-span-3 flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 print:border-slate-300 print:bg-slate-50">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-300 print:text-sky-700">
              The Tech Stack
            </p>
            <div className="grid grid-cols-4 gap-2.5">
              {STACK.map((tech) => (
                <div
                  key={tech.name}
                  className="flex flex-col rounded-xl border border-white/10 bg-black/20 p-3 print:border-slate-300 print:bg-white"
                >
                  <p className="font-mono text-base font-bold">{tech.name}</p>
                  <p className="mt-1 text-[11px] leading-snug text-slate-400 print:text-slate-600">
                    {tech.tag}
                  </p>
                  <p className="mt-auto pt-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500 print:text-slate-400">
                    {tech.domain}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* The Team */}
          <section className="col-span-2 flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 print:border-slate-300 print:bg-slate-50">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300 print:text-amber-700">
              The Team
            </p>
            <p className="text-xl font-black leading-tight">Team SafeSphere</p>
            <p className="text-[13px] leading-snug text-slate-300 print:text-slate-700">
              Four builders shipping one platform — prediction, alerting, allocation and
              the citizen experience — for the SafeSphere mission.
            </p>
            <div className="mt-auto flex flex-wrap gap-1.5">
              {TEAM.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300 print:border-slate-300 print:bg-white print:text-slate-700"
                >
                  {role}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Footer strip */}
        <footer className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-slate-500 print:border-slate-300 print:text-slate-500">
          <span>
            <span className="font-mono font-bold text-cyan-300 print:text-cyan-800">DRIP</span>{" "}
            · SafeSphere Platform · live demo at /demo/present
          </span>
          <span className="print:hidden">⌘/Ctrl + P → save this slide as PDF</span>
          <span className="hidden print:block">SafeSphere · 2026</span>
        </footer>
      </main>
    </>
  );
}
"use client";

// ---------------------------------------------------------------------
// app/public/settings/sos-history/page.tsx — Phase 5 · Step 7 · SOS
// History & Resolution Log.
//
// Documentation of past emergencies for insurance or relief claims: a
// simple newest-first timeline rendering the mock incidents from
// lib/mock-data/sos-history.ts (date, incident type, resolution status,
// location + one-line outcome), with a "Download PDF Report" placeholder
// for post-disaster documentation.
// ---------------------------------------------------------------------

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileDown,
  History,
} from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import BottomNav from "@/components/public/BottomNav";
import {
  SOS_HISTORY,
  formatSosDate,
} from "@/lib/mock-data/sos-history";

export default function SosHistoryPage() {
  const downloadPlaceholder = () => {
    showToast("info", {
      title: "PDF report coming soon",
      description: "Your incident history is ready for official documentation.",
    });
  };

  return (
    <main className="relative flex min-h-screen flex-col bg-[var(--dl-navy)] text-[var(--dl-text-on-navy)]">
      {/* Ambient backdrop — same treatment as the other citizen pages */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_80%_-10%,rgba(37,99,235,0.22),transparent),radial-gradient(ellipse_45%_40%_at_0%_110%,rgba(249,115,22,0.14),transparent)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[calc(88px+env(safe-area-inset-bottom))]">
        {/* Sticky header */}
        <header className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-[var(--dl-navy)]/85 px-4 pb-3 pt-5 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <Link
              href="/public/dashboard"
              aria-label="Back to dashboard"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition hover:border-[var(--dl-orange)]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F97316]/20 ring-1 ring-[#F97316]/40">
                <History aria-hidden="true" className="h-4 w-4 text-[#FDBA74]" />
              </span>
              <div>
                <h1 className="text-base font-bold text-white">SOS History</h1>
                <p className="eoc-label text-[var(--dl-text-muted)]">
                  RESOLUTION LOG
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Download PDF placeholder */}
        <section className="mt-5">
          <button
            type="button"
            onClick={downloadPlaceholder}
            className="flex w-full items-center gap-3 rounded-[var(--dl-radius-sm)] border border-severity-green-500/40 bg-severity-green-500/10 px-4 py-3.5 text-left transition hover:bg-severity-green-500/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-green-400"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-severity-green-500/15 ring-1 ring-severity-green-500/40">
              <FileDown aria-hidden="true" className="h-5 w-5 text-severity-green-300" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-white">
                Download PDF Report
              </span>
              <span className="block text-xs text-[var(--dl-text-muted)]">
                Full incident history for insurance &amp; relief claims
              </span>
            </span>
          </button>
        </section>

        {/* Timeline */}
        <section className="mt-6">
          <p className="eoc-label text-[var(--dl-text-muted)]">PAST INCIDENTS</p>
          <ol className="relative mt-3 space-y-3 border-l border-white/10 pl-5">
            {SOS_HISTORY.map((entry) => (
              <li key={entry.id} className="relative">
                {/* Timeline dot */}
                <span
                  aria-hidden="true"
                  className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full border-2 border-[var(--dl-navy)] bg-severity-green-500"
                />
                <div className="rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 p-4 backdrop-blur">
                  {/* Date + incident type */}
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--dl-text-muted)]">
                      <CalendarDays
                        aria-hidden="true"
                        className="h-3.5 w-3.5 text-[var(--dl-orange-light)]"
                      />
                      {formatSosDate(entry.date)}
                    </p>
                    <span className="shrink-0 rounded-full border border-[var(--dl-orange)]/40 bg-[var(--dl-orange)]/10 px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-[#FDBA74]">
                      {entry.incidentType}
                    </span>
                  </div>

                  {/* Resolution status */}
                  <p className="mt-2.5 flex items-center gap-1.5 text-sm font-bold text-white">
                    <CheckCircle2
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-severity-green-400"
                    />
                    {entry.status}
                  </p>
                  <p className="mt-1 text-xs text-[var(--dl-text-muted)]">
                    {entry.location}
                  </p>
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--dl-text-on-navy)]/85">
                    {entry.summary}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <p className="mt-6 text-center text-[0.6875rem] text-[var(--dl-text-muted)]">
          Keep this log for insurance and relief documentation.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}

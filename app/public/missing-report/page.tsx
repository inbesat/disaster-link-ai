import PublicBackButton from "@/components/public/PublicBackButton";
import MissingPersonReportForm from "@/components/public/report/MissingPersonReportForm";
import { UserRound } from "lucide-react";

// ---------------------------------------------------------------------
// app/public/missing-report/page.tsx — "Missing Person / Casualty"
// citizen reporter. Submissions land in the government verification
// queue (/gov/missing-persons) with status PENDING_REVIEW via
// POST /api/reports/missing.
// ---------------------------------------------------------------------

export default function MissingReportPage() {
  return (
    <div className="relative w-full min-h-screen flex flex-col bg-[var(--dl-navy)] text-[var(--dl-text-on-navy)]">
      {/* Ambient backdrop matching the dashboard */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_80%_-10%,rgba(37,99,235,0.22),transparent),radial-gradient(ellipse_45%_40%_at_0%_110%,rgba(249,115,22,0.14),transparent)]"
      />

      <main className="relative flex-1">
        <PublicBackButton className="sm:left-4 sm:top-3 top-3 left-3 bg-black/20" />

        {/* Hero header */}
        <header className="mx-auto max-w-2xl px-4 pt-8 md:px-6 md:pt-12">
          <div className="eoc-panel rounded-[var(--dl-radius-lg)] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 ring-1 ring-red-500/40">
                <UserRound className="h-7 w-7 text-red-300" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Missing Person &amp; Casualty Reporting
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                  Your report goes straight to the Emergency Command Center. Officials verify every submission before an active search is broadcast.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Form */}
        <section className="mx-auto max-w-2xl px-4 pb-16 pt-6 md:px-6">
          <MissingPersonReportForm />
        </section>
      </main>
    </div>
  );
}

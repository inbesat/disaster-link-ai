import Link from "next/link";
import { cookies } from "next/headers";
import { Activity, ArrowRight, Map, Radio, ShieldCheck, Users } from "lucide-react";
import ViewAsPublicToggle from "@/components/gov/ViewAsPublicToggle";

// ---------------------------------------------------------------------
// app/gov/dashboard/page.tsx — Phase 1 placeholder Gov Command Dashboard.
// The gov login (role=district_admin cookie) lands here. The full command
// center experience lives on the legacy /command-center route; this shell
// gives officials a real landing point and mounts the View-as-Public
// toggle (Step 10) so they can preview the citizen app with one switch.
// ---------------------------------------------------------------------

const READOUTS = [
  { label: "ACTIVE INCIDENTS", value: "12", tone: "text-red-300" },
  { label: "DISTRICTS COVERED", value: "38/38", tone: "text-emerald-300" },
  { label: "FIELD RESPONDERS", value: "214", tone: "text-[var(--dl-blue-light)]" },
  { label: "REPORTS / 10 MIN", value: "47", tone: "text-orange-300" },
];

export default function GovDashboardPage() {
  // Reflect a still-active preview session if the official navigates back
  // here mid-preview (middleware allows gov users with view_as_public on
  // /gov/*), so the toggle never lies about the current state.
  const previewing = cookies().get("view_as_public")?.value === "true";

  return (
    <main className="relative flex min-h-screen flex-col bg-[var(--dl-navy)] text-[var(--dl-text-on-navy)]">
      {/* Ambient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_75%_-10%,rgba(37,99,235,0.26),transparent),radial-gradient(ellipse_45%_40%_at_0%_110%,rgba(37,99,235,0.12),transparent)]"
      />

      <div className="relative z-10 flex flex-1 flex-col">
        {/* Header */}
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 md:px-6">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 animate-pulse-ring rounded-full bg-severity-red-500" />
            <span className="text-sm font-bold tracking-tight text-white">
              Gov Command Center
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="eoc-label hidden text-[var(--dl-text-muted)] sm:block">
              ROLE · DISTRICT_ADMIN
            </span>
            <Link
              href="/"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition hover:border-[var(--dl-blue)]/60 hover:text-white"
            >
              Home
            </Link>
          </div>
        </header>

        {/* Hero + readouts */}
        <section className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8">
          <p className="eoc-label text-[var(--dl-blue-light)]">
            BIHAR · OPERATIONAL OVERVIEW · LIVE
          </p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-white md:text-4xl">
            District Command Overview
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--dl-text-on-navy)] md:text-lg">
            Triage incoming reports, dispatch responders and keep your district ahead of
            the disaster.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {READOUTS.map((readout) => (
              <div
                key={readout.label}
                className="rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <p className={`font-mono text-2xl font-bold ${readout.tone}`}>
                  {readout.value}
                </p>
                <p className="eoc-label mt-1 text-[var(--dl-text-muted)]">
                  {readout.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* View as Public toggle */}
        <section className="mx-auto w-full max-w-5xl px-4 md:px-6">
          <ViewAsPublicToggle initialActive={previewing} />
          <p className="mt-2 text-xs text-[var(--dl-text-muted)]">
            Enter the citizen app exactly as your residents see it — alerts, shelters and
            SOS. A red PREVIEW MODE banner stays on top while you&apos;re inside, with one
            click back to this screen.
          </p>
        </section>

        {/* Placeholder command modules */}
        <section className="mx-auto w-full max-w-5xl flex-1 px-4 pb-12 pt-8 md:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Radio,
                title: "Incident Triage",
                description: "Live SOS reports ranked by severity and district.",
              },
              {
                icon: Map,
                title: "Evacuation Planner",
                description: "Route citizens away from flood zones in real time.",
              },
              {
                icon: Users,
                title: "Responder Dispatch",
                description: "Assign field teams to open incidents.",
              },
              {
                icon: Activity,
                title: "Situation Reports",
                description: "AI-drafted briefings for the control room.",
              },
            ].map((module) => (
              <div
                key={module.title}
                className="flex items-start gap-4 rounded-[var(--dl-radius)] border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-white/20"
              >
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--dl-blue)]/20 text-[var(--dl-blue-light)]"
                >
                  <module.icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-white">
                    {module.title}
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 text-[var(--dl-text-muted)]"
                    />
                  </h2>
                  <p className="mt-1 text-sm text-[var(--dl-text-muted)]">
                    {module.description}
                  </p>
                  <p className="eoc-label mt-2 text-[var(--dl-text-muted)]">
                    PHASE 2 · COMING SOON
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-5">
        <p className="flex items-center justify-center gap-2 text-center text-xs text-[var(--dl-text-muted)]">
          <ShieldCheck
            aria-hidden="true"
            className="h-3.5 w-3.5 text-[var(--dl-blue-light)]"
          />
          Authorized personnel only · All access is logged &amp; audited
        </p>
      </footer>
    </main>
  );
}

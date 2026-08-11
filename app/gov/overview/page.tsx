import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Boxes,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  DISTRICT_SUMMARIES,
  formatCount,
  riskLevelFor,
  sortDistrictsByRisk,
} from "@/lib/mock-data/gov-districts";

// ---------------------------------------------------------------------
// app/gov/overview/page.tsx — Phase 7 · Step 10 · Multi-District
// Overview (Super Admin).
//
// State-HQ comparison board. The district grid is sorted automatically
// by severity (highest risk first — sortDistrictsByRisk is pure and
// tested), and every card summarizes its Active Risk Level, Evacuees and
// Resources Deployed. A "Drill Down" button on each card jumps to that
// district's own Command Center (/gov/dashboard?district=<name>), which
// the SituationHeader picks up to preselect the district.
//
// Access is enforced twice: middleware.ts (on the wire) and
// app/gov/overview/layout.tsx (server-side whitelist) — both only admit
// super_admin.
// ---------------------------------------------------------------------

const RISK_META = {
  critical: { label: "CRITICAL", chip: "border-severity-red-400/40 bg-severity-red-400/10 text-severity-red-300", bar: "bg-severity-red-400" },
  high: { label: "HIGH", chip: "border-severity-amber-400/40 bg-severity-amber-400/10 text-severity-amber-300", bar: "bg-severity-amber-400" },
  moderate: { label: "MODERATE", chip: "border-severity-purple-400/40 bg-severity-purple-400/10 text-severity-purple-300", bar: "bg-severity-purple-400" },
  low: { label: "LOW", chip: "border-severity-green-400/40 bg-severity-green-400/10 text-severity-green-300", bar: "bg-severity-green-400" },
} as const;

/** Sorted once — highest severity surfaces first. */
const SORTED = sortDistrictsByRisk(DISTRICT_SUMMARIES);

export default function GovOverviewPage() {
  const totalEvacuees = SORTED.reduce((acc, d) => acc + d.evacuees, 0);
  const totalDeployed = SORTED.reduce((acc, d) => acc + d.resourcesDeployed, 0);
  const worst = SORTED[0];

  return (
    <main className="min-h-screen bg-primary text-foreground">
      <div className="mx-auto w-full max-w-[1720px]">
        {/* Page title strip */}
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-6 sm:px-6">
          <div>
            <p className="eoc-label text-[var(--dl-blue-light)]">
              BIHAR · STATE HQ · SUPER ADMIN
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Multi-District Overview
            </h1>
          </div>

          {/* State-level totals */}
          <div className="flex flex-wrap gap-3">
            <div className="rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/[0.04] px-4 py-2.5">
              <p className="eoc-label text-[var(--dl-text-muted)]">TOTAL EVACUEES</p>
              <p className="mt-0.5 font-mono text-lg font-bold text-severity-amber-300">
                {formatCount(totalEvacuees)}
              </p>
            </div>
            <div className="rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/[0.04] px-4 py-2.5">
              <p className="eoc-label text-[var(--dl-text-muted)]">RESOURCES DEPLOYED</p>
              <p className="mt-0.5 font-mono text-lg font-bold text-severity-green-300">
                {formatCount(totalDeployed)}
              </p>
            </div>
          </div>
        </div>

        {/* Auto-sorted severity callout */}
        <p className="px-4 pt-4 text-xs text-[var(--dl-text-muted)] sm:px-6">
          Sorted by risk —{" "}
          <span className="font-semibold text-severity-red-300">{worst.name}</span> is the
          highest-severity district right now.
        </p>

        {/* District grid — sorted, highest risk first */}
        <div className="grid grid-cols-1 gap-4 p-4 sm:px-6 md:grid-cols-2 xl:grid-cols-3">
          {SORTED.map((district) => {
            const risk = riskLevelFor(district.riskScore);
            const meta = RISK_META[risk];
            return (
              <article
                key={district.id}
                className="flex flex-col rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                {/* Header — name + risk chip */}
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-white">
                      {district.name}
                    </h2>
                    <p className="eoc-label mt-0.5 text-[var(--dl-text-muted)]">
                      DISTRICT {district.activeEvents} ACTIVE EVENTS
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide ${meta.chip}`}
                  >
                    <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
                    {meta.label}
                  </span>
                </header>

                {/* Risk meter */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-[var(--dl-text-muted)]">
                    <span className="eoc-label">ACTIVE RISK LEVEL</span>
                    <span className="font-mono font-bold text-white/80">{district.riskScore}/100</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/40">
                    <div
                      className={`h-full rounded-full ${meta.bar}`}
                      style={{ width: `${district.riskScore}%` }}
                    />
                  </div>
                </div>

                {/* Summary stats */}
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[var(--dl-radius-sm)] border border-white/10 bg-black/20 p-3">
                    <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--dl-text-muted)]">
                      <Users aria-hidden="true" className="h-3 w-3" /> Evacuees
                    </dt>
                    <dd className="mt-1 font-mono text-xl font-bold tabular-nums text-white">
                      {formatCount(district.evacuees)}
                    </dd>
                  </div>
                  <div className="rounded-[var(--dl-radius-sm)] border border-white/10 bg-black/20 p-3">
                    <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--dl-text-muted)]">
                      <Boxes aria-hidden="true" className="h-3 w-3" /> Resources Deployed
                    </dt>
                    <dd className="mt-1 font-mono text-xl font-bold tabular-nums text-white">
                      {district.resourcesDeployed}
                    </dd>
                  </div>
                </dl>

                {/* Drill Down — jump to that district's Command Center */}
                <Link
                  href={`/gov/dashboard?district=${encodeURIComponent(district.name)}`}
                  className="group mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--dl-blue-light)]/40 bg-[var(--dl-blue)]/20 px-4 py-2.5 text-sm font-bold text-[var(--dl-blue-light)] transition hover:bg-[var(--dl-blue)]/35"
                >
                  <Activity aria-hidden="true" className="h-4 w-4" />
                  Drill Down
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}

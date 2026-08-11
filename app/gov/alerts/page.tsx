import { RadioTower, ShieldCheck, Siren } from "lucide-react";
import AlertAnalytics from "@/components/gov/alerts/AlertAnalytics";
import AlertComposer from "@/components/gov/alerts/AlertComposer";
import AlertHistory from "@/components/gov/alerts/AlertHistory";
import RumorControl from "@/components/gov/alerts/RumorControl";
import SocialMediaPublisher from "@/components/gov/alerts/SocialMediaPublisher";
import SirenControl from "@/components/gov/alerts/SirenControl";

// ---------------------------------------------------------------------
// app/gov/alerts/page.tsx — Phase 11 · Step 1 · Omni-Channel Alert
// Composer route.
//
// The Command Center's alerting workspace: a dark, data-dense page built
// around the AlertComposer form — which itself hosts the Step 2
// geospatial Target Area selector (mini MapLibre map with Entire District
// / Select Villages / Draw Custom Polygon targeting modes).
//
// This is a server component — the client-only AlertTargetMap inside
// AlertComposer is `next/dynamic` with `ssr: false` (maplibre touches
// `window`), matching every other map canvas in the codebase.
// ---------------------------------------------------------------------

export default function GovAlertsPage() {
  return (
    <main className="bg-primary text-foreground">
      <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6">
        {/* Page header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eoc-label text-accent-purple">
              BIHAR · ALERT MANAGEMENT · LIVE
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Omni-Channel Alert Composer
            </h1>
            <p className="mt-1 text-sm text-muted">
              Compose a district alert and route it over every channel
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-severity-amber-500/40 bg-severity-amber-500/10 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-severity-amber-300">
              <Siren className="h-3.5 w-3.5" aria-hidden />2 pending
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-slate-300">
              <RadioTower className="h-3.5 w-3.5" aria-hidden />4 channels live
            </span>
          </div>
        </div>

        {/* Phase 11 · Steps 1–2 — the composer (details + target map + message). */}
        <div className="mt-5">
          <AlertComposer />
        </div>

        {/* Phase 11 · Step 6 — Fake News & Rumor Control System. */}
        <div className="mt-5">
          <RumorControl />
        </div>

        {/* Phase 11 · Steps 7–8 — Social cross-post + hardware sirens. */}
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <SocialMediaPublisher />
          <SirenControl />
        </div>

        {/* Phase 11 · Step 9 — Delivery analytics. */}
        <div className="mt-5">
          <AlertAnalytics />
        </div>

        {/* Phase 11 · Step 10 — History & audit log (PDF export). */}
        <div className="mt-5">
          <AlertHistory />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 border-t border-white/10 py-5">
        <p className="flex items-center justify-center gap-2 px-4 text-center text-xs text-muted">
          <ShieldCheck aria-hidden className="h-3.5 w-3.5 text-accent-purple" />
          Every dispatch is logged &amp; audited · Critical alerts bypass quiet hours
        </p>
      </footer>
    </main>
  );
}

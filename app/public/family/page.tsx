import PublicBackButton from "@/components/public/PublicBackButton";
import FamilyStrip from "@/components/public/FamilyStrip";
import Link from "next/link";
import { Users, UserPlus, ShieldCheck, AlertTriangle, Circle, UserRoundSearch } from "lucide-react";

export default function PublicFamilyPage() {
  return (
    <div className="relative w-full min-h-screen flex flex-col bg-[var(--dl-navy)] text-[var(--dl-text-on-navy)]">
      {/* Ambient backdrop matching dashboard */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_80%_-10%,rgba(37,99,235,0.22),transparent),radial-gradient(ellipse_45%_40%_at_0%_110%,rgba(249,115,22,0.14),transparent)]"
      />

      <main className="relative flex-1">
        <PublicBackButton className="sm:left-4 sm:top-3 top-3 left-3 bg-black/20" />

        {/* Hero header */}
        <header className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
          <div className="eoc-panel rounded-[var(--dl-radius-lg)] border border-white/10 bg-white/[0.04] p-6 md:p-8 backdrop-blur">
            <div className="flex items-start gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--dl-emerald)]/20 ring-1 ring-[var(--dl-emerald)]/40">
                <Users className="h-8 w-8 text-[var(--dl-emerald-light)]" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                  Family Safety Circle
                </h1>
                <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
                  Keep tabs on every member&apos;s status — one tap to nudge for an update or broadcast &quot;I&apos;m Safe&quot; to the whole circle.
                </p>
              </div>
            </div>
          </div>

          {/* CTA to setup wizard */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/public/setup/family"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--dl-radius-lg)] border-2 border-[var(--dl-emerald)] bg-[var(--dl-emerald)]/10 px-6 py-4 text-base font-semibold text-[var(--dl-emerald)] transition hover:bg-[var(--dl-emerald)]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-emerald)]"
            >
              <UserPlus className="h-5 w-5" aria-hidden />
              Manage Family Circle
            </Link>
            <Link
              href="/public/missing-report"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--dl-radius-lg)] border-2 border-red-500 bg-red-500/10 px-6 py-4 text-base font-semibold text-red-300 transition hover:bg-red-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            >
              <UserRoundSearch className="h-5 w-5" aria-hidden />
              Report Missing Person
            </Link>
          </div>
        </header>

        {/* Content sections */}
        <div className="mx-auto max-w-4xl px-4 pb-16 md:px-6">
          {/* Family strip (live status + nudge modals) */}
          <FamilyStrip />

          {/* Status legend cards */}
          <section className="mt-8 space-y-4" aria-label="Status legend">
            <h2 className="eoc-label text-[var(--dl-text-muted)]">STATUS MEANINGS</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {/* Safe */}
              <article className="eoc-panel rounded-[var(--dl-radius)] border border-severity-green-500/30 bg-severity-green-500/10 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-severity-green-500/20">
                    <ShieldCheck className="h-5 w-5 text-severity-green-500" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">Safe</h3>
                    <p className="text-sm text-slate-300">Member confirmed OK — last check-in recent.</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="flex h-3 w-3 shrink-0 rounded-full bg-severity-green-500 animate-pulse" aria-hidden />
                  <span className="text-xs font-medium text-severity-green-500">Pulsing dot = just checked in</span>
                </div>
              </article>

              {/* Unknown */}
              <article className="eoc-panel rounded-[var(--dl-radius)] border border-severity-amber-500/30 bg-severity-amber-500/10 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-severity-amber-500/20">
                    <Circle className="h-5 w-5 text-severity-amber-500" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">Unknown</h3>
                    <p className="text-sm text-slate-300">No recent check-in — status unclear.</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="flex h-3 w-3 shrink-0 rounded-full bg-severity-amber-500" aria-hidden />
                  <span className="text-xs font-medium text-severity-amber-500">Solid dot = needs update</span>
                </div>
              </article>

              {/* In Danger */}
              <article className="eoc-panel rounded-[var(--dl-radius)] border border-severity-red-500/30 bg-severity-red-500/10 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-severity-red-500/20">
                    <AlertTriangle className="h-5 w-5 text-severity-red-500" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">In Danger</h3>
                    <p className="text-sm text-slate-300">Member flagged distress — SOS may be active.</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="flex h-3 w-3 shrink-0 rounded-full bg-severity-red-500 animate-pulse" aria-hidden />
                  <span className="text-xs font-medium text-severity-red-500">Pulsing red = emergency</span>
                </div>
              </article>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { getSharedCitizen } from "@/lib/mock-data/family-share";
import { familyInitials } from "@/lib/mock-data/family-contacts";
import { formatSavedAt } from "@/lib/mock-data/hazard-zones";
import FamilyShareRefresh from "./FamilyShareRefresh";

// ---------------------------------------------------------------------
// app/family/[shareId]/page.tsx — Phase 13 · Step 9 · Family Read-Only
// Dashboard (public link).
//
// Out-of-state relatives can check on a loved one WITHOUT logging in:
// one glance shows the citizen's name, current status ("🟢 MARKED SAFE"),
// the last-update timestamp and a generic district map snippet. There is
// deliberately NO app chrome — no bottom nav, no settings, no login — and
// the page is a Server Component with a single Refresh Status island, so
// it even renders with JavaScript disabled. The middleware matcher does
// not cover /family/*, so share links stay fully public by design.
//
// The mock fetch (lib/mock-data/family-share) derives a stable citizen
// from the shareId — swap getSharedCitizen for a real store later without
// touching this page.
// ---------------------------------------------------------------------

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { shareId: string } }): Metadata {
  const citizen = getSharedCitizen(params.shareId);
  return {
    title: citizen ? `${citizen.name} · Safety Status` : "Family Safety Check",
    description: "Live safety status shared with family.",
  };
}

/** Static stylised district map — pure CSS, zero map library, tiny. */
function DistrictMapSnippet({ district }: { district: string }) {
  return (
    <div
      role="img"
      aria-label={`Generic map of ${district} district`}
      className="relative h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1b2e]"
    >
      {/* Neighbourhood blocks */}
      <div aria-hidden="true" className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-1.5 p-2.5 opacity-50">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-sm ${
              i % 4 === 0 ? "bg-emerald-400/25" : i % 4 === 1 ? "bg-blue-400/20" : "bg-white/10"
            }`}
          />
        ))}
      </div>
      {/* River + roads */}
      <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-2.5 -rotate-3 bg-blue-400/40" />
      <div aria-hidden="true" className="absolute inset-y-0 left-1/3 w-1 bg-white/15" />
      <div aria-hidden="true" className="absolute inset-y-0 left-2/3 w-1 bg-white/15" />

      {/* Location pin */}
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-severity-red-500 text-lg shadow-[0_4px_12px_rgba(0,0,0,0.5)] ring-4 ring-white/20">
          📍
        </div>
      </div>

      <p className="absolute bottom-2 left-3 rounded-md bg-black/40 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-widest text-white/80">
        {district} district
      </p>
    </div>
  );
}

export default function FamilySharePage({ params }: { params: { shareId: string } }) {
  const citizen = getSharedCitizen(params.shareId);

  // Unknown / too-short token — friendly invalid state, no fake person.
  if (!citizen) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--dl-navy)] px-6 text-center text-[var(--dl-text-on-navy)]">
        <p className="text-5xl" aria-hidden="true">
          🔗
        </p>
        <h1 className="mt-4 text-xl font-bold text-white">This link isn&apos;t valid</h1>
        <p className="mt-2 max-w-xs text-[0.9375rem] leading-relaxed text-[var(--dl-text-on-navy)]/80">
          The share link may be mistyped or expired. Ask your family member
          to re-share their safety link.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/40"
        >
          Go to SafeSphere
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[var(--dl-navy)] text-[var(--dl-text-on-navy)]">
      {/* Ambient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_80%_-10%,rgba(37,99,235,0.18),transparent),radial-gradient(ellipse_45%_40%_at_0%_110%,rgba(249,115,22,0.12),transparent)]"
      />

      <div className="relative mx-auto w-full max-w-md px-5 pb-10 pt-12">
        {/* Header */}
        <header className="text-center">
          <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--dl-text-muted)]">
            Family Safety Check
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            {citizen.name}
          </h1>
        </header>

        {/* Status hero */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <span
            aria-hidden="true"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl ring-1 ring-white/15"
          >
            {familyInitials(citizen.name)}
          </span>
          <p className="mt-4 text-2xl font-black tracking-tight text-white">
            {citizen.statusLabel}
          </p>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[0.9375rem] text-[var(--dl-text-on-navy)]/80">
            <MapPin aria-hidden="true" className="h-4 w-4 text-[var(--dl-orange-light)]" />
            {citizen.district} district
          </p>
          <p className="mt-3 text-[0.8125rem] text-[var(--dl-text-muted)]">
            Last updated{" "}
            <time dateTime={citizen.updatedAt.toISOString()}>
              {formatSavedAt(citizen.updatedAt.toISOString())}
            </time>
          </p>
        </section>

        {/* Generic district map snippet */}
        <section className="mt-6">
          <DistrictMapSnippet district={citizen.district} />
        </section>

        {/* Refresh Status — the one interactive affordance */}
        <section className="mt-6">
          <FamilyShareRefresh shareId={params.shareId} initial={citizen} />
        </section>

        {/* Reassurance + emergency fallback */}
        <footer className="mt-10 text-center">
          <p className="text-[0.8125rem] leading-relaxed text-[var(--dl-text-muted)]">
            This page is read-only. It updates when {citizen.name.split(" ")[0]} marks
            their safety status in the SafeSphere app.
          </p>
          <a
            href="tel:1070"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[0.875rem] font-semibold text-white transition hover:border-[var(--dl-orange)]/60"
          >
            <Phone aria-hidden="true" className="h-4 w-4 text-[var(--dl-orange-light)]" />
            Emergency? Call 1070
          </a>
        </footer>
      </div>
    </main>
  );
}

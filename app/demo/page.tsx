"use client";

// ---------------------------------------------------------------------
// app/demo/page.tsx — Phase 2 · Step 1 · The "Two Doors" demo landing.
//
// A frictionless choice screen for the judges: two large, distinct cards
// — Government Official (Command Center) and Citizen (Public Safety App).
// Picking a door needs no typing:
//
//   • Government → opens the AdminLoginModal (Phase 2 · Step 2), whose
//     One-Tap Login mocks the auth session and lands on /gov/dashboard.
//   • Citizen → enableGuestMode writes the public guest session and lands
//     on /public/dashboard.
//
// Both cards are massive touch targets with hover-lift motion. The full
// screen split-screen presentation (Phase 15) lives at /demo/present.
// ---------------------------------------------------------------------

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Home, Monitor, ShieldCheck } from "lucide-react";
import AdminLoginModal from "@/components/demo/AdminLoginModal";
import PublicLoginModal from "@/components/demo/PublicLoginModal";

export default function DemoLandingPage() {
  const [govModalOpen, setGovModalOpen] = useState(false);
  const [citizenModalOpen, setCitizenModalOpen] = useState(false);

  const cardBase =
    "group relative flex min-h-[16rem] flex-col justify-between overflow-hidden rounded-[var(--dl-radius)] border p-8 text-left transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

  return (
    <main className="landing-page relative flex min-h-dvh flex-col overflow-hidden bg-[var(--dl-navy)] text-white">
      {/* Ambient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_85%_-10%,rgba(37,99,235,0.25),transparent),radial-gradient(ellipse_45%_40%_at_0%_110%,rgba(16,185,129,0.10),transparent)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-10">
        <Link
          href="/"
          className="mb-8 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--dl-text-muted)] transition hover:text-white"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Back to home
        </Link>

        <p className="eoc-label text-[var(--dl-blue-light)]">
          BHARAT SHAKTI · NATIONAL HACKATHON — LIVE DEMO
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
          Choose your demo door
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--dl-text-on-navy)]">
          Two experiences, one live backend. Pick a door and you are in —
          no forms, no typing, straight to the action.
        </p>

        {/* The two doors */}
        <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* LEFT — Government Official */}
          <button
            type="button"
            onClick={() => setGovModalOpen(true)}
            aria-label="Demo as government official"
            className={`${cardBase} border-[var(--dl-blue)]/40 bg-gradient-to-br from-[var(--dl-blue)]/25 via-[#0d1526] to-[var(--dl-navy-2)]/60 hover:border-[var(--dl-blue-light)]/70 hover:shadow-[0_24px_60px_rgba(37,99,235,0.25)]`}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--dl-blue)]/20 blur-3xl"
            />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--dl-blue)]/50 bg-[var(--dl-blue)]/20 text-[var(--dl-blue-light)] shadow-[0_0_24px_rgba(37,99,235,0.35)]">
              <ShieldCheck aria-hidden="true" className="h-9 w-9" strokeWidth={2} />
            </span>
            <span className="relative">
              <span className="block text-xl font-black tracking-tight text-white md:text-2xl">
                DEMO AS GOVERNMENT OFFICIAL
              </span>
              <span className="mt-1.5 block text-sm text-[var(--dl-text-muted)]">
                Experience the Command Center
              </span>
              <span className="mt-5 flex flex-wrap gap-2">
                {["District EOC", "Live incident map", "Resource dispatch"].map(
                  (chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[0.6875rem] font-semibold text-[var(--dl-text-on-navy)]"
                    >
                      {chip}
                    </span>
                  ),
                )}
              </span>
            </span>
          </button>

          {/* RIGHT — Citizen */}
          <button
            type="button"
            onClick={() => setCitizenModalOpen(true)}
            aria-label="Demo as citizen"
            className={`${cardBase} border-emerald-400/40 bg-gradient-to-br from-emerald-500/25 via-[#0d1526] to-[var(--dl-navy-2)]/60 hover:border-emerald-300/70 hover:shadow-[0_24px_60px_rgba(16,185,129,0.22)]`}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl"
            />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/50 bg-emerald-500/20 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.35)]">
              <Home aria-hidden="true" className="h-9 w-9" strokeWidth={2} />
            </span>
            <span className="relative">
              <span className="block text-xl font-black tracking-tight text-white md:text-2xl">
                DEMO AS CITIZEN
              </span>
              <span className="mt-1.5 block text-sm text-[var(--dl-text-muted)]">
                Experience the Public Safety App
              </span>
              <span className="mt-5 flex flex-wrap gap-2">
                {["Safe routes", "SOS + family", "Mitron AI"].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[0.6875rem] font-semibold text-[var(--dl-text-on-navy)]"
                  >
                    {chip}
                  </span>
                ))}
              </span>
            </span>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-[var(--dl-text-muted)]">
          Want both at once?{" "}
          <Link
            href="/demo/present"
            className="inline-flex items-center gap-1 font-semibold text-[var(--dl-blue-light)] transition hover:text-white"
          >
            <Monitor aria-hidden="true" className="h-3.5 w-3.5" />
            Open the side-by-side live presentation
          </Link>
        </p>
      </div>

      <AdminLoginModal open={govModalOpen} onClose={() => setGovModalOpen(false)} />
      <PublicLoginModal open={citizenModalOpen} onClose={() => setCitizenModalOpen(false)} />
    </main>
  );
}
import Link from "next/link";
import { ArrowLeft, Bot, Sparkles } from "lucide-react";
import BottomNav from "@/components/public/BottomNav";

// ---------------------------------------------------------------------
// app/public/ai/page.tsx — Phase 2 · Step 9 · AI Safety Assistant
// placeholder.
//
// The AITeaser pills on /public/dashboard deep-link here with ?q=<prompt>.
// This is the placeholder route the roadmap calls for: it shows the
// picked-up prompt so the deep link visibly works end-to-end, and the
// full chat experience lands here later (the teaser needs zero changes —
// it already passes the prompt through as a query param).
// ---------------------------------------------------------------------

export default function PublicAiPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const prompt = typeof searchParams.q === "string" ? searchParams.q : null;

  return (
    <main className="relative flex min-h-screen flex-col bg-[var(--dl-navy)] text-[var(--dl-text-on-navy)]">
      {/* Ambient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_80%_-10%,rgba(37,99,235,0.22),transparent),radial-gradient(ellipse_45%_40%_at_0%_110%,rgba(249,115,22,0.14),transparent)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-5">
        {/* Header */}
        <header className="flex items-center gap-3">
          <Link
            href="/public/dashboard"
            aria-label="Back to dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition hover:border-[var(--dl-orange)]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F97316]/20 ring-1 ring-[#F97316]/40">
              <Bot aria-hidden="true" className="h-4 w-4 text-[#FDBA74]" />
            </span>
            <div>
              <h1 className="text-sm font-bold text-white">AI Safety Assistant</h1>
              <p className="eoc-label text-[var(--dl-text-muted)]">
                POWERED BY DRIP AI
              </p>
            </div>
          </div>
        </header>

        {/* Placeholder body */}
        <section className="mt-10 flex flex-1 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F97316]/20 ring-1 ring-[#F97316]/40">
            <Sparkles aria-hidden="true" className="h-6 w-6 text-[#FDBA74]" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-white">
            The AI Safety Assistant is coming soon
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--dl-text-muted)]">
            Ask about evacuation routes, shelter capacity, and what to pack
            for your area — answered in your language.
          </p>

          {prompt ? (
            <p className="mt-6 w-full rounded-[var(--dl-radius-sm)] border border-[#F97316]/40 bg-[#F97316]/10 px-4 py-3 text-sm font-semibold text-[#FDBA74]">
              Your prompt: &ldquo;{prompt}&rdquo;
            </p>
          ) : (
            <Link
              href="/public/dashboard"
              className="mt-6 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[var(--dl-orange)]/60 hover:bg-[var(--dl-orange)]/10"
            >
              Back to dashboard
            </Link>
          )}
        </section>
      </div>

      <BottomNav />
    </main>
  );
}

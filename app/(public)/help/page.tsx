import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, LifeBuoy, Mail, Phone } from "lucide-react";
import HelpBrowser from "@/components/help/HelpBrowser";
import HelpImage from "@/components/help/HelpImage";
import {
  HELP_CATEGORIES,
  topicsByCategory,
} from "@/lib/help-content";

// ---------------------------------------------------------------------
// app/(public)/help/page.tsx — Help Center index.
//
// Server component: renders the hero, then hands a fully static
// browse-by-category grid to <HelpBrowser> as children. While the user
// isn't searching, that server-rendered grid shows through; typing or
// picking a category chip swaps it for live client-side results.
//
// Theme matches the (public) group: --dl-navy background, glassmorphism
// cards, orange/blue accents.
// ---------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Searchable guides for every SafeSphere feature — SOS, alerts, maps, AI planning and account access — with real screenshots.",
};

export default function HelpIndexPage() {
  return (
    <main
      id="main-content"
      className="relative flex min-h-screen flex-col bg-[var(--dl-navy)] pb-24 text-[var(--dl-text-on-navy)]"
    >
      {/* Ambient glow matching the landing/auth pages */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(37,99,235,0.18),transparent),radial-gradient(ellipse_40%_30%_at_90%_110%,rgba(16,185,129,0.07),transparent)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <header className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--dl-blue)]/20 ring-1 ring-[var(--dl-blue)]/40">
            <LifeBuoy aria-hidden="true" className="h-8 w-8 text-[var(--dl-blue-light)]" />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How can we help?
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Searchable guides for every feature — with real screenshots of the app.
            Pick a topic below or start typing to find your answer.
          </p>
        </header>

        {/* ── Search + chips (client) wrapping the default grid ─────── */}
        <div className="mt-10">
          <HelpBrowser>
            <nav aria-label="Browse help by category" className="mt-12 space-y-12">
              {HELP_CATEGORIES.map(({ key, label, blurb }) => {
                const topics = topicsByCategory(key);
                if (topics.length === 0) return null;
                return (
                  <section key={key} aria-labelledby={`cat-${key}`}>
                    <div className="mb-4 flex items-baseline gap-3">
                      <h2
                        id={`cat-${key}`}
                        className="eoc-label text-[var(--dl-orange-light)]"
                      >
                        {label}
                      </h2>
                      <p className="hidden text-xs text-slate-500 sm:block">{blurb}</p>
                    </div>

                    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {topics.map((topic) => (
                        <li key={topic.id}>
                          <Link
                            href={`/help/${topic.id}`}
                            className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dl-blue)]"
                          >
                            <HelpImage
                              src={topic.image}
                              alt={`${topic.title} — screenshot`}
                              topicTitle={topic.title}
                              className="rounded-b-none border-0 border-b border-white/10"
                            />
                            <span className="flex flex-1 flex-col p-4">
                              <span className="flex items-start justify-between gap-2">
                                <span className="text-sm font-bold leading-snug text-white">
                                  {topic.title}
                                </span>
                                <ChevronRight
                                  aria-hidden="true"
                                  className="mt-0.5 h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-300"
                                />
                              </span>
                              <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-slate-400">
                                {topic.summary}
                              </span>
                              <span className="mt-auto pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                {topic.steps.length} step{topic.steps.length === 1 ? "" : "s"}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </nav>
          </HelpBrowser>
        </div>

        {/* ── Still stuck? contact strip ────────────────────────────── */}
        <section
          aria-labelledby="still-stuck"
          className="mt-16 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur sm:p-8"
        >
          <h2 id="still-stuck" className="text-lg font-bold text-white">
            Still stuck?
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Our team reads every message — most replies land within a day.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:safesphere095@gmail.com"
              className="inline-flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 transition hover:border-white/25 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dl-blue)]"
            >
              <Mail aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--dl-blue-light)]" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">Email support</span>
                <span className="block truncate text-xs text-slate-400">
                  safesphere095@gmail.com
                </span>
              </span>
            </a>
            <a
              href="tel:+919625130964"
              className="inline-flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 transition hover:border-white/25 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dl-blue)]"
            >
              <Phone aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-400" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">Emergency helpline</span>
                <span className="block truncate text-xs text-slate-400">
                  +91-9625130964 · 1070
                </span>
              </span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  HELP_CATEGORIES,
  HELP_TOPICS,
  searchHelpTopics,
  type HelpCategory,
} from "@/lib/help-content";

// ---------------------------------------------------------------------
// components/help/HelpBrowser.tsx — self-contained search + filter UI.
//
// One client component owning ALL interactive state for the help index:
//   • Search input (matches titles/keywords/summaries/step text)
//   • Category chips
//   • Results grid shown while searching/filtering
//
// The default "browse everything" grid is server-rendered and passed in
// as `children` — while idle we simply render it through. Typing or
// picking a chip swaps it for live results. This keeps the rich default
// view on the server (fast, SEO-friendly) without duplicating markup.
// ---------------------------------------------------------------------

const CATEGORY_ICONS: Record<HelpCategory, LucideIcon> = {
  emergencies: AlertTriangle,
  citizen: UserRound,
  gov: Building2,
  account: ShieldCheck,
};

type Props = {
  /** Server-rendered default grid, shown when no search/filter is active. */
  children: ReactNode;
};

export function HelpBrowser({ children }: Props) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<HelpCategory | "all">("all");

  const trimmed = query.trim();
  const searching = trimmed.length > 0 || activeCat !== "all";

  const results = useMemo(() => {
    const base = trimmed ? searchHelpTopics(trimmed) : HELP_TOPICS;
    return activeCat === "all"
      ? base
      : base.filter((t) => t.category === activeCat);
  }, [trimmed, activeCat]);

  return (
    <div>
      {/* ── Search input ─────────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-2xl">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help — e.g. “send SOS”, “map”, “approval”…"
          aria-label="Search help articles"
          className="w-full rounded-full border border-white/15 bg-white/[0.06] py-3.5 pl-12 pr-12 text-base text-white shadow-[0_0_24px_rgba(37,99,235,0.15)] backdrop-blur transition placeholder:text-slate-500 focus:border-[var(--dl-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--dl-blue)]/40"
        />
        {trimmed && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dl-blue)]"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Category chips ───────────────────────────────────────────── */}
      <div
        role="group"
        aria-label="Filter by category"
        className="mt-5 flex flex-wrap items-center justify-center gap-2"
      >
        <Chip
          active={activeCat === "all"}
          onClick={() => setActiveCat("all")}
          label="All topics"
        />
        {HELP_CATEGORIES.map(({ key, label }) => {
          const Icon = CATEGORY_ICONS[key];
          return (
            <Chip
              key={key}
              active={activeCat === key}
              onClick={() => setActiveCat(activeCat === key ? "all" : key)}
              label={label}
              icon={<Icon aria-hidden="true" className="h-3.5 w-3.5" />}
            />
          );
        })}
      </div>

      {/* ── Results vs default browse grid ───────────────────────────── */}
      {searching ? (
        <div className="mt-8" aria-live="polite">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
            {results.length} article{results.length === 1 ? "" : "s"} found
          </p>

          {results.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
              <Search aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">
                No articles matched “{trimmed}”
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                Try a shorter phrase like “SOS”, “map” or “approval” — or email us at{" "}
                <a
                  href="mailto:safesphere095@gmail.com"
                  className="font-semibold text-[var(--dl-blue-light)] hover:underline"
                >
                  safesphere095@gmail.com
                </a>
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {results.map((topic) => {
                const Icon = CATEGORY_ICONS[topic.category];
                const cat = HELP_CATEGORIES.find((c) => c.key === topic.category);
                return (
                  <li key={topic.id}>
                    <Link
                      href={`/help/${topic.id}`}
                      className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dl-blue)]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                        <Icon aria-hidden="true" className="h-4 w-4 text-slate-300" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">
                          {topic.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-400">
                          {topic.summary}
                        </span>
                        <span className="mt-1.5 inline-block rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {cat?.label}
                        </span>
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-300"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dl-blue)] ${
        active
          ? "border-[var(--dl-blue)] bg-[var(--dl-blue)]/20 text-white"
          : "border-white/15 bg-white/[0.04] text-slate-400 hover:border-white/25 hover:text-slate-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default HelpBrowser;

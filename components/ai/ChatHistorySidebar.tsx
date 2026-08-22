"use client";

// ---------------------------------------------------------------------
// components/ai/ChatHistorySidebar.tsx — UI/UX Phase 6 · Step 9.
//
// Retrieval panel for past disaster plans. Rendered by the page inside a
// collapsible column (desktop) or slide-over (mobile); this component only
// owns the inner content:
//   • "New session" action + free-text search filter
//   • session rows (title, date, tiny status badge: Executed / Draft)
// ---------------------------------------------------------------------

import { useState } from "react";
import {
  History,
  MapPin,
  Plus,
  Route,
  Search,
  Ship,
  Stethoscope,
  Warehouse,
  X,
} from "lucide-react";

type SessionStatus = "Executed" | "Draft";

type Session = {
  id: string;
  title: string;
  date: string;
  status: SessionStatus;
  icon: typeof Search;
};

const SESSIONS: Session[] = [
  {
    id: "s1",
    title: "Evacuation Plan — Patna",
    date: "Aug 8 · 14:12",
    status: "Executed",
    icon: Route,
  },
  {
    id: "s2",
    title: "Medical Triage — Sonepur",
    date: "Aug 7 · 11:40",
    status: "Executed",
    icon: Stethoscope,
  },
  {
    id: "s3",
    title: "Boat Dispatch — Punpun",
    date: "Aug 6 · 09:15",
    status: "Draft",
    icon: Ship,
  },
  {
    id: "s4",
    title: "Shelter Capacity Check",
    date: "Aug 5 · 20:05",
    status: "Draft",
    icon: Warehouse,
  },
  {
    id: "s5",
    title: "Reroute — NH-01 Closure",
    date: "Aug 4 · 18:33",
    status: "Executed",
    icon: MapPin,
  },
];

const STATUS_STYLES: Record<SessionStatus, string> = {
  Executed: "border-accent-success/30 bg-accent-success/10 text-accent-success",
  Draft: "border-accent-warning/30 bg-accent-warning/10 text-accent-warning",
};

type ChatHistorySidebarProps = {
  /** Fires when the panel should collapse (X button / overlay backdrop). */
  onClose?: () => void;
};

export function ChatHistorySidebar({ onClose }: ChatHistorySidebarProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const filtered = SESSIONS.filter((s) =>
    `${s.title} ${s.date} ${s.status}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex h-full w-full flex-col bg-[#0d1225]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-3">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <History className="h-3.5 w-3.5 text-accent-purple" aria-hidden />
          Chat History
        </p>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat history"
            className="rounded-md p-1 text-muted transition hover:bg-tertiary hover:text-slate-200"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* New session */}
      <button
        type="button"
        onClick={() => {
          setActive(null);
          setQuery("");
        }}
        className="mx-3 mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-accent-purple/40 bg-accent-purple/10 py-2 text-xs font-semibold text-accent-purple transition hover:bg-accent-purple/20"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        New Session
      </button>

      {/* Search */}
      <div className="px-3 pt-3">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search past conversations…"
            aria-label="Search past conversations"
            className="w-full rounded-lg border border-border bg-[var(--bg-tertiary)] py-2 pl-8 pr-3 text-xs text-slate-100 outline-none transition placeholder:text-muted focus:border-accent-purple/60"
          />
        </label>
      </div>

      {/* Session list */}
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {filtered.length === 0 ? (
          <p className="px-1 pt-6 text-center text-[11px] text-muted">
            No sessions match “{query}”.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {filtered.map((session) => {
              const Icon = session.icon;
              const isActive = active === session.id;
              return (
                <li key={session.id}>
                  <button
                    type="button"
                    onClick={() => setActive(isActive ? null : session.id)}
                    aria-pressed={isActive}
                    className={`flex w-full items-start gap-2.5 rounded-lg border px-2.5 py-2 transition ${
                      isActive
                        ? "border-accent-purple/50 bg-accent-purple/10"
                        : "border-border bg-secondary hover:border-accent-purple/40"
                    }`}
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-purple/15 text-accent-purple">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-xs font-semibold text-slate-100">
                        {session.title}
                      </span>
                      <span className="mt-0.5 block font-mono text-eoc-tiny text-muted">
                        {session.date}
                      </span>
                      <span
                        className={`mt-1.5 inline-block rounded-full border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider ${STATUS_STYLES[session.status]}`}
                      >
                        {session.status}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ChatHistorySidebar;

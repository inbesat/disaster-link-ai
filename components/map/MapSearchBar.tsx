"use client";

// ---------------------------------------------------------------------
// components/map/MapSearchBar.tsx — UI/UX Phase 5 · Step 6.
//
// Floating geocode/search bar pinned top-centre below the map header.
// Glassmorphism surface (translucent + blur), Search + voice (mic)
// affordances, and a dropdown of mock results that appears while typing.
// Each result carries a "fly to" arrow.
// ---------------------------------------------------------------------

import { useRef, useState } from "react";
import { ArrowUpRight, Mic, Search, X } from "lucide-react";

type MockResult = { id: string; label: string; subtitle?: string };

const MOCK_RESULTS: MockResult[] = [
  { id: "1", label: "Kankarbagh, Patna", subtitle: "Sector 4 · flood-affected ward" },
  { id: "2", label: "Danapur Shelter", subtitle: "Open · 340 berths free" },
  { id: "3", label: "Boring Road Junction", subtitle: "Nav zones near the Ganges" },
];

export function MapSearchBar({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const showResults = focused && query.trim().length > 0;
  const filteredResults = MOCK_RESULTS.filter((r) =>
    r.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const flyTo = (place: MockResult) => {
    setQuery(place.label);
    setFocused(false);
    inputRef.current?.blur();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="w-[19rem] max-w-[calc(100vw-2rem)]">
        {/* Glass input */}
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-2 pl-4 pr-2 shadow-lg backdrop-blur-md">
          <Search className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search village, shelter, coordinates…"
            aria-label="Search the map"
            className="w-full min-w-0 bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-100 active:scale-[0.97]"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
          <span className="h-5 w-px bg-white/15" aria-hidden />
          <button
            type="button"
            aria-label="Voice search"
            title="Voice search"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-accent"
          >
            <Mic className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {/* Dropdown while typing */}
        {showResults && (
          <ul
            role="listbox"
            aria-label="Search results"
            className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[rgb(var(--bg-secondary-rgb)/90)] p-1 shadow-xl shadow-black/40 backdrop-blur-md"
          >
            {filteredResults.length === 0 ? (
              <li className="px-3 py-3 text-sm text-muted">No matches for “{query}”.</li>
            ) : (
              filteredResults.map((result) => (
                <li key={result.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => flyTo(result)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white/10"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
                      <Search className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-100">
                        {result.label}
                      </span>
                      {result.subtitle && (
                        <span className="block truncate text-[11px] text-muted">
                          {result.subtitle}
                        </span>
                      )}
                    </span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 text-slate-300 transition hover:border-accent hover:text-accent">
                      <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default MapSearchBar;

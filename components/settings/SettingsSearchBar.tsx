"use client";

// ---------------------------------------------------------------------
// components/settings/SettingsSearchBar.tsx — Settings · Phase 9.
//
// Sticky instant search for the Settings module.
//   • Renders a search input pinned at the top of the settings view.
//   • Cmd/Ctrl+K focuses the input from anywhere in the app, Esc closes.
//   • Live keyword matching against a shared catalog
//     (lib/settings/search-index.ts). Results that belong to the CURRENT
//     page highlight the matching card in-place; results from other
//     sections navigate straight to that settings page.
//   • Dropdown styled with the emergency-ops palette.
// ---------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CornerDownLeft, FilePlus, Search, WifiOff } from "lucide-react";
import {
  searchSettings,
  type SettingsSearchEntry,
} from "@/lib/settings/search-index";

type SettingsSearchBarProps = {
  /** Map anchor key → modal/card highlight hook on the current page. */
  onHighlight?: (key: string) => void;
  /** Live query sync — lets a parent host dim/highlight in-page cards. */
  onQueryChange?: (query: string) => void;
  children?: React.ReactNode;
};

export default function SettingsSearchBar({
  onHighlight,
  onQueryChange,
}: SettingsSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => searchSettings(query), [query]);

  // Cmd/Ctrl+K focuses the search from anywhere in the settings tree.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Stale cross-page results: when navigating away, reset the query.
  useEffect(() => {
    setQuery("");
    setOpen(false);
    onQueryChange?.("");
  }, [pathname, onQueryChange]);

  function handleSelect(entry: SettingsSearchEntry) {
    setOpen(false);
    setQuery("");
    onQueryChange?.("");

    if (onHighlight && entry.cardRoute) {
      // Highlight the card in place on the current page.
      onHighlight(entry.key);
      return;
    }

    if (entry.sectionHref !== pathname) {
      router.push(entry.sectionHref);
    }
  }

  return (
    <div ref={rootRef} className="relative z-30">
      <div className="flex items-center gap-3 rounded-md border border-panel-border bg-[#0a0f1d] px-3 py-2.5 shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="settings-search-results"
          aria-label="Search settings"
          placeholder="Search settings… (e.g. password, language, avatar, badge)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onQueryChange?.(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-slate-500 focus:outline-none"
        />
        <kbd className="hidden shrink-0 rounded-sm border border-panel-borderHover bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline-block">
          ⌘/Ctrl K
        </kbd>
      </div>

      {open && (
        <div
          id="settings-search-results"
          role="listbox"
          aria-label="Settings search results"
          className="absolute inset-x-0 top-full mt-2 max-h-[60vh] overflow-y-auto rounded-eoc border border-panel-border bg-surface-elevated/95 p-1.5 shadow-2xl backdrop-blur-xl"
        >
          {query.trim().length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-4 text-xs text-slate-500">
              <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
              Type a keyword — e.g. &quot;password&quot;, &quot;language&quot;,
              &quot;avatar&quot;, &quot;badge&quot;.
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-4 text-xs text-slate-500">
              No settings match &quot;{query.trim()}&quot;.
            </div>
          ) : (
            results.slice(0, 12).map((entry) => {
              return (
                <button
                  key={entry.key}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => handleSelect(entry)}
                  className="group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-cyan-500/10"
                >
                  <FilePlus className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-cyan-400" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-200">
                      {entry.label}
                    </span>
                    <span className="eoc-label mt-0.5 block truncate text-[10px] uppercase tracking-wider text-slate-500">
                      {entry.sectionHref.replace(/^\/settings\//, "Settings / ")}
                    </span>
                  </span>
                  <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-slate-500 group-hover:text-cyan-400" aria-hidden />
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
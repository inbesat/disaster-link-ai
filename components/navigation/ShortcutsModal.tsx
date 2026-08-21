"use client";

import { useEffect, useState } from "react";
import { X, Keyboard } from "lucide-react";

// ---------------------------------------------------------------------
// components/navigation/ShortcutsModal.tsx — Prompt 9.6
//
// Keyboard shortcuts cheat sheet. Press '?' anywhere to open.
// Shows all available shortcuts with Mac/Windows key symbols.
// ---------------------------------------------------------------------

const SHORTCUTS = [
  { section: "Navigation", items: [
    { keys: ["⌘", "1"], label: "Dashboard" },
    { keys: ["⌘", "2"], label: "Live Map" },
    { keys: ["⌘", "3"], label: "Alerts" },
    { keys: ["⌘", "K"], label: "Search" },
    { keys: ["⌘", "/"], label: "AI Planner" },
    { keys: ["⌘", "."], label: "Toggle Sidebar" },
  ]},
  { section: "General", items: [
    { keys: ["?"], label: "Show shortcuts" },
    { keys: ["Esc"], label: "Close modal / drawer" },
  ]},
];

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      if (e.key === "?") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close shortcuts"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Keyboard className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {SHORTCUTS.map((group) => (
            <div key={group.section}>
              <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-slate-500">
                {group.section}
              </p>
              <div className="mt-2 space-y-1.5">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-white/5"
                  >
                    <span className="text-sm text-white/80">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-md border border-white/10 bg-white/5 px-2 font-mono text-xs font-semibold text-slate-300"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-[0.625rem] text-slate-500">
          Press <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-slate-400">?</kbd> to toggle this panel
        </p>
      </div>
    </div>
  );
}

export default ShortcutsModal;

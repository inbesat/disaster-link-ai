"use client";

// ---------------------------------------------------------------------
// components/ui/ShortcutModal.tsx — Phase 11 · Step 5 (power-user polish).
//
// Global keyboard-shortcuts reference. Pressing "?" (Shift + /) anywhere
// opens a sleek dark modal listing the app's REAL hotkeys as styled <kbd>
// chips — the "this is a pro tool" signal for demo judges.
//
//   • "?" opens  — Shift+/ handled globally, guarded by isEditableTarget
//                  so typing a question mark into an input never opens it
//   • Esc closes — plus backdrop click and the X IconButton
//   • ⌘/ alias   — this component also binds ⌘/ (Cmd/Ctrl + /) → AI
//                  Planner so the listed combo is real (⌘5 is the
//                  sidebar's original AI Planner binding — both work)
//   • Platform   — the modifier glyph is corrected post-mount (⌘ on macOS,
//                  Ctrl elsewhere) so SSR and the first client paint agree
//   • Styling    — roadmap tokens (bg-secondary / border-subtle /
//                  bg-tertiary), framer-motion spring, reduced-motion
//                  respected, same kbd look as the sidebar shortcut hints
//
// Mount once at the app root (app/layout.tsx) — it renders nothing until
// "?" is pressed.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { isEditableTarget } from "@/hooks/useHotkeys";

/** Mac vs everything-else modifier glyph — corrected post-mount. */
const IS_MAC =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

type ShortcutRow = {
  /** Accessible label for the action. */
  label: string;
  /** One or more key combos; each combo is a list of <kbd> chips. */
  keys: string[][];
};

export function ShortcutModal() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Starts "⌘" on BOTH server and first client paint (no hydration
  // mismatch); corrected to "Ctrl" right after mount on non-Mac.
  const [mod, setMod] = useState("⌘");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastPathRef = useRef(pathname);
  // Remember where focus was before opening, so closing returns it.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMod(IS_MAC ? "⌘" : "Ctrl");
  }, []);

  // A route change (e.g. ⌘/ → AI Planner while the panel is open) closes
  // the dialog — it must not float over the next page.
  useEffect(() => {
    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  // "?" opens the panel; ⌘/ is a global alias for the AI Planner (⌘5 stays
  // the sidebar's primary binding); Esc closes.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      // "?" = Shift + / — open the reference panel.
      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      // ⌘/ → AI Planner (strict modifiers so ⌘⇧/ still opens the panel).
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key === "/"
      ) {
        event.preventDefault();
        router.push("/ai-planner");
        return;
      }

      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  // Move focus into the panel while open (Esc + screen-reader context);
  // restore focus to the trigger element when it closes.
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      panelRef.current?.focus();
    } else if (previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus?.();
      previouslyFocusedRef.current = null;
    }
  }, [open]);

  const rows: ShortcutRow[] = [
    { label: "Go to Dashboard", keys: [[mod, "1"]] },
    { label: "Open Alerts", keys: [[mod, "2"]] },
    { label: "Evacuation routes", keys: [[mod, "3"]] },
    { label: "Resource inventory", keys: [[mod, "4"]] },
    {
      label: "Open AI Planner",
      keys: [
        [mod, "5"],
        [mod, "/"],
      ],
    },
    { label: "Team directory", keys: [[mod, "6"]] },
    { label: "Search settings", keys: [[mod, "K"]] },
    { label: "Open this panel", keys: [["?"]] },
    { label: "Close modals / panels", keys: [["Esc"]] },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Keyboard shortcuts"
              tabIndex={-1}
              initial={{ y: 24, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl border border-subtle bg-secondary p-5 shadow-card outline-none"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-tertiary text-accent-primary">
                    <Keyboard className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-primary">
                      Keyboard Shortcuts
                    </h2>
                    <p className="text-xs text-muted">
                      Press ? anywhere to reopen this panel
                    </p>
                  </div>
                </div>

                <IconButton
                  label="Close shortcuts"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" aria-hidden />
                </IconButton>
              </div>

              {/* Shortcut grid — grouped Navigate / Global, kbd chips per key */}
              <div className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                <div>
                  <p className="text-eoc-tiny font-bold uppercase tracking-wider text-muted">
                    Navigate
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {rows.slice(0, 6).map((row) => (
                      <ShortcutRowView key={row.label} row={row} />
                    ))}
                  </div>
                </div>
                <div className="mt-4 sm:mt-0">
                  <p className="text-eoc-tiny font-bold uppercase tracking-wider text-muted">
                    Global
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {rows.slice(6).map((row) => (
                      <ShortcutRowView key={row.label} row={row} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer hint */}
              <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-primary"
                  aria-hidden
                />
                ⌘1–⌘6 jump straight to your main screens — built for power users.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

/** One row: label on the left, <kbd> chips (+ / or separators) on the right. */
function ShortcutRowView({ row }: { row: ShortcutRow }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="min-w-0 truncate text-sm text-primary">{row.label}</span>
      <span className="flex shrink-0 items-center gap-1">
        {row.keys.map((combo, ci) => (
          <span key={ci} className="flex items-center">
            {ci > 0 && (
              <span className="px-1 text-eoc-tiny font-semibold text-muted" aria-hidden>
                or
              </span>
            )}
            {combo.map((key, ki) => (
              <span key={ki} className="flex items-center">
                {ki > 0 && (
                  <span
                    className="px-0.5 text-eoc-tiny font-semibold text-muted"
                    aria-hidden
                  >
                    +
                  </span>
                )}
                <kbd className="inline-flex h-7 min-w-7 items-center justify-center rounded border border-subtle bg-tertiary px-1.5 font-mono text-xs font-semibold text-primary">
                  {key}
                </kbd>
              </span>
            ))}
          </span>
        ))}
      </span>
    </div>
  );
}

export default ShortcutModal;

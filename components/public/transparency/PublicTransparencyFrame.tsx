"use client";

// ---------------------------------------------------------------------
// components/public/transparency/PublicTransparencyFrame.tsx — client
// shell for the public "Live Response Status" panel.
//
// Desktop (lg+): a fixed right rail that slides in/out as a drawer
// (transition-transform, closed by default via translate-x-full). A
// floating toggle button rides the drawer's left edge — it slides to the
// screen edge when the drawer is closed so it stays clickable. The
// content area scrolls independently (overflow-y-auto pb-24) under a
// pinned header.
//
// Mobile (< lg): a floating trigger button above the citizen BottomNav
// opens a slide-up bottom sheet (max-h 80dvh). Both surfaces share the
// same context state (TransparencyPanelContext) so opening one syncs the
// other. The widget content is passed in as `children`
// (server-composed by PublicTransparencyPanel).
// ---------------------------------------------------------------------

import { useEffect, type ReactNode } from "react";
import { Activity, BarChart2, ChevronRight, X } from "lucide-react";
import { useTransparencyPanel } from "./TransparencyPanelContext";

type PublicTransparencyFrameProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export default function PublicTransparencyFrame({
  title = "Live Response Status",
  subtitle = "Read-only view of the district response",
  children,
}: PublicTransparencyFrameProps) {
  const { isOpen, setOpen } = useTransparencyPanel();

  // Lock body scroll while the mobile sheet is up (< lg). The desktop
  // drawer leaves the page scrollable behind it.
  useEffect(() => {
    if (!isOpen) return;
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches)
      return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const header = (
    <div className="min-w-0 flex-1">
      <p className="flex items-center gap-2 text-sm font-bold text-white">
        <Activity aria-hidden className="h-4 w-4 shrink-0 text-[var(--dl-orange)]" />
        {title}
      </p>
      <p className="mt-0.5 text-xs text-[var(--dl-text-muted)]">{subtitle}</p>
    </div>
  );

  return (
    <>
      {/* Desktop: sliding drawer rail (lg+), closed by default. */}
      <aside
        aria-hidden={!isOpen}
        className={`fixed top-0 right-0 z-40 hidden h-screen w-[360px] border-l border-white/10 bg-[#0a0f1a]/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:block ${
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Pinned header */}
          <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 pt-4 pb-3">
            {header}
          </div>
          {/* Scrollable widget stack */}
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">{children}</div>
        </div>
      </aside>

      {/* Desktop toggle — rides the drawer's left edge; slides to the
          screen edge when closed so it stays reachable. */}
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close live response panel" : "Open live response panel"}
        className={`fixed top-1/2 z-50 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-l-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-white/20 lg:flex ${
          isOpen ? "right-[360px]" : "right-0"
        }`}
      >
        {isOpen ? (
          <ChevronRight aria-hidden className="h-5 w-5 text-white" />
        ) : (
          <BarChart2 aria-hidden className="h-5 w-5 text-white" />
        )}
      </button>

      {/* Mobile: floating trigger above the bottom nav (< lg) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="Open live response status"
        className="fixed bottom-[calc(160px+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-[#0f2a4f] px-4 py-3 text-sm font-semibold text-white shadow-xl ring-1 ring-white/10 transition hover:border-[var(--dl-orange)]/60 active:scale-95 lg:hidden"
      >
        <Activity aria-hidden className="h-4 w-4 text-[var(--dl-orange)]" />
        Live Status
      </button>

      {/* Mobile: slide-up bottom sheet (< lg) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Live response status"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0a0f1a] px-4 pt-2 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" aria-hidden />
            <div className="flex items-start justify-between gap-3">
              {header}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close panel"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[var(--dl-text-muted)] transition hover:text-white"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}

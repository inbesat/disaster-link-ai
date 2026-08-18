"use client";

// ---------------------------------------------------------------------
// components/public/transparency/PublicTransparencyFrame.tsx — client
// shell for the public "Live Response Status" panel.
//
// Desktop (lg+): a fixed right rail that is always visible.
// Mobile (< lg): a floating trigger button above the citizen BottomNav
// opens a slide-up bottom sheet (max-h 80dvh) so the panel never blocks
// the whole screen. The widget content is passed in as `children`
// (server-composed by PublicTransparencyPanel).
// ---------------------------------------------------------------------

import { useEffect, useState, type ReactNode } from "react";
import { Activity, X } from "lucide-react";

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
  const [open, setOpen] = useState(false);

  // Lock body scroll while the mobile sheet is up.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

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
      {/* Desktop: fixed right rail (always visible ≥ lg) */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-[360px] overflow-y-auto border-l border-white/10 bg-[#0a0f1a]/95 p-4 backdrop-blur lg:block">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          {header}
        </div>
        <div className="mt-4">{children}</div>
      </aside>

      {/* Mobile: floating trigger above the bottom nav (< lg) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="Open live response status"
        className="fixed bottom-[calc(84px+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-[#0f2a4f] px-4 py-3 text-sm font-semibold text-white shadow-xl ring-1 ring-white/10 transition hover:border-[var(--dl-orange)]/60 active:scale-95 lg:hidden"
      >
        <Activity aria-hidden className="h-4 w-4 text-[var(--dl-orange)]" />
        Live Status
      </button>

      {/* Mobile: slide-up bottom sheet (< lg) */}
      {open && (
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

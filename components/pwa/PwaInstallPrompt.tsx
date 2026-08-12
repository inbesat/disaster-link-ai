"use client";

// ---------------------------------------------------------------------
// components/pwa/PwaInstallPrompt.tsx — Phase 13 · Step 3 · Install
// banner for the Citizen App.
//
// Renders a slim, dismissible banner above the BottomNav whenever the
// browser can install the app (beforeinstallprompt captured), the citizen
// hasn't tapped "Not now" before, and the app isn't already running
// standalone. "Install" opens the browser's native install dialog;
// "Not now" persists the dismissal so it never nags again (recoverable
// from Settings → Install App).
//
// Mounted in app/public/layout.tsx so it appears across the citizen app.
// Renders nothing on the server / before hydration (no mismatch).
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Download, X } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export default function PwaInstallPrompt() {
  const { canInstall, isInstalled, dismissed, promptInstall, dismissInstall } =
    usePwaInstall();
  // Hydration gate: the hook's values settle in a mount effect, so the
  // banner stays hidden until the client agrees on the state.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const show = mounted && canInstall && !isInstalled && !dismissed;

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {show && (
          <motion.div
            key="pwa-install"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-50 mx-auto w-[calc(100%-2rem)] max-w-md"
          >
            <div className="flex items-center gap-3 rounded-xl border border-[var(--dl-orange)]/30 bg-[#0d1526]/95 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.55)] backdrop-blur-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F97316]/15 ring-1 ring-[#F97316]/40">
                <Download aria-hidden="true" className="h-4 w-4 text-[#FDBA74]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">Install SafeSphere</p>
                <p className="truncate text-[11px] text-[var(--dl-text-muted)]">
                  Alerts &amp; shelters keep working even offline.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void promptInstall()}
                className="shrink-0 rounded-lg bg-[#F97316] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_14px_rgba(249,115,22,0.4)] transition hover:brightness-110 active:scale-[0.98]"
              >
                Install
              </button>
              <button
                type="button"
                onClick={dismissInstall}
                aria-label="Not now — hide install prompt"
                className="shrink-0 rounded-md p-1.5 text-[var(--dl-text-muted)] transition hover:bg-white/10 hover:text-white"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

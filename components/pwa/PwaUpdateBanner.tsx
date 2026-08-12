"use client";

// ---------------------------------------------------------------------
// components/pwa/PwaUpdateBanner.tsx — Phase 13 · Step 3 · New-version
// banner.
//
// ServiceWorkerRegister watches for a freshly installed service worker
// (a new deploy) and dispatches `drip:pwa:update-available`. This banner
// tells the user a new version is ready and offers Reload — the workbox
// worker already calls skipWaiting() on install, so a plain reload serves
// the new build. "Later" dismisses the banner for THIS update only
// (keyed by the install time), so the next release can prompt again.
//
// Mounted in the root layout — works on every surface of the app.
// Renders nothing on the server / before hydration.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { PWA_EVENTS, readUpdateDismissed, writeUpdateDismissed } from "@/lib/pwa/pwa-utils";

type UpdateDetail = { installedAt?: number };

export default function PwaUpdateBanner() {
  const [mounted, setMounted] = useState(false);
  const [installKey, setInstallKey] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    const onUpdateAvailable = (event: Event) => {
      const detail = (event as CustomEvent<UpdateDetail>).detail;
      const key = String(detail?.installedAt ?? Date.now());
      // "Later" was tapped for this specific update? Don't nag again.
      if (readUpdateDismissed(key)) return;
      setInstallKey(key);
    };

    window.addEventListener(PWA_EVENTS.UPDATE_AVAILABLE, onUpdateAvailable);
    return () => window.removeEventListener(PWA_EVENTS.UPDATE_AVAILABLE, onUpdateAvailable);
  }, []);

  const reload = () => {
    // Best-effort nudge: if a newer worker is still waiting (environments
    // without workbox's auto-skipWaiting), ask it to take over. The
    // message is a no-op if nothing is listening.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        registration?.waiting?.postMessage("SKIP_WAITING");
      });
    }
    window.location.reload();
  };

  const later = () => {
    if (installKey) writeUpdateDismissed(installKey, true);
    setInstallKey(null);
  };

  const show = mounted && installKey !== null;

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {show && (
          <motion.div
            key="pwa-update"
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 top-0 z-[60]"
          >
            <div className="mx-auto flex w-full max-w-2xl items-center gap-3 rounded-b-xl border border-t-0 border-[var(--dl-blue)]/30 bg-[#0d1526]/95 px-4 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-sm">
              <RefreshCw
                aria-hidden="true"
                className="h-4 w-4 shrink-0 animate-spin text-[var(--dl-blue-light)] [animation-duration:3s]"
              />
              <p className="min-w-0 flex-1 truncate text-xs font-semibold text-white">
                A new version of SafeSphere is ready
              </p>
              <button
                type="button"
                onClick={reload}
                className="shrink-0 rounded-md bg-accent-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white transition hover:brightness-110 active:scale-[0.98]"
              >
                Reload
              </button>
              <button
                type="button"
                onClick={later}
                aria-label="Later — hide update banner"
                className="shrink-0 rounded-md p-1 text-[var(--dl-text-muted)] transition hover:bg-white/10 hover:text-white"
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

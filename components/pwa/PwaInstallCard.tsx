"use client";

// ---------------------------------------------------------------------
// components/pwa/PwaInstallCard.tsx — Phase 13 · Step 3 · Install App
// settings entry.
//
// The citizen-facing "App" row in Settings. Adapts to the device with a
// SINGLE action at a time (never two competing buttons):
//   • already installed (standalone / appinstalled) → green Installed state
//   • installable & not dismissed → Install button (native dialog)
//   • previously dismissed (any state) → "Show option again" to re-arm it
//   • not installable (Safari / no beforeinstallprompt) → "Add to home
//     screen from the browser menu" hint
// Renders nothing before hydration (SSR-safe).
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { Check, Download, MonitorSmartphone, RotateCcw } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useToast } from "@/hooks/useToast";
import { detectPwaSupport } from "@/lib/pwa/pwa-utils";

export default function PwaInstallCard() {
  const { canInstall, isInstalled, dismissed, promptInstall, resetDismissal } =
    usePwaInstall();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const rearm = () => {
    resetDismissal();
    // beforeinstallprompt fires once per page load — the prompt won't
    // reappear mid-session, so set expectations honestly.
    toast.info({
      title: "Install prompt re-armed",
      description: "The install banner will appear again on your next visit.",
    });
  };

  return (
    <section className="rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${
            isInstalled
              ? "bg-severity-green-500/15 text-severity-green-400 ring-severity-green-500/40"
              : "bg-[#F97316]/15 text-[#FDBA74] ring-[#F97316]/40"
          }`}
        >
          {isInstalled ? (
            <Check aria-hidden="true" className="h-4 w-4" />
          ) : (
            <MonitorSmartphone aria-hidden="true" className="h-4 w-4" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            {isInstalled ? "Bharat Shakti is installed" : "Install the app"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--dl-text-muted)]">
            {isInstalled
              ? "It runs like a native app and works offline — alerts, shelters and emergency numbers stay available without data."
              : "Add it to your home screen so alerts and shelters keep working even when the network drops."}
          </p>

          {!isInstalled && canInstall && !dismissed && (
            <button
              type="button"
              onClick={() => void promptInstall()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#F97316] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_14px_rgba(249,115,22,0.4)] transition hover:brightness-110 active:scale-[0.98]"
            >
              <Download aria-hidden="true" className="h-3.5 w-3.5" />
              Install
            </button>
          )}

          {!isInstalled && dismissed && (
            <button
              type="button"
              onClick={rearm}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 transition hover:bg-white/10"
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              Show install option again
            </button>
          )}

          {!isInstalled && !canInstall && !dismissed && (
            <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-[var(--dl-text-muted)]">
              {detectPwaSupport()
                ? "On Safari: tap the Share button and choose \u201cAdd to Home Screen\u201d."
                : "Your browser may not support app installation — use the \u201cAdd to Home Screen\u201d option in its menu if available."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

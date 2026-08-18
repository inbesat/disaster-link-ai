"use client";

// ---------------------------------------------------------------------
// components/public/SafeStatusToggle.tsx — Phase 3 · Step 9 · \"I Am
// Safe\" floating action.
//
// A persistent floating pill on the alerts page that closes the loop
// with the command center and family:
//   • idle     — \"Mark Myself Safe\", green outline
//   • loading  — ~900ms spinner while the mock status broadcast runs
//   • safe     — solid green \"Marked Safe\", persisted to localStorage
//                (drip:i-am-safe) so a reload doesn't reset it
// On completion: a light haptic + the roadmap success toast (\"Your
// status has been shared with registered family members.\").
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { triggerLightHaptic } from "@/hooks/useHaptics";
import {
  readSafeStatus,
  writeSafeStatus,
} from "@/lib/mock-data/public-alerts";

type StatusState = "idle" | "loading" | "safe";

const BROADCAST_MS = 900;

export function SafeStatusToggle() {
  // Hydration-safe: idle on both server + first paint, then the persisted
  // status snaps in post-mount (same pattern as the other citizen state).
  const [status, setStatus] = useState<StatusState>("idle");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (readSafeStatus()) setStatus("safe");
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const markSafe = () => {
    if (status !== "idle") return;
    setStatus("loading");
    triggerLightHaptic();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setStatus("safe");
      writeSafeStatus();
      showToast("success", {
        title: "Marked Safe",
        description:
          "Your status has been shared with registered family members.",
      });
      triggerLightHaptic();
    }, BROADCAST_MS);
  };

  return (
    <button
      type="button"
      onClick={markSafe}
      disabled={status === "loading"}
      aria-label={
        status === "safe" ? "You are marked safe" : "Mark myself as safe"
      }
      className={`fixed bottom-[calc(160px+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-bold shadow-[var(--dl-shadow-soft)] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-green-400 ${
        status === "safe"
          ? "border-severity-green-500 bg-severity-green-500 text-white"
          : "border-severity-green-500/60 bg-severity-green-500/10 text-severity-green-300 hover:bg-severity-green-500/20"
      } ${status === "loading" ? "cursor-wait opacity-80" : ""}`}
    >
      {status === "loading" ? (
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
      ) : status === "safe" ? (
        <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
      ) : (
        <ShieldCheck aria-hidden="true" className="h-4 w-4" />
      )}
      {status === "loading"
        ? "Sharing…"
        : status === "safe"
          ? "Marked Safe"
          : "Mark Myself Safe"}
    </button>
  );
}

export default SafeStatusToggle;

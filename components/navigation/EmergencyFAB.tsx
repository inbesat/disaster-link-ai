"use client";

// ---------------------------------------------------------------------
// components/navigation/EmergencyFAB.tsx
// UI/UX Phase 3 · Step 4 — the Emergency SOS floating action button.
//
// A huge, unmissable panic button for field workers, anchored to the
// bottom nav bar:
//   • 56px circular (h-14 w-14) in --accent-danger with a large white
//     lightning bolt (Zap), centered horizontally and floating ~24px
//     above the nav bar (-top-6).
//   • Continuous subtle pulse: a slow ping halo behind the disc plus the
//     red glow shadow required by the spec
//     (shadow-[0_0_15px_rgba(239,68,68,0.5)]).
//   • Press feedback (active:scale-95) + haptic buzz on supported phones.
//   • Tapping fires a "🚨 SOS Triggered: Location Shared" toast and marks
//     the button as a live emergency target.
// ---------------------------------------------------------------------

import toast from "react-hot-toast";
import { Zap } from "lucide-react";
import { triggerHeavyHaptic } from "@/hooks/useHaptics";

export function EmergencyFAB() {
  const triggerSOS = () => {
    // The location read is mocked — the toast stands in for sharing GPS.
    toast("🚨 SOS Triggered: Location Shared", {
      duration: 5000,
      style: {
        backgroundColor: "#b91c1c",
        color: "#fff",
        fontWeight: 600,
      },
    });

    // Heavy SOS vibration pattern [50, 50, 50] — field hardware feedback.
    triggerHeavyHaptic();
  };

  return (
    <button
      type="button"
      onClick={triggerSOS}
      aria-label="Send emergency SOS with your current location"
      title="Emergency SOS"
      className="absolute -top-6 left-1/2 z-10 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[var(--accent-danger)] shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-transform duration-150 motion-reduce:transition-none hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]"
    >
      {/* Subtle pulse — slow ping halo behind the disc so the button reads "live". */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-[var(--accent-danger)]/50 [animation-duration:2.5s]"
      />
      <Zap
        className="h-7 w-7 text-white"
        strokeWidth={2}
        fill="currentColor"
        aria-hidden
      />
    </button>
  );
}

export default EmergencyFAB;

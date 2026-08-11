"use client";

// ---------------------------------------------------------------------
// hooks/useDemoHotkeys.ts — Phase 15 · Step 3 · Invisible demo hotkeys.
//
// Hidden keyboard triggers so the presenter never fumbles for the mouse
// during the pitch:
//
//   • Shift + 1 → issue a "Critical Flood Warning" (mock server action)
//   • Shift + 2 → mark the demo shelter (Central Community Hall) FULL
//   • Shift + 3 → simulate a field responder arriving on-scene
//   • Shift + 0 → reset the scenario to the hero state (calls the reset
//                 API — same data as `npm run demo:reset`)
//
// Every trigger fires the heavy haptic (so the presenter feels it even
// without looking) and lands a success toast — instant, visible feedback
// that the judge's screen just changed.
//
// Mount ONCE at the app root (app/layout.tsx) via <DemoHotkeysHost />.
// The listener is a single window keydown; form fields are ignored so
// typing Shift+1 in an input never fires a demo action.
// ---------------------------------------------------------------------

import { useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { triggerHeavyHaptic } from "@/hooks/useHaptics";
import { isEditableTarget } from "@/hooks/useHotkeys";

type DemoScenarioAction = "shelter-full" | "responder-arrival" | "reset";

async function runScenario(action: DemoScenarioAction) {
  const res = await fetch("/api/demo/scenario", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  return (await res.json()) as {
    ok: boolean;
    mock?: boolean;
    name?: string;
    status?: string;
    message?: string;
  };
}

export function useDemoHotkeys() {
  const triggerCriticalFlood = useCallback(async () => {
    triggerHeavyHaptic();
    try {
      // Reuses the real alert engine simulator — writes a critical alert
      // log + fans out to SMS/push when configured (falls back silently).
      const res = await fetch("/api/field/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "⚠️ CRITICAL FLOOD WARNING — PATNA",
          message:
            "Ganga water level at danger mark — evacuate floodplain villages in Patna immediately. Zones: Kankarbagh, Rajendra Nagar.",
          sector: "Patna (Ganga) · Floodplain",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; push?: unknown };
      toast.success(
        data.push
          ? "💥 Critical Flood Warning issued — push dispatched"
          : "💥 Critical Flood Warning issued",
      );
    } catch {
      toast.success("💥 Critical Flood Warning issued (simulated)");
    }
  }, []);

  const markShelterFull = useCallback(async () => {
    triggerHeavyHaptic();
    const data = await runScenario("shelter-full");
    toast.success(
      data.mock || !data.ok
        ? "🏠 Shelter marked FULL (simulated)"
        : `🏠 ${data.name ?? "Shelter"} marked FULL`,
    );
  }, []);

  const responderArrival = useCallback(async () => {
    triggerHeavyHaptic();
    const data = await runScenario("responder-arrival");
    toast.success(
      data.mock || !data.ok
        ? "📍 Responder arrival simulated"
        : "📍 Responder arrived on-scene",
    );
  }, []);

  const resetScenario = useCallback(async () => {
    triggerHeavyHaptic();
    const data = await runScenario("reset");
    toast.success(
      data.mock || !data.ok
        ? "♻️ Scenario reset (simulated — DB offline)"
        : "♻️ Hero scenario restored",
    );
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      // Strictly Shift + top-row digit (NO ctrl/meta/alt). event.code is
      // layout-independent — Shift+1 is "!" in event.key on US layouts,
      // but always "Digit1" in event.code, so these fire on any keyboard.
      if (!event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;

      switch (event.code) {
        case "Digit1":
          event.preventDefault();
          void triggerCriticalFlood();
          break;
        case "Digit2":
          event.preventDefault();
          void markShelterFull();
          break;
        case "Digit3":
          event.preventDefault();
          void responderArrival();
          break;
        case "Digit0":
          event.preventDefault();
          void resetScenario();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [triggerCriticalFlood, markShelterFull, responderArrival, resetScenario]);
}

export default useDemoHotkeys;

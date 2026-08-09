"use client";

// ---------------------------------------------------------------------
// hooks/useDemoSimulation.ts
// UI/UX Phase 10 · Step 3 — simulated live data injection.
//
// Demo-day power: while `demo_sim_active` is "true" in localStorage, the
// dashboard keeps itself moving during the 3-minute pitch — every 8s the
// hook randomly either bumps "People at Risk" by 5–20 or drops a fake
// "Resource Deployed" log into the live activity feed. Nothing is real;
// everything is local, so it also works on the hackathon-hall wifi.
//
//   • Gated — the interval is created ONLY while the flag is set. The hook
//     re-checks the flag on mount, on `storage` (other tabs), on a local
//     `drip:demo-sim:changed` event (same-tab toggles via
//     setDemoSimActive()), and on visibilitychange — so toggling mid-
//     session starts/stops the simulation instantly.
//   • Signals — it doesn't own any UI. It dispatches typed window events
//     that consumers subscribe to:
//        drip:demo-sim:people-at-risk  detail { delta }      (5–20)
//        drip:demo-sim:activity        detail { event }      (RESOURCE_MOVE)
//     The activity payload is a RealtimeEvent (same shape useMockRealtime
//     hands LiveActivityFeed), so a consumer can append it straight into
//     its liveEvents list.
//
//   Mount once at the shell level (e.g. <DashboardShell> or the command-
//   center layout) and have consumers listen:
//
//     // HeroKPIs — keep a useState and add the delta:
//     window.addEventListener("drip:demo-sim:people-at-risk", (e) =>
//       setPeopleAtRisk((v) => v + e.detail.delta));
//
//     // LiveActivityFeed — push into liveEvents (must copy state up or
//     // mirror useMockRealtime's setLiveEvents):
//     window.addEventListener("drip:demo-sim:activity", (e) =>
//       setLiveEvents((prev) => [e.detail.event, ...prev].slice(0, 40)));
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import type { RealtimeEvent } from "@/hooks/useMockRealtime";

/** localStorage key — "true" runs the simulation. */
export const DEMO_SIM_KEY = "demo_sim_active";

/** Fired by setDemoSimActive() so the SAME tab reacts without reloading. */
export const DEMO_SIM_CHANGED_EVENT = "drip:demo-sim:changed";

/** Window event consumers listen to for "People at Risk" bumps. */
export const DEMO_PEOPLE_AT_RISK_EVENT = "drip:demo-sim:people-at-risk";

/** Window event consumers listen to for fake resource-deploy feed logs. */
export const DEMO_ACTIVITY_EVENT = "drip:demo-sim:activity";

export type PeopleAtRiskBumpEvent = CustomEvent<{ delta: number }>;
export type DemoActivityEvent = CustomEvent<{ event: RealtimeEvent }>;

/** Read the simulation flag (SSR-safe). */
export function readDemoSimActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DEMO_SIM_KEY) === "true";
  } catch {
    return false;
  }
}

/** Set the simulation flag (never throws) + notify the same tab. */
export function setDemoSimActive(active: boolean): void {
  try {
    window.localStorage.setItem(DEMO_SIM_KEY, active ? "true" : "false");
  } catch {
    // storage blocked — ignore
  }
  window.dispatchEvent(new CustomEvent(DEMO_SIM_CHANGED_EVENT));
}

/** "People at Risk" bump — random integer between 5 and 20. */
function randomPeopleDelta(): number {
  return 5 + Math.floor(Math.random() * 16);
}

/** Fake "Resource Deployed" log pool (RESOURCE_MOVE style, per feed). */
const RESOURCE_DEPLOY_MESSAGES = [
  "6 rescue boats deployed to Rajendra Nagar sector.",
  "320 food packs dispatched to Kankarbagh relief point.",
  "Medical kit convoy departed Patliputra Road.",
  "40 tents allocated to Bypass Road sector.",
  "2 water tankers re-routed to Sampatchak.",
  "Ambulance unit reassigned to Danapur crossing.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Build a fake RESOURCE_MOVE event in the exact RealtimeEvent shape. */
function nextResourceLog(): RealtimeEvent {
  return {
    id: `demo-sim-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "RESOURCE_MOVE",
    message: pick(RESOURCE_DEPLOY_MESSAGES),
    at: new Date().toISOString(),
  };
}

/**
 * Run the demo simulation. Returns `{ active }` so a mounting component can
 * surface a "SIM ACTIVE" chip, e.g. in the command-center header.
 */
export function useDemoSimulation(): { active: boolean } {
  const [active, setActive] = useState(false);

  // Keep the flag in sync from every source that can change it.
  useEffect(() => {
    const sync = () => setActive(readDemoSimActive());
    sync();
    window.addEventListener("storage", sync); // other tabs
    window.addEventListener(DEMO_SIM_CHANGED_EVENT, sync); // same tab
    // Re-sync when the tab becomes visible again (hidden-tab throttling).
    const onVisibility = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(DEMO_SIM_CHANGED_EVENT, sync);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Interval exists ONLY while the flag is set; cleared on toggle-off. The
  // tick also re-checks the flag itself so a stale `active` state (e.g. the
  // storage event lagging a beat behind another tab's toggle) can't fire
  // even one dispatch after the flag flips off.
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      if (!readDemoSimActive()) return;
      if (Math.random() < 0.55) {
        window.dispatchEvent(
          new CustomEvent(DEMO_PEOPLE_AT_RISK_EVENT, {
            detail: { delta: randomPeopleDelta() },
          }),
        );
      } else {
        window.dispatchEvent(
          new CustomEvent(DEMO_ACTIVITY_EVENT, { detail: { event: nextResourceLog() } }),
        );
      }
    }, 8000);
    return () => window.clearInterval(id);
  }, [active]);

  return { active };
}

export default useDemoSimulation;

"use client";

// ---------------------------------------------------------------------
// hooks/useGovPresence.ts — Phase 7 · Step 9 · Real-Time Collaboration
// Shell (mock WebSocket).
//
// Simulates the WebSocket presence channel the Command Center would open
// in production ("who else is viewing this dashboard right now?").
// The simulation logic lives in PURE helpers (PRESENCE_ROSTER,
// advancePresence) so the "connection" behaviour is unit-testable
// without a browser; the hook itself is a thin timer wrapper that feeds
// a mock event stream into React state.
//
//   const { users, status } = useGovPresence();
//
// The real swap-in is a single line: replace the simulated `emit` with a
// real `ws.onmessage` handler over the same PresenceEvent shape.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";

/** One collaborator viewing the dashboard. */
export type PresenceUser = {
  id: string;
  /** Short label for the avatar tooltip, e.g. "DM Patna". */
  name: string;
  /** Role line, e.g. "District Magistrate". */
  role: string;
  /** Avatar gradient hue (0–360). */
  hue: number;
};

export type PresenceStatus = "connecting" | "online" | "offline";

/** Every presence event the simulated channel can emit. */
export type PresenceEvent =
  | { type: "user_joined"; user: PresenceUser }
  | { type: "user_left"; id: string };

/** The fixed "currently viewing" roster (drives the avatar stack). */
export const PRESENCE_ROSTER: PresenceUser[] = [
  { id: "dm-patna", name: "DM Patna", role: "District Magistrate", hue: 217 },
  { id: "sdrf-lead", name: "SDRF Lead", role: "State Disaster Response Force", hue: 152 },
  { id: "dc-ernakulam", name: "DC Ernakulam", role: "District Collector", hue: 281 },
  { id: "ops-desk", name: "Ops Desk", role: "Control Room Operations", hue: 348 },
  { id: "health-officer", name: "Health Officer", role: "Public Health Cell", hue: 38 },
];

/** Demo-only collaborators that join/leave to show a live stream. */
const ROAMING_USERS: PresenceUser[] = [
  { id: "cm-office", name: "CM Office", role: "Secretariat Liaison", hue: 195 },
  { id: "ndrf-commander", name: "NDRF Cmdr", role: "National Disaster Response Force", hue: 16 },
  { id: "fire-chief", name: "Fire Chief", role: "State Fire Services", hue: 30 },
];

/**
 * Apply one simulated presence event to the current roster.
 * Pure — injectable `now` keeps the demo deterministic. Roaming users
 * join at staggered intervals and leave again after a while, so the bar
 * visibly changes over the course of a live pitch.
 */
export function applyPresenceEvent(
  roster: PresenceUser[],
  event: PresenceEvent,
): PresenceUser[] {
  switch (event.type) {
    case "user_joined":
      return roster.some((u) => u.id === event.user.id)
        ? roster
        : [...roster, event.user];
    case "user_left":
      return roster.filter((u) => u.id !== event.id);
  }
}

/**
 * Decide the next simulated event for the elapsed-since-connect time.
 * Pure + time-injectable so tests can drive the whole sequence:
 *   8s  → CM Office joins
 *   16s → NDRF Cmdr joins
 *   24s → CM Office leaves
 *   32s → Fire Chief joins
 *   40s → NDRF Cmdr leaves
 *
 * The cycle index is (elapsed / 8s) - 1 so the FIRST join lands at 8s
 * (cycle 0), not immediately on connect — matches the scripted timeline.
 */
export function nextPresenceEvent(elapsedMs: number): PresenceEvent | null {
  const cycle = Math.floor(elapsedMs / 8000) - 1;
  switch (cycle) {
    case 0:
      return { type: "user_joined", user: ROAMING_USERS[0] };
    case 1:
      return { type: "user_joined", user: ROAMING_USERS[1] };
    case 2:
      return { type: "user_left", id: ROAMING_USERS[0].id };
    case 3:
      return { type: "user_joined", user: ROAMING_USERS[2] };
    case 4:
      return { type: "user_left", id: ROAMING_USERS[1].id };
    default:
      return null;
  }
}

/** Interval at which the mock "WebSocket" emits events. */
const EMIT_MS = 8000;

export type GovPresenceState = {
  users: PresenceUser[];
  status: PresenceStatus;
};

/**
 * Simulate a WebSocket presence connection. Connects on mount (brief
 * "connecting" handshake), then emits a user_joined/user_left event every
 * 8s until unmount. Cleanup clears all timers so the mock never leaks.
 */
export function useGovPresence(): GovPresenceState {
  const [users, setUsers] = useState<PresenceUser[]>(PRESENCE_ROSTER);
  const [status, setStatus] = useState<PresenceStatus>("connecting");
  const connectedAtRef = useRef<number>(0);
  const lastCycleRef = useRef<number>(-1);

  useEffect(() => {
    // Simulated handshake — mark the channel open shortly after mount.
    const handshake = window.setTimeout(() => {
      connectedAtRef.current = Date.now();
      setStatus("online");
    }, 700);

    const emitter = window.setInterval(() => {
      // Pause the fake stream while the tab is hidden (matches the sync
      // header behaviour — no pointless timer churn in background tabs).
      if (document.hidden || status !== "online") return;

      const elapsed = Date.now() - connectedAtRef.current;
      const cycle = Math.floor(elapsed / EMIT_MS);
      if (cycle === lastCycleRef.current) return;
      lastCycleRef.current = cycle;

      const event = nextPresenceEvent(elapsed);
      if (event) setUsers((prev) => applyPresenceEvent(prev, event));
    }, 1000);

    return () => {
      window.clearTimeout(handshake);
      window.clearInterval(emitter);
    };
  }, [status]);

  return { users, status };
}

export default useGovPresence;

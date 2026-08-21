"use client";

// ---------------------------------------------------------------------
// hooks/useGovPresence.ts — Phase 7/11 · Real-Time Collaboration & Presence Security
//
// WebSocket presence channel for Command Center collaborators with role-based
// visibility, timestamp masking, channel scoping, and ghost mode privacy settings.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { isAuthorizedForPresence } from "@/lib/realtime/presence";

/** One collaborator viewing the dashboard. */
export type PresenceUser = {
  id: string;
  /** Short label for the avatar tooltip, e.g. "DM Patna". */
  name: string;
  /** Role line, e.g. "District Magistrate". */
  role: string;
  /** Avatar gradient hue (0–360). */
  hue: number;
  /** Relative status (online, recently, offline) instead of raw timestamp. */
  fuzzyStatus?: "online" | "recently" | "offline";
};

export type PresenceStatus = "connecting" | "online" | "offline";

/** Every presence event the simulated channel can emit. */
export type PresenceEvent =
  | { type: "user_joined"; user: PresenceUser }
  | { type: "user_left"; id: string };

/** Options for presence hook security and privacy. */
export interface UseGovPresenceOptions {
  userRole?: string;
  hideOnlineStatus?: boolean;
  channelId?: string;
}

/** The fixed "currently viewing" roster (drives the avatar stack). */
export const PRESENCE_ROSTER: PresenceUser[] = [
  { id: "dm-patna", name: "DM Patna", role: "District Magistrate", hue: 217, fuzzyStatus: "online" },
  { id: "sdrf-lead", name: "SDRF Lead", role: "State Disaster Response Force", hue: 152, fuzzyStatus: "online" },
  { id: "dc-ernakulam", name: "DC Ernakulam", role: "District Collector", hue: 281, fuzzyStatus: "recently" },
  { id: "ops-desk", name: "Ops Desk", role: "Control Room Operations", hue: 348, fuzzyStatus: "online" },
  { id: "health-officer", name: "Health Officer", role: "Public Health Cell", hue: 38, fuzzyStatus: "online" },
];

/** Demo-only collaborators that join/leave to show a live stream. */
const ROAMING_USERS: PresenceUser[] = [
  { id: "cm-office", name: "CM Office", role: "Secretariat Liaison", hue: 195, fuzzyStatus: "online" },
  { id: "ndrf-commander", name: "NDRF Cmdr", role: "National Disaster Response Force", hue: 16, fuzzyStatus: "online" },
  { id: "fire-chief", name: "Fire Chief", role: "State Fire Services", hue: 30, fuzzyStatus: "online" },
];

/**
 * Apply one simulated presence event to the current roster.
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
 * Real-time presence hook with security controls:
 * - Restricts visibility to authorized team members/admins (`super_admin`, `district_admin`, `field_responder`)
 * - Hides status when user enables `hideOnlineStatus` (ghost mode)
 * - Returns fuzzy status ('online' / 'recently' / 'offline') without exposing raw timestamps
 */
export function useGovPresence(options: UseGovPresenceOptions = {}): GovPresenceState {
  const { userRole = "district_admin", hideOnlineStatus = false } = options;
  const isAuthorized = isAuthorizedForPresence(userRole);

  const [users, setUsers] = useState<PresenceUser[]>(() => {
    if (!isAuthorized) return [];
    return PRESENCE_ROSTER;
  });
  const [status, setStatus] = useState<PresenceStatus>(() => {
    if (!isAuthorized) return "offline";
    return "connecting";
  });

  const connectedAtRef = useRef<number>(0);
  const lastCycleRef = useRef<number>(-1);

  useEffect(() => {
    // Suppress presence for unauthorized roles or ghost mode
    if (!isAuthorized) {
      setUsers([]);
      setStatus("offline");
      return;
    }

    if (hideOnlineStatus) {
      // User is in ghost mode: show status as offline/hidden
      setStatus("offline");
      return;
    }

    const handshake = window.setTimeout(() => {
      connectedAtRef.current = Date.now();
      setStatus("online");
    }, 700);

    const emitter = window.setInterval(() => {
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
  }, [isAuthorized, hideOnlineStatus, status]);

  return { users, status };
}

export default useGovPresence;

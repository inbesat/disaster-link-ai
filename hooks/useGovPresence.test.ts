// ---------------------------------------------------------------------
// hooks/useGovPresence.test.ts
// The WebSocket simulation lives in the pure helpers (PRESENCE_ROSTER,
// applyPresenceEvent, nextPresenceEvent) so they're testable without a
// browser; the hook itself is a thin timer wrapper exercised in the live
// browser checks instead (same split as useShakeToSOS).
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  PRESENCE_ROSTER,
  applyPresenceEvent,
  nextPresenceEvent,
  type PresenceUser,
} from "./useGovPresence";

const CMOFFICE: PresenceUser = {
  id: "cm-office",
  name: "CM Office",
  role: "Secretariat Liaison",
  hue: 195,
  fuzzyStatus: "online",
};

describe("PRESENCE_ROSTER", () => {
  it("starts with the core viewing team", () => {
    expect(PRESENCE_ROSTER.map((u) => u.name)).toEqual([
      "DM Patna",
      "SDRF Lead",
      "DC Ernakulam",
      "Ops Desk",
      "Health Officer",
    ]);
  });
});

describe("applyPresenceEvent", () => {
  it("adds a joining user to the roster", () => {
    const next = applyPresenceEvent(PRESENCE_ROSTER, { type: "user_joined", user: CMOFFICE });
    expect(next).toHaveLength(PRESENCE_ROSTER.length + 1);
    expect(next.map((u) => u.id)).toContain("cm-office");
  });

  it("is a no-op when the joining user is already present", () => {
    const already = [...PRESENCE_ROSTER, CMOFFICE];
    const next = applyPresenceEvent(already, { type: "user_joined", user: CMOFFICE });
    expect(next).toBe(already); // same reference — nothing changed
  });

  it("removes a leaving user", () => {
    const withOffice = [...PRESENCE_ROSTER, CMOFFICE];
    const next = applyPresenceEvent(withOffice, { type: "user_left", id: "cm-office" });
    expect(next.map((u) => u.id)).not.toContain("cm-office");
    expect(next).toHaveLength(PRESENCE_ROSTER.length);
  });

  it("ignores a leave for a user not on the roster", () => {
    const next = applyPresenceEvent(PRESENCE_ROSTER, { type: "user_left", id: "ghost" });
    expect(next).toEqual(PRESENCE_ROSTER);
  });
});

describe("nextPresenceEvent", () => {
  it("returns the first join at 8s", () => {
    expect(nextPresenceEvent(8000)).toEqual({ type: "user_joined", user: CMOFFICE });
  });

  it("returns the second join at 16s", () => {
    const event = nextPresenceEvent(16000);
    expect(event?.type).toBe("user_joined");
    if (event?.type === "user_joined") expect(event.user.id).toBe("ndrf-commander");
  });

  it("returns the first leave at 24s (CM Office departs)", () => {
    expect(nextPresenceEvent(24000)).toEqual({ type: "user_left", id: "cm-office" });
  });

  it("returns the second leave at 40s", () => {
    expect(nextPresenceEvent(40000)).toEqual({ type: "user_left", id: "ndrf-commander" });
  });

  it("goes quiet after the scripted sequence ends", () => {
    expect(nextPresenceEvent(48000)).toBeNull();
    expect(nextPresenceEvent(600000)).toBeNull();
  });
});

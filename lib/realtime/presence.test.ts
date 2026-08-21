// Phase 20/11 — presence tracking & security tests: join/leave, heartbeat refresh, expiry
// pruning, event emission, role-based visibility, timestamp masking, and ghost mode.
import { describe, it, expect } from "vitest";
import {
  PresenceTracker,
  pickFresherPresence,
  getSanitizedLastSeenStatus,
  isAuthorizedForPresence,
  type PresenceEvent,
} from "./presence";

/** Mutable clock so expiry is deterministic without real time passing. */
function makeClock() {
  let t = 1_000_000;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe("PresenceTracker", () => {
  it("adds members on join and emits a join event", () => {
    const tracker = new PresenceTracker({ timeoutMs: 30_000 });
    const events: PresenceEvent[] = [];
    tracker.on((e) => events.push(e));

    tracker.join({ id: "u-1", name: "Asha", role: "Field Responder" });
    expect(tracker.count).toBe(1);
    expect(events[0]).toMatchObject({ type: "join", member: { id: "u-1", name: "Asha" } });
  });

  it("treats a re-join as a heartbeat, not a second join", () => {
    const tracker = new PresenceTracker();
    const events: PresenceEvent[] = [];
    tracker.on((e) => events.push(e));
    tracker.join({ id: "u-1", name: "Asha" });
    tracker.join({ id: "u-1", name: "Asha" });
    expect(tracker.count).toBe(1);
    expect(events.filter((e) => e.type === "join")).toHaveLength(1);
    expect(events.some((e) => e.type === "heartbeat")).toBe(true);
  });

  it("heartbeat refreshes a member's lastSeen", () => {
    const clock = makeClock();
    const tracker = new PresenceTracker({ timeoutMs: 10_000 }, clock.now);
    tracker.join({ id: "u-1", name: "Asha" });

    clock.advance(5_000);
    expect(tracker.heartbeat("u-1")).toBe(true);
    expect(tracker.getMember("u-1")?.lastSeen).toBe(clock.now());

    clock.advance(5_000); // still within 10s of the last heartbeat
    expect(tracker.online()).toHaveLength(1);
  });

  it("returns false when heartbeating an unknown member", () => {
    const tracker = new PresenceTracker();
    expect(tracker.heartbeat("ghost")).toBe(false);
  });

  it("removes members on leave and emits a leave event", () => {
    const tracker = new PresenceTracker();
    const events: PresenceEvent[] = [];
    tracker.on((e) => events.push(e));
    tracker.join({ id: "u-1", name: "Asha" });

    expect(tracker.leave("u-1")).toBe(true);
    expect(tracker.count).toBe(0);
    expect(events.at(-1)).toMatchObject({ type: "leave", memberId: "u-1" });
    expect(tracker.leave("u-1")).toBe(false); // already gone
  });

  it("prunes members who stop heartbeating and emits expire events", () => {
    const clock = makeClock();
    const tracker = new PresenceTracker({ timeoutMs: 30_000 }, clock.now);
    const events: PresenceEvent[] = [];
    tracker.on((e) => events.push(e));

    tracker.join({ id: "u-1", name: "Asha" });
    tracker.join({ id: "u-2", name: "Bhanu" });
    clock.advance(31_000);

    const online = tracker.online();
    expect(online).toHaveLength(0);
    expect(events.filter((e) => e.type === "expire").map((e) => e.memberId).sort()).toEqual(
      ["u-1", "u-2"],
    );
  });
});

describe("Presence Data Security & Privacy (Prompt 11.3)", () => {
  it("restricts presence visibility to authorized team members and admins only", () => {
    expect(isAuthorizedForPresence("super_admin")).toBe(true);
    expect(isAuthorizedForPresence("district_admin")).toBe(true);
    expect(isAuthorizedForPresence("field_responder")).toBe(true);
    expect(isAuthorizedForPresence("public")).toBe(false);
    expect(isAuthorizedForPresence("anonymous")).toBe(false);
    expect(isAuthorizedForPresence(undefined)).toBe(false);

    const tracker = new PresenceTracker();
    tracker.join({ id: "u-1", name: "Asha", role: "field_responder" });

    // Public / anonymous user gets empty presence list
    expect(tracker.getSanitizedOnline("public")).toEqual([]);
    expect(tracker.getSanitizedOnline("anonymous")).toEqual([]);

    // District admin / field responder gets presence list
    expect(tracker.getSanitizedOnline("district_admin")).toHaveLength(1);
  });

  it("masks exact timestamps with fuzzy status (online/recently/offline)", () => {
    const nowMs = 1_000_000;
    expect(getSanitizedLastSeenStatus(nowMs - 30_000, nowMs)).toBe("online");
    expect(getSanitizedLastSeenStatus(nowMs - 120_000, nowMs)).toBe("recently");
    expect(getSanitizedLastSeenStatus(nowMs - 600_000, nowMs)).toBe("offline");

    const clock = makeClock();
    const tracker = new PresenceTracker({ timeoutMs: 300_000 }, clock.now);
    tracker.join({ id: "u-1", name: "Asha" });

    const sanitized = tracker.getSanitizedOnline("district_admin");
    expect(sanitized[0].status).toBe("online");
    expect(sanitized[0]).not.toHaveProperty("lastSeen"); // no raw timestamp exposed
  });

  it("honors ghost mode (hideOnlineStatus = true) to exclude user status", () => {
    const tracker = new PresenceTracker();
    tracker.join({ id: "u-1", name: "Asha", hideOnlineStatus: false });
    tracker.join({ id: "u-2", name: "Ghost User", hideOnlineStatus: true });

    const sanitized = tracker.getSanitizedOnline("district_admin");
    expect(sanitized).toHaveLength(1);
    expect(sanitized[0].id).toBe("u-1");
  });

  it("enforces channel isolation so presence is restricted to joined channel", () => {
    const tracker = new PresenceTracker({ channelId: "patna-channel" });
    tracker.join({ id: "u-1", name: "Asha", channelId: "patna-channel" });
    tracker.join({ id: "u-2", name: "Bhanu", channelId: "gaya-channel" });

    const patnaOnline = tracker.getSanitizedOnline("district_admin", "patna-channel");
    expect(patnaOnline).toHaveLength(1);
    expect(patnaOnline[0].id).toBe("u-1");
  });
});

describe("pickFresherPresence (cross-transport resolution)", () => {
  it("prefers the member with the newer lastSeen", () => {
    const older = { id: "u-1", name: "Asha", lastSeen: 1_000_000 };
    const fresher = { id: "u-1", name: "Asha", lastSeen: 1_000_050 };
    expect(pickFresherPresence(older, fresher)).toBe(fresher);
    expect(pickFresherPresence(fresher, older)).toBe(fresher);
  });

  it("resolves equal timestamps deterministically by id", () => {
    const a = { id: "alpha", name: "A", lastSeen: 100 };
    const b = { id: "bravo", name: "B", lastSeen: 100 };
    expect(pickFresherPresence(a, b)).toBe(b); // "bravo" > "alpha"
  });
});

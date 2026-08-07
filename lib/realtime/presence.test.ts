// Phase 20 — presence tracking tests: join/leave, heartbeat refresh, expiry
// pruning, event emission, and cross-transport freshness resolution.
import { describe, it, expect } from "vitest";
import { PresenceTracker, pickFresherPresence, type PresenceEvent } from "./presence";

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

  it("keeps members whose heartbeat is within the timeout", () => {
    const clock = makeClock();
    const tracker = new PresenceTracker({ timeoutMs: 30_000 }, clock.now);
    tracker.join({ id: "u-1", name: "Asha" });
    tracker.join({ id: "u-2", name: "Bhanu" });

    clock.advance(10_000);
    tracker.heartbeat("u-1"); // u-1 stays fresh
    clock.advance(25_000); // u-2 now >30s old, u-1 still <30s

    const online = tracker.online();
    expect(online.map((m) => m.id)).toEqual(["u-1"]);
    expect(tracker.count).toBe(1);
  });

  it("sorts the online roster by name for stable rendering", () => {
    const tracker = new PresenceTracker();
    tracker.join({ id: "u-2", name: "Bhanu" });
    tracker.join({ id: "u-1", name: "Asha" });
    expect(tracker.online().map((m) => m.id)).toEqual(["u-1", "u-2"]);
  });

  it("supports unsubscribing from presence events", () => {
    const tracker = new PresenceTracker();
    const events: PresenceEvent[] = [];
    const off = tracker.on((e) => events.push(e));
    off();
    tracker.join({ id: "u-1", name: "Asha" });
    expect(events).toHaveLength(0);
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

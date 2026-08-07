// Phase 20 — realtime client tests: WebSocket→polling fallback, message
// propagation, de-duplication, and publish routing (steps 9 & 10).
import { describe, it, expect } from "vitest";
import { RealtimeClient, createRealtimeClient } from "./client";
import type { RealtimeMessage, RealtimeTransport } from "./transports";

function makeMessage(overrides: Partial<RealtimeMessage> = {}): RealtimeMessage {
  return {
    id: "evt-1",
    type: "SHELTER_UPDATE",
    payload: { message: "occupancy increased by 15" },
    at: new Date().toISOString(),
    ...overrides,
  };
}

class FakeTransport implements RealtimeTransport {
  kind: "websocket" | "polling";
  connectResult: boolean;
  messageHandler: ((msg: RealtimeMessage) => void) | null = null;
  published: RealtimeMessage[] = [];

  constructor(connectResult: boolean, kind: "websocket" | "polling" = "websocket") {
    this.connectResult = connectResult;
    this.kind = kind;
  }

  async connect(): Promise<boolean> {
    return this.connectResult;
  }

  onMessage(handler: (msg: RealtimeMessage) => void): void {
    this.messageHandler = handler;
  }

  publish(msg: RealtimeMessage): void {
    this.published.push(msg);
  }

  disconnect(): void {}

  /** Simulate an inbound message arriving from this transport. */
  emit(msg: RealtimeMessage): void {
    this.messageHandler?.(msg);
  }
}

describe("RealtimeClient — transport selection (Phase 20 step 9)", () => {
  it("stays live over the WebSocket transport when it connects", async () => {
    const primary = new FakeTransport(true);
    const client = createRealtimeClient({ primary, fallback: new FakeTransport(false) });

    const statuses: string[] = [];
    client.onStatus((s) => statuses.push(s));
    const received: RealtimeMessage[] = [];
    client.onMessage((m) => received.push(m));

    await client.connect();
    expect(client.status).toBe("live");
    expect(client.transportKind).toBe("websocket");

    primary.emit(makeMessage());
    expect(received).toHaveLength(1);
    expect(received[0].type).toBe("SHELTER_UPDATE");
  });

  it("falls back to polling when the WebSocket transport is blocked", async () => {
    // A blocked Realtime connection — the primary transport fails to connect.
    const primary = new FakeTransport(false, "websocket");
    const fallback = new FakeTransport(true, "polling");
    const client = createRealtimeClient({ primary, fallback });

    const received: RealtimeMessage[] = [];
    client.onMessage((m) => received.push(m));

    await client.connect();
    expect(client.status).toBe("polling");
    expect(client.transportKind).toBe("polling");

    // The polling transport keeps events flowing even though the socket died.
    fallback.emit(makeMessage({ id: "polled-1" }));
    expect(received.map((m) => m.id)).toContain("polled-1");
  });

  it("reports offline when no transport can connect", async () => {
    const client = createRealtimeClient({ primary: new FakeTransport(false) });
    await client.connect();
    expect(client.status).toBe("offline");
  });

  it("still falls back when the primary transport throws instead of resolving", async () => {
    const throwingPrimary = new FakeTransport(true);
    throwingPrimary.connect = async () => {
      throw new Error("socket construction blew up");
    };
    const fallback = new FakeTransport(true, "polling");
    const client = createRealtimeClient({ primary: throwingPrimary, fallback });

    const received: RealtimeMessage[] = [];
    client.onMessage((m) => received.push(m));

    await client.connect();
    expect(client.status).toBe("polling");
    fallback.emit(makeMessage({ id: "still-flowing" }));
    expect(received.map((m) => m.id)).toEqual(["still-flowing"]);
  });

  it("uses polling alone when no WebSocket transport is configured", async () => {
    const fallback = new FakeTransport(true, "polling");
    const client = createRealtimeClient({ fallback });
    await client.connect();
    expect(client.status).toBe("polling");
  });
});

describe("RealtimeClient — data propagation (Phase 20 step 10)", () => {
  it("propagates every inbound message to all subscribers", async () => {
    const primary = new FakeTransport(true);
    const client = createRealtimeClient({ primary });
    const a: RealtimeMessage[] = [];
    const b: RealtimeMessage[] = [];
    const offA = client.onMessage((m) => a.push(m));
    client.onMessage((m) => b.push(m));

    await client.connect();
    primary.emit(makeMessage({ id: "m1" }));
    primary.emit(makeMessage({ id: "m2" }));
    expect(a.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(b.map((m) => m.id)).toEqual(["m1", "m2"]);

    offA();
    primary.emit(makeMessage({ id: "m3" }));
    expect(a).toHaveLength(2); // unsubscribed
    expect(b).toHaveLength(3);
  });

  it("de-duplicates repeat deliveries of the same message id", async () => {
    const primary = new FakeTransport(true);
    const client = createRealtimeClient({ primary });
    const received: RealtimeMessage[] = [];
    client.onMessage((m) => received.push(m));

    await client.connect();
    primary.emit(makeMessage({ id: "dup-1" }));
    primary.emit(makeMessage({ id: "dup-1" })); // re-delivery (poll overlap)
    expect(received).toHaveLength(1);
    expect(client.dedupeSize).toBe(1);
  });

  it("treats distinct ids as separate events even when identical in payload", async () => {
    const primary = new FakeTransport(true);
    const client = createRealtimeClient({ primary });
    const received: RealtimeMessage[] = [];
    client.onMessage((m) => received.push(m));

    await client.connect();
    primary.emit(makeMessage({ id: "a" }));
    primary.emit(makeMessage({ id: "b" }));
    expect(received).toHaveLength(2);
  });
});

describe("RealtimeClient — publish routing", () => {
  it("publishes through the WebSocket transport while live", async () => {
    const primary = new FakeTransport(true);
    const client = createRealtimeClient({ primary });
    await client.connect();
    const msg = makeMessage({ id: "outbound" });
    client.publish(msg);
    expect(primary.published).toEqual([msg]);
  });

  it("safely drops publishes while in polling (receive-only) mode", async () => {
    const fallback = new FakeTransport(true, "polling");
    const client = createRealtimeClient({ fallback });
    await client.connect();
    expect(client.status).toBe("polling");
    expect(() => client.publish(makeMessage({ id: "noop" }))).not.toThrow();
  });
});

describe("RealtimeClient — status notifications", () => {
  it("notifies status listeners across the connecting→live transition", async () => {
    const primary = new FakeTransport(true);
    const client = new RealtimeClient({ primary });
    const statuses: string[] = [];
    client.onStatus((s) => statuses.push(s));

    await client.connect();
    expect(statuses).toEqual(["connecting", "live"]);
  });

  it("notifies listeners on the connecting→polling fallback path", async () => {
    const client = createRealtimeClient({
      primary: new FakeTransport(false, "websocket"),
      fallback: new FakeTransport(true, "polling"),
    });
    const statuses: string[] = [];
    client.onStatus((s) => statuses.push(s));

    await client.connect();
    expect(statuses).toEqual(["connecting", "polling"]);
  });

  it("resets to connecting on disconnect", async () => {
    const primary = new FakeTransport(true);
    const client = createRealtimeClient({ primary });
    await client.connect();
    client.disconnect();
    expect(client.status).toBe("connecting");
  });
});

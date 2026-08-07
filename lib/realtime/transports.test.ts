// Phase 20 — transport tests: WebSocket connect/blocked detection and the
// polling fallback's tick behavior (step 9).
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  WebSocketTransport,
  PollingTransport,
  type RealtimeMessage,
  type WebSocketLike,
} from "./transports";

function makeMessage(overrides: Partial<RealtimeMessage> = {}): RealtimeMessage {
  return {
    id: "evt-1",
    type: "SHELTER_UPDATE",
    payload: { message: "occupancy increased by 15" },
    at: new Date().toISOString(),
    ...overrides,
  };
}

/** A socket that never fires onopen — simulates a blocked Realtime network. */
function neverOpeningSocket(): WebSocketLike {
  return {
    readyState: 0,
    onopen: null,
    onerror: null,
    onclose: null,
    onmessage: null,
    send: () => undefined,
    close: () => undefined,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("WebSocketTransport (Phase 20 step 9)", () => {
  it("connects when the socket opens and delivers parsed messages", async () => {
    const socket = neverOpeningSocket();
    const transport = new WebSocketTransport({
      url: "wss://realtime.example/v1/channel",
      socketFactory: () => socket,
    });

    const received: RealtimeMessage[] = [];
    transport.onMessage((m) => received.push(m));

    const connecting = transport.connect();
    socket.onopen?.();
    await expect(connecting).resolves.toBe(true);

    // Simulate an inbound Realtime frame.
    socket.onmessage?.({ data: JSON.stringify(makeMessage({ id: "frame-1" })) });
    expect(received.map((m) => m.id)).toEqual(["frame-1"]);
  });

  it("treats a socket that never opens as blocked and fails fast", async () => {
    vi.useFakeTimers();
    const transport = new WebSocketTransport({
      url: "wss://realtime.example/v1/channel",
      socketFactory: () => neverOpeningSocket(),
      connectTimeoutMs: 1000,
    });

    const connecting = transport.connect();
    await vi.advanceTimersByTimeAsync(1000);
    await expect(connecting).resolves.toBe(false);
  });

  it("fails when the socket errors before opening (firewall drop)", async () => {
    const socket = neverOpeningSocket();
    const transport = new WebSocketTransport({
      url: "wss://realtime.example/v1/channel",
      socketFactory: () => socket,
    });

    const connecting = transport.connect();
    socket.onerror?.(new Error("net::ERR_CONNECTION_REFUSED"));
    await expect(connecting).resolves.toBe(false);
  });

  it("drops malformed frames without crashing", async () => {
    const socket = neverOpeningSocket();
    const transport = new WebSocketTransport({
      url: "wss://realtime.example/v1/channel",
      socketFactory: () => socket,
    });
    const received: RealtimeMessage[] = [];
    transport.onMessage((m) => received.push(m));

    const connecting = transport.connect();
    socket.onopen?.();
    await connecting;

    socket.onmessage?.({ data: "not-json{{{" });
    socket.onmessage?.({ data: JSON.stringify({ id: "", type: "" }) });
    socket.onmessage?.({ data: JSON.stringify(makeMessage({ id: "ok-1" })) });
    expect(received.map((m) => m.id)).toEqual(["ok-1"]);
  });
});

describe("PollingTransport (fallback)", () => {
  it("polls immediately on connect and then on the interval", async () => {
    vi.useFakeTimers();
    const transport = new PollingTransport({
      poll: () => [makeMessage({ id: "p1" })],
      intervalMs: 1000,
    });
    const received: RealtimeMessage[] = [];
    transport.onMessage((m) => received.push(m));

    await transport.connect();
    expect(received).toHaveLength(1); // immediate first poll

    await vi.advanceTimersByTimeAsync(1000);
    expect(received).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(3000);
    expect(received).toHaveLength(5);
  });

  it("stops polling after disconnect", async () => {
    vi.useFakeTimers();
    const transport = new PollingTransport({
      poll: () => [makeMessage({ id: "p1" })],
      intervalMs: 1000,
    });
    const received: RealtimeMessage[] = [];
    transport.onMessage((m) => received.push(m));

    await transport.connect();
    await vi.advanceTimersByTimeAsync(1000);
    expect(received).toHaveLength(2);

    transport.disconnect();
    await vi.advanceTimersByTimeAsync(5000);
    expect(received).toHaveLength(2);
  });

  it("skips failed poll ticks and keeps polling afterwards", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const transport = new PollingTransport({
      poll: () => {
        calls += 1;
        if (calls === 1) throw new Error("endpoint down");
        return [makeMessage({ id: `tick-${calls}` })];
      },
      intervalMs: 1000,
    });
    const received: RealtimeMessage[] = [];
    transport.onMessage((m) => received.push(m));

    await transport.connect(); // first tick throws — swallowed
    expect(received).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(1000);
    expect(received.map((m) => m.id)).toEqual(["tick-2"]);
  });

  it("filters malformed messages from poll batches", async () => {
    vi.useFakeTimers();
    const transport = new PollingTransport({
      poll: () => [
        makeMessage({ id: "good-1" }),
        { id: "", type: "ROAD_CLOSURE", payload: {}, at: "" },
        null as unknown as RealtimeMessage,
      ],
      intervalMs: 1000,
    });
    const received: RealtimeMessage[] = [];
    transport.onMessage((m) => received.push(m));

    await transport.connect();
    expect(received.map((m) => m.id)).toEqual(["good-1"]);
  });
});

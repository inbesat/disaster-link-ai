import { describe, expect, it, beforeEach } from "vitest";
import { RealtimeClient } from "./client";
import { WebSocketTransport, type RealtimeTransport, type RealtimeMessage } from "./transports";

class MockSocket {
  readyState = 1; // OPEN
  onopen: ((e?: unknown) => void) | null = null;
  onerror: ((e?: unknown) => void) | null = null;
  onclose: ((e?: unknown) => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  sent: string[] = [];

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3; // CLOSED
    this.onclose?.();
  }

  open() {
    this.readyState = 1;
    this.onopen?.();
  }
}

class FakeWebSocketTransport implements RealtimeTransport {
  readonly kind = "websocket" as const;
  messageHandler: ((msg: RealtimeMessage) => void) | null = null;

  async connect(): Promise<boolean> {
    return true;
  }

  onMessage(handler: (msg: RealtimeMessage) => void): void {
    this.messageHandler = handler;
  }

  publish(): void {}
  disconnect(): void {}
}

describe("WebSocket Security Guards", () => {
  beforeEach(() => {
    RealtimeClient.resetUserConnections();
  });

  describe("Concurrent Connection Limits", () => {
    it("allows up to 3 concurrent connections per user ID and rejects the 4th", async () => {
      const userId = "officer-patna-1";

      const clients = [
        new RealtimeClient({ userId, primary: new FakeWebSocketTransport() }),
        new RealtimeClient({ userId, primary: new FakeWebSocketTransport() }),
        new RealtimeClient({ userId, primary: new FakeWebSocketTransport() }),
        new RealtimeClient({ userId, primary: new FakeWebSocketTransport() }),
      ];

      expect(await clients[0].connect()).toBe("live");
      expect(await clients[1].connect()).toBe("live");
      expect(await clients[2].connect()).toBe("live");
      expect(RealtimeClient.getUserConnectionCount(userId)).toBe(3);

      // 4th connection must be rejected
      expect(await clients[3].connect()).toBe("offline");
      expect(RealtimeClient.getUserConnectionCount(userId)).toBe(3);

      // Disconnect one client
      clients[0].disconnect();
      expect(RealtimeClient.getUserConnectionCount(userId)).toBe(2);

      // Now 4th client can connect
      expect(await clients[3].connect()).toBe("live");
      expect(RealtimeClient.getUserConnectionCount(userId)).toBe(3);
    });
  });

  describe("Message Rate Limiting & Validation", () => {
    it("rate limits messages when exceeding max 50 per minute", () => {
      let socketRef: MockSocket | undefined;
      const transport = new WebSocketTransport({
        url: "wss://test.local",
        maxMessagesPerMinute: 5, // small limit for fast test
        socketFactory: () => {
          socketRef = new MockSocket();
          return socketRef;
        },
      });

      void transport.connect();
      socketRef?.open();

      for (let i = 0; i < 5; i++) {
        transport.publish({ id: `msg-${i}`, type: "ALERT", payload: {}, at: new Date().toISOString() });
      }
      expect(socketRef?.sent).toHaveLength(5);

      // 6th message should be dropped by rate limiter
      transport.publish({ id: "msg-6", type: "ALERT", payload: {}, at: new Date().toISOString() });
      expect(socketRef?.sent).toHaveLength(5);
    });

    it("rejects publishing messages with invalid Zod schema", () => {
      let socketRef: MockSocket | undefined;
      const transport = new WebSocketTransport({
        url: "wss://test.local",
        socketFactory: () => {
          socketRef = new MockSocket();
          return socketRef;
        },
      });

      void transport.connect();
      socketRef?.open();

      // Missing required id & type
      // @ts-expect-error testing runtime schema validation on invalid object
      transport.publish({ id: "", type: "" });
      expect(socketRef?.sent).toHaveLength(0);
    });
  });
});

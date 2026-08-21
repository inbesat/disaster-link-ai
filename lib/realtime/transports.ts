// Phase 20/11 — realtime transport layer with message validation and security guards.
// Pluggable transport channels that carry `RealtimeMessage` payloads.

import { z } from "zod";
import { safeLog } from "../logger";

export type TransportKind = "websocket" | "polling";

/** Zod schema for validating incoming real-time messages. */
export const RealtimeMessageSchema = z.object({
  /** Stable unique id used for de-duplication across re-deliveries. */
  id: z.string().min(1),
  /** Event type, e.g. "SHELTER_UPDATE" | "RESOURCE_MOVE" | "CRITICAL_ALERT" | "PING" | "PONG". */
  type: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({}),
  /** ISO 8601 timestamp of when the event was emitted. */
  at: z.string().default(() => new Date().toISOString()),
});

export type RealtimeMessage = z.infer<typeof RealtimeMessageSchema>;

export interface RealtimeTransport {
  readonly kind: TransportKind;
  /**
   * Attempt to establish the connection. Resolves `true` when the transport
   * is usable, `false` when it is blocked/unavailable so the caller can
   * fall back to another transport.
   */
  connect(): Promise<boolean>;
  /** Register the single message handler; called for every inbound message. */
  onMessage(handler: (msg: RealtimeMessage) => void): void;
  /** Bidirectional send (WebSocket only); polling transports are receive-only. */
  publish?(msg: RealtimeMessage): void;
  disconnect(): void;
}

/** Minimal shape of the browser `WebSocket` so tests can inject a fake. */
export interface WebSocketLike {
  readyState: number;
  onopen: ((e?: unknown) => void) | null;
  onerror: ((e?: unknown) => void) | null;
  onclose: ((e?: unknown) => void) | null;
  onmessage: ((e: { data: string }) => void) | null;
  send(data: string): void;
  close(): void;
}

export interface WebSocketTransportOptions {
  url: string;
  protocols?: string | string[];
  /** Factory for the socket — injectable so tests can simulate blocked nets. */
  socketFactory?: () => WebSocketLike;
  /** How long to wait for the socket to open before declaring it blocked. */
  connectTimeoutMs?: number;
  /** Max messages per minute per connection (default: 50). */
  maxMessagesPerMinute?: number;
}

/**
 * WebSocket transport with rate limiting, Zod schema validation, and event logging.
 */
export class WebSocketTransport implements RealtimeTransport {
  readonly kind: TransportKind = "websocket";

  private socket: WebSocketLike | null = null;
  private messageHandler: ((msg: RealtimeMessage) => void) | null = null;
  private readonly url: string;
  private readonly protocols?: string | string[];
  private readonly socketFactory: () => WebSocketLike;
  private readonly connectTimeoutMs: number;
  private readonly maxMessagesPerMinute: number;
  private messageTimestamps: number[] = [];

  constructor(options: WebSocketTransportOptions) {
    this.url = options.url;
    this.protocols = options.protocols;
    this.socketFactory =
      options.socketFactory ??
      (() => new WebSocket(this.url, this.protocols) as unknown as WebSocketLike);
    this.connectTimeoutMs = options.connectTimeoutMs ?? 4000;
    this.maxMessagesPerMinute = options.maxMessagesPerMinute ?? 50;
  }

  onMessage(handler: (msg: RealtimeMessage) => void): void {
    this.messageHandler = handler;
  }

  connect(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const socket = this.socketFactory();

      const fail = () => {
        if (settled) return;
        settled = true;
        clearTimeout(connectTimer);
        this.socket = null;
        safeLog("warn", "WebSocket connection failed or blocked", {
          action: "WEBSOCKET_CONNECT_FAIL",
          metadata: { url: this.url },
        });
        resolve(false);
      };

      const succeed = () => {
        if (settled) return;
        settled = true;
        clearTimeout(connectTimer);
        this.socket = socket;
        socket.onmessage = (e) => this.handleRaw(e.data);
        safeLog("info", "WebSocket connection established", {
          action: "WEBSOCKET_CONNECT_SUCCESS",
          metadata: { url: this.url },
        });
        resolve(true);
      };

      const connectTimer = setTimeout(fail, this.connectTimeoutMs);
      socket.onopen = succeed;
      socket.onerror = fail;
      socket.onclose = fail;
    });
  }

  publish(msg: RealtimeMessage): void {
    if (!this.checkRateLimit()) {
      safeLog("warn", "WebSocket publish rate limit exceeded (max 50/min)", {
        action: "WEBSOCKET_RATE_LIMIT_EXCEEDED",
        metadata: { url: this.url },
      });
      return;
    }

    const validated = RealtimeMessageSchema.safeParse(msg);
    if (!validated.success) {
      safeLog("warn", "Invalid WebSocket message format in publish", {
        action: "WEBSOCKET_INVALID_FORMAT",
        metadata: { errors: validated.error.flatten() as unknown as Record<string, unknown> },
      });
      return;
    }

    if (this.socket && this.socket.readyState === 1) {
      this.socket.send(JSON.stringify(validated.data));
    }
  }

  disconnect(): void {
    if (this.socket) {
      const socket = this.socket;
      this.socket = null;
      socket.onopen = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.onmessage = null;
      socket.close();
      safeLog("info", "WebSocket connection closed", {
        action: "WEBSOCKET_DISCONNECT",
        metadata: { url: this.url },
      });
    }
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    this.messageTimestamps = this.messageTimestamps.filter((t) => now - t < 60_000);
    if (this.messageTimestamps.length >= this.maxMessagesPerMinute) {
      return false;
    }
    this.messageTimestamps.push(now);
    return true;
  }

  private handleRaw(data: string): void {
    if (!this.messageHandler) return;

    if (!this.checkRateLimit()) {
      safeLog("warn", "WebSocket message rate limit exceeded (max 50/min)", {
        action: "WEBSOCKET_RATE_LIMIT_EXCEEDED",
        metadata: { url: this.url },
      });
      return;
    }

    try {
      const json = JSON.parse(data);
      const parsed = RealtimeMessageSchema.safeParse(json);
      if (parsed.success) {
        this.messageHandler(parsed.data);
      } else {
        safeLog("warn", "Invalid WebSocket message format received", {
          action: "WEBSOCKET_INVALID_FORMAT",
          metadata: { errors: parsed.error.flatten() as unknown as Record<string, unknown> },
        });
      }
    } catch {
      safeLog("warn", "Malformed WebSocket JSON frame received", {
        action: "WEBSOCKET_MALFORMED_FRAME",
      });
    }
  }
}

export interface PollingTransportOptions {
  /** Pulls the latest batch of messages; called on every poll tick. */
  poll: () => RealtimeMessage[] | Promise<RealtimeMessage[]>;
  intervalMs?: number;
  /** Run one poll immediately on connect (default true). */
  immediate?: boolean;
}

/**
 * Polling transport — fallback for environments where WebSocket/Realtime connections are blocked.
 */
export class PollingTransport implements RealtimeTransport {
  readonly kind: TransportKind = "polling";

  private readonly pollSource: PollingTransportOptions["poll"];
  private readonly intervalMs: number;
  private readonly immediate: boolean;
  private messageHandler: ((msg: RealtimeMessage) => void) | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private disconnected = false;

  constructor(options: PollingTransportOptions) {
    this.pollSource = options.poll;
    this.intervalMs = options.intervalMs ?? 5000;
    this.immediate = options.immediate ?? true;
  }

  onMessage(handler: (msg: RealtimeMessage) => void): void {
    this.messageHandler = handler;
  }

  async connect(): Promise<boolean> {
    this.disconnected = false;
    if (this.timer) return true;
    if (this.immediate) await this.poll();
    this.timer = setInterval(() => {
      void this.poll();
    }, this.intervalMs);
    return true;
  }

  publish(): void {
    // Polling is receive-only; nothing to send.
  }

  disconnect(): void {
    this.disconnected = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async poll(): Promise<void> {
    if (this.disconnected || !this.messageHandler) return;
    try {
      const messages = await this.pollSource();
      for (const msg of messages) {
        const parsed = RealtimeMessageSchema.safeParse(msg);
        if (parsed.success) {
          this.messageHandler(parsed.data);
        }
      }
    } catch {
      // A failed poll tick is skipped — the next interval retries.
    }
  }
}

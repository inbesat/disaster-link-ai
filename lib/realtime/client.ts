// Phase 20/11 — realtime client with WebSocket security guards:
// - Max 3 concurrent WebSocket connections per user
// - Heartbeat/ping every 30s with auto-disconnect on missing response
// - Auto-disconnect idle connections after 5 minutes
// - Event audit logging (connect, disconnect, subscribe, unsubscribe)
// - Fallback to polling when WebSocket is blocked or disconnected

import { safeLog } from "../logger";
import type {
  RealtimeMessage,
  RealtimeTransport,
  TransportKind,
} from "./transports";

export type RealtimeStatus =
  | "connecting"
  | "live" // WebSocket connected
  | "polling" // WebSocket blocked → polling fallback active
  | "offline"; // no transport available

export interface RealtimeClientOptions {
  /** User identifier associated with this connection (for concurrent connection limits). */
  userId?: string;
  /** Primary transport — typically a WebSocket to Supabase Realtime. */
  primary?: RealtimeTransport;
  /** Fallback transport — typically polling an events endpoint. */
  fallback?: RealtimeTransport;
  /** Ignore repeat deliveries of the same message id within this window. */
  dedupeWindowMs?: number;
  /** Heartbeat check interval in ms (default: 30,000 = 30s). */
  heartbeatIntervalMs?: number;
  /** Idle timeout limit in ms (default: 300,000 = 5 min). */
  idleTimeoutMs?: number;
}

export type RealtimeStatusListener = (status: RealtimeStatus) => void;

/** Global active connections map per user to enforce max 3 connections limit. */
const userActiveConnections = new Map<string, Set<RealtimeClient>>();

export class RealtimeClient {
  public readonly userId: string;
  private readonly primary?: RealtimeTransport;
  private readonly fallback?: RealtimeTransport;
  private readonly dedupeWindowMs: number;
  private readonly heartbeatIntervalMs: number;
  private readonly idleTimeoutMs: number;

  private active: RealtimeTransport | null = null;
  private connected = false;
  private messageListeners = new Set<(msg: RealtimeMessage) => void>();
  private statusListeners = new Set<RealtimeStatusListener>();
  private seenIds = new Map<string, number>();

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastActivityAt: number = Date.now();
  private pendingPing = false;

  status: RealtimeStatus = "connecting";

  constructor(options: RealtimeClientOptions = {}) {
    this.userId =
      options.userId ?? `anon-${Math.random().toString(36).substring(2, 9)}`;
    this.primary = options.primary;
    this.fallback = options.fallback;
    this.dedupeWindowMs = options.dedupeWindowMs ?? 60_000;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 30_000;
    this.idleTimeoutMs = options.idleTimeoutMs ?? 300_000;
  }

  /**
   * Establish connection: enforce max 3 active connections per user before connecting.
   */
  async connect(): Promise<RealtimeStatus> {
    if (this.connected) return this.status;

    // Enforce max 3 concurrent connections per user
    if (!this.trackUserConnection()) {
      safeLog("warn", `Connection limit exceeded for user ${this.userId} (max 3 concurrent connections)`, {
        userId: this.userId,
        action: "WEBSOCKET_CONCURRENT_LIMIT_EXCEEDED",
      });
      this.setStatus("offline");
      return "offline";
    }

    this.setStatus("connecting");
    this.lastActivityAt = Date.now();

    let primaryOk = false;
    if (this.primary) {
      try {
        primaryOk = await this.primary.connect();
      } catch {
        primaryOk = false;
      }
    }

    if (primaryOk) {
      this.attach(this.primary as RealtimeTransport);
      this.active = this.primary as RealtimeTransport;
      this.connected = true;
      this.setStatus("live");
      this.startSecurityTimers();

      safeLog("info", `Realtime client connected for user ${this.userId}`, {
        userId: this.userId,
        action: "REALTIME_CLIENT_CONNECTED",
        metadata: { transport: "websocket" },
      });

      return this.status;
    }

    if (this.fallback) {
      try {
        const fallbackOk = await this.fallback.connect();
        if (fallbackOk) {
          this.attach(this.fallback);
          this.active = this.fallback;
          this.connected = true;
          this.setStatus("polling");
          this.startSecurityTimers();

          safeLog("info", `Realtime client connected (polling fallback) for user ${this.userId}`, {
            userId: this.userId,
            action: "REALTIME_CLIENT_CONNECTED",
            metadata: { transport: "polling" },
          });

          return this.status;
        }
      } catch {
        // fall through to offline
      }
    }

    this.untrackUserConnection();
    this.setStatus("offline");
    return this.status;
  }

  /** Subscribe to inbound messages. Returns an unsubscribe function. */
  onMessage(handler: (msg: RealtimeMessage) => void): () => void {
    this.messageListeners.add(handler);
    safeLog("info", `Message listener subscribed for user ${this.userId}`, {
      userId: this.userId,
      action: "REALTIME_SUBSCRIBE",
      metadata: { totalListeners: this.messageListeners.size },
    });

    return () => {
      this.messageListeners.delete(handler);
      safeLog("info", `Message listener unsubscribed for user ${this.userId}`, {
        userId: this.userId,
        action: "REALTIME_UNSUBSCRIBE",
        metadata: { remainingListeners: this.messageListeners.size },
      });
    };
  }

  /** Subscribe to connection-status changes. Returns an unsubscribe function. */
  onStatus(handler: RealtimeStatusListener): () => void {
    this.statusListeners.add(handler);
    return () => this.statusListeners.delete(handler);
  }

  /** Publish a message through active transport. Updates activity timestamp. */
  publish(msg: RealtimeMessage): void {
    this.lastActivityAt = Date.now();
    if (this.active?.kind === ("websocket" as TransportKind) && this.active.publish) {
      this.active.publish(msg);
    }
  }

  get transportKind(): TransportKind | null {
    return this.active?.kind ?? null;
  }

  disconnect(): void {
    this.stopSecurityTimers();
    this.untrackUserConnection();

    if (this.connected) {
      safeLog("info", `Realtime client disconnected for user ${this.userId}`, {
        userId: this.userId,
        action: "REALTIME_CLIENT_DISCONNECTED",
      });
    }

    this.connected = false;
    this.active?.disconnect();
    this.active = null;
    this.seenIds.clear();
    this.setStatus("connecting");
  }

  /** Handle pong / activity from heartbeat. */
  public handlePong(): void {
    this.pendingPing = false;
    this.lastActivityAt = Date.now();
  }

  /** @internal exposed for tests — number of distinct ids seen recently. */
  get dedupeSize(): number {
    return this.seenIds.size;
  }

  private startSecurityTimers(): void {
    this.stopSecurityTimers();
    this.pendingPing = false;

    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();

      // 1. Check idle timeout (5 minutes)
      if (now - this.lastActivityAt > this.idleTimeoutMs) {
        safeLog("warn", `Disconnecting idle connection for user ${this.userId} (idle > ${this.idleTimeoutMs / 1000}s)`, {
          userId: this.userId,
          action: "WEBSOCKET_IDLE_TIMEOUT",
        });
        this.disconnect();
        return;
      }

      // 2. Check heartbeat ping/pong
      if (this.pendingPing) {
        safeLog("warn", `Heartbeat pong timeout for user ${this.userId} - disconnecting`, {
          userId: this.userId,
          action: "WEBSOCKET_HEARTBEAT_TIMEOUT",
        });
        this.disconnect();
        return;
      }

      // Send ping if using WebSocket transport
      if (this.active?.kind === "websocket" && this.active.publish) {
        this.pendingPing = true;
        this.active.publish({
          id: `ping-${now}`,
          type: "PING",
          payload: { userId: this.userId },
          at: new Date(now).toISOString(),
        });
      }
    }, this.heartbeatIntervalMs);
  }

  private stopSecurityTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private trackUserConnection(): boolean {
    let conns = userActiveConnections.get(this.userId);
    if (!conns) {
      conns = new Set<RealtimeClient>();
      userActiveConnections.set(this.userId, conns);
    }

    if (conns.size >= 3) {
      return false; // Max 3 active connections per user
    }

    conns.add(this);
    return true;
  }

  private untrackUserConnection(): void {
    const conns = userActiveConnections.get(this.userId);
    if (conns) {
      conns.delete(this);
      if (conns.size === 0) {
        userActiveConnections.delete(this.userId);
      }
    }
  }

  private attach(transport: RealtimeTransport): void {
    transport.onMessage((msg) => this.dispatch(msg));
  }

  private dispatch(msg: RealtimeMessage): void {
    this.lastActivityAt = Date.now();

    if (msg.type === "PONG" || msg.type === "PING_ACK") {
      this.handlePong();
      return;
    }

    const now = Date.now();
    const lastSeen = this.seenIds.get(msg.id);
    if (lastSeen !== undefined && now - lastSeen < this.dedupeWindowMs) {
      return; // duplicate re-delivery — drop it.
    }
    this.seenIds.set(msg.id, now);

    if (this.seenIds.size > 500) {
      for (const [id, at] of Array.from(this.seenIds)) {
        if (now - at >= this.dedupeWindowMs) this.seenIds.delete(id);
      }
    }

    for (const handler of Array.from(this.messageListeners)) {
      handler(msg);
    }
  }

  private setStatus(status: RealtimeStatus): void {
    this.status = status;
    for (const handler of Array.from(this.statusListeners)) {
      handler(status);
    }
  }

  /** For unit testing connection counters. */
  static getUserConnectionCount(userId: string): number {
    return userActiveConnections.get(userId)?.size ?? 0;
  }

  /** For unit testing reset. */
  static resetUserConnections(): void {
    userActiveConnections.clear();
  }
}

/** Convenience factory. */
export function createRealtimeClient(options: RealtimeClientOptions = {}): RealtimeClient {
  return new RealtimeClient(options);
}

export type { RealtimeMessage, RealtimeTransport } from "./transports";

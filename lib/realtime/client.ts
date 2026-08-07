// Phase 20 — realtime client. Orchestrates a primary (WebSocket) transport
// and a fallback (polling) transport: if the WebSocket cannot connect — the
// environment blocks Realtime connections — the client silently degrades to
// polling so live data keeps flowing (step 9). It also de-duplicates
// re-delivered messages and surfaces connection status changes to the UI.
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
  /** Primary transport — typically a WebSocket to Supabase Realtime. */
  primary?: RealtimeTransport;
  /** Fallback transport — typically polling an events endpoint. */
  fallback?: RealtimeTransport;
  /** Ignore repeat deliveries of the same message id within this window. */
  dedupeWindowMs?: number;
}

export type RealtimeStatusListener = (status: RealtimeStatus) => void;

export class RealtimeClient {
  private readonly primary?: RealtimeTransport;
  private readonly fallback?: RealtimeTransport;
  private readonly dedupeWindowMs: number;

  private active: RealtimeTransport | null = null;
  private connected = false;
  private messageListeners = new Set<(msg: RealtimeMessage) => void>();
  private statusListeners = new Set<RealtimeStatusListener>();
  private seenIds = new Map<string, number>();

  status: RealtimeStatus = "connecting";

  constructor(options: RealtimeClientOptions = {}) {
    this.primary = options.primary;
    this.fallback = options.fallback;
    this.dedupeWindowMs = options.dedupeWindowMs ?? 60_000;
  }

  /**
   * Establish the connection: try the primary WebSocket, then fall back to
   * polling when it is blocked, then offline when nothing is available.
   */
  async connect(): Promise<RealtimeStatus> {
    if (this.connected) return this.status;
    this.setStatus("connecting");

    // A throwing transport (e.g. an exotic socket-construction failure) must
    // never prevent the fallback from running — treat it as "blocked".
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
          return this.status;
        }
      } catch {
        // fall through to offline
      }
    }

    this.setStatus("offline");
    return this.status;
  }

  /** Subscribe to inbound messages. Returns an unsubscribe function. */
  onMessage(handler: (msg: RealtimeMessage) => void): () => void {
    this.messageListeners.add(handler);
    return () => this.messageListeners.delete(handler);
  }

  /** Subscribe to connection-status changes. Returns an unsubscribe function. */
  onStatus(handler: RealtimeStatusListener): () => void {
    this.statusListeners.add(handler);
    return () => this.statusListeners.delete(handler);
  }

  /**
   * Publish a message through the active transport (WebSocket only — polling
   * is receive-only). Safe no-op while connected over polling.
   */
  publish(msg: RealtimeMessage): void {
    if (this.active?.kind === ("websocket" as TransportKind) && this.active.publish) {
      this.active.publish(msg);
    }
  }

  get transportKind(): TransportKind | null {
    return this.active?.kind ?? null;
  }

  disconnect(): void {
    this.connected = false;
    this.active?.disconnect();
    this.active = null;
    this.seenIds.clear();
    this.setStatus("connecting");
  }

  /** @internal exposed for tests — number of distinct ids seen recently. */
  get dedupeSize(): number {
    return this.seenIds.size;
  }

  private attach(transport: RealtimeTransport): void {
    transport.onMessage((msg) => this.dispatch(msg));
  }

  private dispatch(msg: RealtimeMessage): void {
    const now = Date.now();
    const lastSeen = this.seenIds.get(msg.id);
    if (lastSeen !== undefined && now - lastSeen < this.dedupeWindowMs) {
      return; // duplicate re-delivery — drop it.
    }
    this.seenIds.set(msg.id, now);
    // Opportunistically prune ids that have left the dedupe window.
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
}

/** Convenience factory. */
export function createRealtimeClient(options: RealtimeClientOptions = {}): RealtimeClient {
  return new RealtimeClient(options);
}

export type { RealtimeMessage, RealtimeTransport } from "./transports";

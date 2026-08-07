// Phase 20 — realtime transport layer. A `RealtimeTransport` is a pluggable
// channel that can carry `RealtimeMessage` payloads. The RealtimeClient tries
// the WebSocket transport first and falls back to polling when the socket is
// blocked (firewalls, offline demo halls, corporate proxies) — step 9.

export type TransportKind = "websocket" | "polling";

export interface RealtimeMessage {
  /** Stable unique id used for de-duplication across re-deliveries. */
  id: string;
  /** Event type, e.g. "SHELTER_UPDATE" | "RESOURCE_MOVE" | "CRITICAL_ALERT". */
  type: string;
  payload: Record<string, unknown>;
  /** ISO 8601 timestamp of when the event was emitted. */
  at: string;
}

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
}

/**
 * WebSocket transport. `connect()` resolves `true` once the socket opens and
 * `false` when it errors, closes, or fails to open within `connectTimeoutMs`
 * — the last case is how a blocked Realtime connection is detected so the
 * client can fall back to polling.
 */
export class WebSocketTransport implements RealtimeTransport {
  readonly kind: TransportKind = "websocket";

  private socket: WebSocketLike | null = null;
  private messageHandler: ((msg: RealtimeMessage) => void) | null = null;
  private readonly url: string;
  private readonly protocols?: string | string[];
  private readonly socketFactory: () => WebSocketLike;
  private readonly connectTimeoutMs: number;

  constructor(options: WebSocketTransportOptions) {
    this.url = options.url;
    this.protocols = options.protocols;
    // The DOM WebSocket is structurally wider than WebSocketLike — the cast
    // keeps the type honest while letting tests inject a minimal fake.
    this.socketFactory =
      options.socketFactory ??
      (() => new WebSocket(this.url, this.protocols) as unknown as WebSocketLike);
    this.connectTimeoutMs = options.connectTimeoutMs ?? 4000;
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
        resolve(false);
      };

      const succeed = () => {
        if (settled) return;
        settled = true;
        clearTimeout(connectTimer);
        this.socket = socket;
        socket.onmessage = (e) => this.handleRaw(e.data);
        resolve(true);
      };

      const connectTimer = setTimeout(fail, this.connectTimeoutMs);
      socket.onopen = succeed;
      socket.onerror = fail;
      socket.onclose = fail;
    });
  }

  publish(msg: RealtimeMessage): void {
    // Only send once the socket is actually open (readyState 1 = OPEN).
    if (this.socket && this.socket.readyState === 1) {
      this.socket.send(JSON.stringify(msg));
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
    }
  }

  private handleRaw(data: string): void {
    if (!this.messageHandler) return;
    try {
      const msg = JSON.parse(data) as RealtimeMessage;
      if (isValidMessage(msg)) {
        this.messageHandler(msg);
      }
    } catch {
      // Malformed frames are dropped — never crash the client on junk data.
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
 * Polling transport — the fallback for environments where WebSocket/Realtime
 * connections are blocked. Pulls `poll()` on an interval and forwards any new
 * messages. Delivery is de-duplicated upstream by the RealtimeClient.
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
    // Allow a disconnected transport to start polling again on reconnect.
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
        if (isValidMessage(msg)) {
          this.messageHandler(msg);
        }
      }
    } catch {
      // A failed poll tick is skipped — the next interval retries.
    }
  }
}

/** A message is only worth delivering when it has a stable, non-empty id. */
function isValidMessage(msg: RealtimeMessage | null | undefined): boolean {
  return (
    !!msg &&
    typeof msg.id === "string" &&
    msg.id.length > 0 &&
    typeof msg.type === "string"
  );
}

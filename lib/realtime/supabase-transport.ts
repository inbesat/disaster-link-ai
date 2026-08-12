// ---------------------------------------------------------------------
// lib/realtime/supabase-transport.ts — Phase 20 · Supabase Realtime channel
//
// A RealtimeTransport implementation backed by Supabase Realtime channels
// (WebSocket). Plugs into the existing RealtimeClient as the primary
// transport; falls back to polling when WebSocket is blocked.
//
// Usage:
//   const transport = new SupabaseRealtimeTransport('public:alerts', {
//     broadcast: { self: true },
//   });
//   const client = new RealtimeClient({ primary: transport, fallback: pollTransport });
// ---------------------------------------------------------------------

import type { RealtimeMessage, RealtimeTransport } from "./transports";

type ChannelEvent = "INSERT" | "UPDATE" | "DELETE" | "*" | "broadcast" | "presence";

export class SupabaseRealtimeTransport implements RealtimeTransport {
  private channel: { unsubscribe: () => Promise<string> } | null = null;
  private readonly table: string;
  private messageHandler: ((msg: RealtimeMessage) => void) | null = null;
  private readonly event: ChannelEvent;
  private readonly filter?: string;
  private connected = false;

  constructor(table: string, config: { event?: ChannelEvent; filter?: string }) {
    this.table = table;
    this.event = config.event ?? "*";
    this.filter = config.filter;
  }

  get kind(): "websocket" {
    return "websocket";
  }

  onMessage(handler: (msg: RealtimeMessage) => void): void {
    this.messageHandler = handler;
  }

  async connect(): Promise<boolean> {
    try {
      // Dynamic import to avoid bundling Supabase client on the server
      const { createClient } = await import("@supabase/supabase-js");
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) return false;

      const supabase = createClient(url, key);

      const channelName = `rt-${this.table}-${Date.now()}`;
      this.channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes" as never,
          {
            event: this.event,
            schema: "public",
            table: this.table,
            ...(this.filter ? { filter: this.filter } : {}),
          } as never,
          (payload: { new: unknown; old: unknown; eventType: string }) => {
            if (this.messageHandler) {
              this.messageHandler({
                id: `${this.table}-${payload.eventType}-${Date.now()}`,
                type: payload.eventType,
                payload: (payload.new ?? payload.old) as Record<string, unknown>,
                at: new Date().toISOString(),
              });
            }
          },
        )
        .subscribe((status: string) => {
          this.connected = status === "SUBSCRIBED";
        });

      // Wait briefly for subscription confirmation
      await new Promise((r) => setTimeout(r, 1000));
      return this.connected;
    } catch (error) {
      console.warn("[supabase-realtime] connection failed:", error);
      return false;
    }
  }

  publish(): void {
    // Receive-only transport
  }

  disconnect(): void {
    if (this.channel) {
      void this.channel.unsubscribe();
      this.channel = null;
    }
    this.connected = false;
  }

  get isConnected(): boolean {
    return this.connected;
  }
}

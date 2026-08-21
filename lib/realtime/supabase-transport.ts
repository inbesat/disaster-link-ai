// ---------------------------------------------------------------------
// lib/realtime/supabase-transport.ts — Phase 20/11 · Supabase Realtime Security
//
// A RealtimeTransport implementation backed by Supabase Realtime channels
// with private channel security, RLS alignment, authorization, payload
// sanitization, subscriber capacity limits, and district auto-unsubscribe.
// ---------------------------------------------------------------------

import { safeLog } from "../logger";
import type { RealtimeMessage, RealtimeTransport } from "./transports";

export type ChannelEvent = "INSERT" | "UPDATE" | "DELETE" | "*" | "broadcast" | "presence";

export interface RealtimeUserContext {
  id: string;
  role: string;
  districtId?: string;
  authToken?: string;
}

export interface SupabaseRealtimeTransportOptions {
  event?: ChannelEvent;
  filter?: string;
  user?: RealtimeUserContext;
  districtId?: string;
  maxSubscribers?: number;
}

/** Global channel subscriber tracking to enforce capacity limits. */
const channelSubscriberCounts = new Map<string, number>();

/** Sensitive keys stripped from realtime message payloads before delivery. */
const SENSITIVE_KEYS = new Set([
  "password",
  "passcode",
  "token",
  "auth_token",
  "jwt",
  "secret",
  "api_key",
  "private_key",
  "ssn",
  "credit_card",
]);

/**
 * Sanitize realtime message payloads: strip passwords/tokens and anonymize exact
 * coordinates for unauthorized roles.
 */
export function sanitizeRealtimePayload(
  payload: Record<string, unknown>,
  userRole?: string,
): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return payload;

  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      cleaned[key] = "[REDACTED]";
      continue;
    }

    // Anonymize exact coordinates for non-admin/non-field responders if exact coordinates are passed
    if (
      userRole === "public" ||
      userRole === "anonymous" ||
      !userRole
    ) {
      if ((key === "lat" || key === "latitude" || key === "lng" || key === "longitude") && typeof value === "number") {
        cleaned[key] = Number(value.toFixed(2)); // round to ~1.1km precision
        continue;
      }
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      cleaned[key] = sanitizeRealtimePayload(value as Record<string, unknown>, userRole);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

export class SupabaseRealtimeTransport implements RealtimeTransport {
  private channel: { unsubscribe: () => Promise<string> } | null = null;
  private readonly table: string;
  private messageHandler: ((msg: RealtimeMessage) => void) | null = null;
  private readonly event: ChannelEvent;
  private readonly filter?: string;
  private user?: RealtimeUserContext;
  private districtId?: string;
  private readonly maxSubscribers: number;
  private activeChannelName: string | null = null;
  private connected = false;

  constructor(table: string, config: SupabaseRealtimeTransportOptions = {}) {
    this.table = table;
    this.event = config.event ?? "*";
    this.filter = config.filter;
    this.user = config.user;
    this.districtId = config.districtId;
    this.maxSubscribers = config.maxSubscribers ?? 100;
  }

  get kind(): "websocket" {
    return "websocket";
  }

  onMessage(handler: (msg: RealtimeMessage) => void): void {
    this.messageHandler = handler;
  }

  /**
   * Verify if the current user is authorized to subscribe to this channel's district.
   */
  public verifyChannelAccess(): boolean {
    if (!this.user || !this.user.id) {
      safeLog("warn", "Realtime subscribe rejected: unauthenticated user", {
        action: "REALTIME_AUTH_DENIED",
        metadata: { table: this.table, districtId: this.districtId },
      });
      return false;
    }

    // Public / generic channels don't require district restrictions
    if (!this.districtId || this.districtId === "all" || this.districtId === "public") {
      return true;
    }

    // Super admins can access any district channel
    if (this.user.role === "super_admin") {
      return true;
    }

    // Users must match the target district ID
    const authorized = this.user.districtId === this.districtId;
    if (!authorized) {
      safeLog("warn", `Realtime subscribe rejected: district mismatch for user ${this.user.id}`, {
        userId: this.user.id,
        action: "REALTIME_DISTRICT_DENIED",
        metadata: {
          userDistrict: this.user.districtId,
          targetDistrict: this.districtId,
        },
      });
    }

    return authorized;
  }

  async connect(): Promise<boolean> {
    try {
      // 1. Auth & District Access Verification
      if (!this.verifyChannelAccess()) {
        return false;
      }

      // 2. Channel Name Construction (Private Channel naming convention e.g., district:patna or private:table)
      const channelBase = this.districtId
        ? `district:${this.districtId}`
        : `private:${this.table}`;
      this.activeChannelName = channelBase;

      // 3. Limit channel membership (max 100 subscribers per channel)
      const currentSubscribers = channelSubscriberCounts.get(this.activeChannelName) ?? 0;
      if (currentSubscribers >= this.maxSubscribers) {
        safeLog("warn", `Realtime channel subscriber limit exceeded for ${this.activeChannelName}`, {
          userId: this.user?.id,
          action: "REALTIME_CAPACITY_EXCEEDED",
          metadata: { channel: this.activeChannelName, currentSubscribers, limit: this.maxSubscribers },
        });
        return false;
      }

      // Increment subscriber count for this channel
      channelSubscriberCounts.set(this.activeChannelName, currentSubscribers + 1);

      // Dynamic import to avoid bundling Supabase client on the server
      const { createClient } = await import("@supabase/supabase-js");
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        this.decrementSubscribers();
        return false;
      }

      const supabase = createClient(url, key, {
        global: {
          headers: this.user?.authToken
            ? { Authorization: `Bearer ${this.user.authToken}` }
            : {},
        },
      });

      this.channel = supabase
        .channel(this.activeChannelName)
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
              const rawPayload = (payload.new ?? payload.old) as Record<string, unknown>;
              // 4. Scrub sensitive data & anonymize coordinates before delivering
              const sanitized = sanitizeRealtimePayload(rawPayload, this.user?.role);

              this.messageHandler({
                id: `${this.table}-${payload.eventType}-${Date.now()}`,
                type: payload.eventType,
                payload: sanitized,
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
    } catch (error: unknown) {
      this.decrementSubscribers();
      console.warn("[supabase-realtime] connection failed:", error);
      return false;
    }
  }

  /**
   * Auto-unsubscribe from the current district channel and switch to a new district.
   */
  async switchDistrict(newDistrictId: string): Promise<boolean> {
    this.disconnect();
    this.districtId = newDistrictId;
    return this.connect();
  }

  /**
   * Update current authenticated user context and reconnect if necessary.
   */
  setUser(user?: RealtimeUserContext): void {
    this.user = user;
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
    this.decrementSubscribers();
  }

  get isConnected(): boolean {
    return this.connected;
  }

  private decrementSubscribers(): void {
    if (this.activeChannelName) {
      const count = channelSubscriberCounts.get(this.activeChannelName) ?? 0;
      if (count > 1) {
        channelSubscriberCounts.set(this.activeChannelName, count - 1);
      } else {
        channelSubscriberCounts.delete(this.activeChannelName);
      }
      this.activeChannelName = null;
    }
  }

  /** For unit tests / capacity checking. */
  static getSubscriberCount(channelName: string): number {
    return channelSubscriberCounts.get(channelName) ?? 0;
  }

  /** For unit tests. */
  static resetSubscriberCounts(): void {
    channelSubscriberCounts.clear();
  }
}

// Phase 20/11 — presence tracking & data security.
// Tracks active responders/operators in command center channels with privacy controls:
// - Role-based presence visibility (team members & admins only)
// - Timestamp masking (fuzzy status 'online'/'recently'/'offline' instead of exact timestamps)
// - Privacy setting (ghost mode via hideOnlineStatus)
// - Strict channel isolation (don't broadcast presence outside joined channels)

import { isNewerEdit, type ConflictEdit } from "./conflict";

export interface PresenceMember {
  id: string;
  name: string;
  role?: string;
  /** Epoch ms of the last heartbeat — used internally for expiry. */
  lastSeen: number;
  /** Privacy setting: hide online status from other users (ghost mode). */
  hideOnlineStatus?: boolean;
  /** Explicit channel ID the user joined. */
  channelId?: string;
}

export type FuzzyPresenceStatus = "online" | "recently" | "offline";

export interface SanitizedPresenceMember {
  id: string;
  name: string;
  role?: string;
  status: FuzzyPresenceStatus;
  channelId?: string;
}

export type PresenceEvent =
  | { type: "join"; member: PresenceMember }
  | { type: "leave"; memberId: string }
  | { type: "expire"; memberId: string }
  | { type: "heartbeat"; memberId: string };

export interface PresenceTrackerOptions {
  /** Members who have not been seen within this window are pruned. */
  timeoutMs?: number;
  /** Explicit channel ID bound to this tracker. */
  channelId?: string;
}

/** Allowed roles for viewing online presence status. */
const AUTHORIZED_PRESENCE_ROLES = new Set([
  "super_admin",
  "district_admin",
  "field_responder",
]);

/** Convert exact `lastSeen` timestamp into fuzzy status without revealing exact timestamp. */
export function getSanitizedLastSeenStatus(
  lastSeen: number,
  nowMs: number = Date.now(),
): FuzzyPresenceStatus {
  const diffMs = nowMs - lastSeen;
  if (diffMs <= 60_000) return "online"; // active within 1 minute
  if (diffMs <= 300_000) return "recently"; // active within 5 minutes
  return "offline";
}

/** Check if viewer role is authorized to see team presence data. */
export function isAuthorizedForPresence(role?: string): boolean {
  if (!role) return false;
  return AUTHORIZED_PRESENCE_ROLES.has(role);
}

export class PresenceTracker {
  private readonly timeoutMs: number;
  public readonly channelId?: string;
  private members = new Map<string, PresenceMember>();
  private listeners = new Set<(event: PresenceEvent) => void>();
  private now: () => number;

  constructor(options: PresenceTrackerOptions = {}, now: () => number = Date.now) {
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.channelId = options.channelId;
    this.now = now;
  }

  /** A member comes online (or re-joins after being pruned). */
  join(input: {
    id: string;
    name: string;
    role?: string;
    hideOnlineStatus?: boolean;
    channelId?: string;
  }): PresenceMember {
    const existing = this.members.get(input.id);
    const member: PresenceMember = {
      id: input.id,
      name: input.name,
      role: input.role,
      lastSeen: this.now(),
      hideOnlineStatus: input.hideOnlineStatus ?? false,
      channelId: input.channelId ?? this.channelId,
    };
    this.members.set(input.id, member);

    // Only emit presence events if user hasn't explicitly hidden status
    if (!member.hideOnlineStatus) {
      if (existing) {
        this.emit({ type: "heartbeat", memberId: input.id });
      } else {
        this.emit({ type: "join", member });
      }
    }
    return member;
  }

  /** Refresh a member's freshness. Returns false when member is unknown. */
  heartbeat(id: string): boolean {
    const member = this.members.get(id);
    if (!member) return false;
    member.lastSeen = this.now();
    if (!member.hideOnlineStatus) {
      this.emit({ type: "heartbeat", memberId: id });
    }
    return true;
  }

  /** A member goes offline explicitly. */
  leave(id: string): boolean {
    const member = this.members.get(id);
    if (!this.members.delete(id)) return false;
    if (member && !member.hideOnlineStatus) {
      this.emit({ type: "leave", memberId: id });
    }
    return true;
  }

  /**
   * Return current online raw set (internal / admin). Prunes expired members.
   */
  online(): PresenceMember[] {
    const now = this.now();
    for (const [id, member] of Array.from(this.members)) {
      if (now - member.lastSeen > this.timeoutMs) {
        this.members.delete(id);
        if (!member.hideOnlineStatus) {
          this.emit({ type: "expire", memberId: id });
        }
      }
    }
    return Array.from(this.members.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  /**
   * Secure presence accessor:
   * 1. Requires team/admin role (public/anonymous viewers get empty array).
   * 2. Masks exact timestamps with fuzzy status ('online' | 'recently' | 'offline').
   * 3. Honors user's `hideOnlineStatus` setting (ghost mode).
   * 4. Enforces channel isolation (only members in target channel).
   */
  getSanitizedOnline(
    userRole?: string,
    targetChannelId?: string,
  ): SanitizedPresenceMember[] {
    if (!isAuthorizedForPresence(userRole)) {
      return [];
    }

    const channelFilter = targetChannelId ?? this.channelId;
    const now = this.now();

    return this.online()
      .filter((m) => {
        // Exclude members who hid their online status
        if (m.hideOnlineStatus) return false;

        // Channel isolation: match explicit channel ID if provided
        if (channelFilter && m.channelId && m.channelId !== channelFilter) {
          return false;
        }

        return true;
      })
      .map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        status: getSanitizedLastSeenStatus(m.lastSeen, now),
        channelId: m.channelId,
      }));
  }

  get count(): number {
    return this.online().length;
  }

  getMember(id: string): PresenceMember | undefined {
    return this.members.get(id);
  }

  /** Subscribe to presence events. Returns an unsubscribe function. */
  on(listener: (event: PresenceEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: PresenceEvent): void {
    for (const listener of Array.from(this.listeners)) listener(event);
  }
}

/**
 * Resolve which of two presence heartbeats is fresher — used when the same
 * member is seen on two transports.
 */
export function pickFresherPresence(a: PresenceMember, b: PresenceMember): PresenceMember {
  const aEdit: ConflictEdit = {
    clientId: a.id,
    version: a.lastSeen,
    updatedAt: new Date(a.lastSeen).toISOString(),
    baseVersion: 0,
  };
  const bEdit: ConflictEdit = {
    clientId: b.id,
    version: b.lastSeen,
    updatedAt: new Date(b.lastSeen).toISOString(),
    baseVersion: 0,
  };
  return isNewerEdit(aEdit, bEdit) ? a : b;
}

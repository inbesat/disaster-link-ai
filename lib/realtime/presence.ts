// Phase 20 — presence tracking. Tracks which responders/operators are online
// in a command center: members join, refresh via heartbeat, and expire after
// a timeout so stale "green dots" never linger. Pure logic — the UI calls
// `online()` on a sweep interval to prune expired members.
import { isNewerEdit, type ConflictEdit } from "./conflict";

export interface PresenceMember {
  id: string;
  name: string;
  role?: string;
  /** Epoch ms of the last heartbeat — used for expiry. */
  lastSeen: number;
}

export type PresenceEvent =
  | { type: "join"; member: PresenceMember }
  | { type: "leave"; memberId: string }
  | { type: "expire"; memberId: string }
  | { type: "heartbeat"; memberId: string };

export interface PresenceTrackerOptions {
  /** Members who have not been seen within this window are pruned. */
  timeoutMs?: number;
}

export class PresenceTracker {
  private readonly timeoutMs: number;
  private members = new Map<string, PresenceMember>();
  private listeners = new Set<(event: PresenceEvent) => void>();
  private now: () => number;

  constructor(options: PresenceTrackerOptions = {}, now: () => number = Date.now) {
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.now = now;
  }

  /** A member comes online (or re-joins after being pruned). */
  join(input: { id: string; name: string; role?: string }): PresenceMember {
    const existing = this.members.get(input.id);
    const member: PresenceMember = {
      id: input.id,
      name: input.name,
      role: input.role,
      lastSeen: this.now(),
    };
    this.members.set(input.id, member);
    if (existing) {
      this.emit({ type: "heartbeat", memberId: input.id });
    } else {
      this.emit({ type: "join", member });
    }
    return member;
  }

  /** Refresh a member's freshness. Returns false when the member is unknown. */
  heartbeat(id: string): boolean {
    const member = this.members.get(id);
    if (!member) return false;
    member.lastSeen = this.now();
    this.emit({ type: "heartbeat", memberId: id });
    return true;
  }

  /** A member goes offline explicitly (e.g. closing the app). */
  leave(id: string): boolean {
    if (!this.members.delete(id)) return false;
    this.emit({ type: "leave", memberId: id });
    return true;
  }

  /**
   * Prune expired members and return the current online set. Call on a sweep
   * interval (or before rendering) to keep presence honest.
   */
  online(): PresenceMember[] {
    const now = this.now();
    for (const [id, member] of Array.from(this.members)) {
      if (now - member.lastSeen > this.timeoutMs) {
        this.members.delete(id);
        this.emit({ type: "expire", memberId: id });
      }
    }
    return Array.from(this.members.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  /** Number of online (non-expired) members. */
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
 * member is seen on two transports (WebSocket + polling fallback) so the
 * newer claim wins without a stale re-join clobbering a fresh one.
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

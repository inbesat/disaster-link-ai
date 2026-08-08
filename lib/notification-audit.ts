// ---------------------------------------------------------------------
// lib/notification-audit.ts — 30-day notification audit trail (Settings · Phase 2 · Step 9).
//
// Pure data + helpers behind the NotificationAuditLog card. The mock
// entries represent the user's last N notifications; `relativeTime`
// renders the "2 mins ago"-style timestamps the card shows, so the whole
// viewer stays unit-testable without React.
// ---------------------------------------------------------------------

export type AuditStatus = "delivered" | "delayed" | "failed";

export type AuditChannel =
  | "In-App"
  | "Browser Push"
  | "Email"
  | "SMS";

export type AuditEntry = {
  id: string;
  type: string;
  channel: AuditChannel;
  status: AuditStatus;
  /** Real minutes elapsed since delivery in the current session. */
  minutesAgo: number;
  summary: string;
};

/** Last 5 mock notifications delivered to this responder (demo data). */
export const MOCK_AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: "audit-fld-01",
    type: "Flood Warning",
    channel: "SMS",
    status: "delivered",
    minutesAgo: 2,
    summary: "River level at critical — Gandak ghat embankment.",
  },
  {
    id: "audit-evac-02",
    type: "Evacuation Order",
    channel: "Email",
    status: "delivered",
    minutesAgo: 12,
    summary: "Tier-2 evacuation mandated — Sampatchak block.",
  },
  {
    id: "audit-res-03",
    type: "Resource Request",
    channel: "Browser Push",
    status: "delayed",
    minutesAgo: 26,
    summary: "18 boats + relief material requested for Maner.",
  },
  {
    id: "audit-chat-04",
    type: "Chat Mention",
    channel: "In-App",
    status: "delivered",
    minutesAgo: 41,
    summary: "@asha.v assigned to rendezvous point at Dayalpur.",
  },
  {
    id: "audit-sys-05",
    type: "System Update",
    channel: "SMS",
    status: "failed",
    minutesAgo: 58,
    summary: "Nightly maintenance window — 02:00 to 02:30 IST.",
  },
];

/** "2" → "2 mins ago", "58" → "58 mins ago", 90 → "1 hr ago", etc. */
export function relativeTime(minutesAgo: number): string {
  if (minutesAgo < 1) return "Just now";
  if (minutesAgo < 60) {
    const m = Math.round(minutesAgo);
    return `${m} min${m === 1 ? "" : "s"} ago`;
  }
  const hours = Math.round(minutesAgo / 60);
  if (hours < 24) {
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
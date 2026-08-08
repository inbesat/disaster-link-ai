// ---------------------------------------------------------------------
// lib/settings/privacy-settings.ts — Privacy & Security (Phase 6).
//
// Pure model + sanitizer + localStorage accessors for the privacy /
// security snapshot: API keys, data retention policies, account
// deactivation state, plus audit-event filtering helpers. Mirrors the
// ai-settings / org-settings pattern so every Phase 6 card reads and
// writes one consistent store that survives refresh.
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// API Key Management (Phase 6 · Step 5)
// ---------------------------------------------------------------------

/** Read Only = query data; Read/Write = query + create/update records. */
export type ApiKeyScope = "read" | "read_write";

export type ApiKeyRecord = {
  id: string;
  /** Human-readable label, e.g. "Drone-Telemetry-Feed". */
  label: string;
  scope: ApiKeyScope;
  /** "2 hrs ago" style relative string, or null when never used. */
  lastUsed: string | null;
  /** Last calling IP, or null when never used. */
  ip: string | null;
  /** Display date, e.g. "Oct 12". */
  createdAt: string;
  revoked: boolean;
  /** Visible key prefix e.g. "bs_live_8f9d…" — full secret never stored. */
  prefix: string;
};

export const DEFAULT_API_KEYS: ApiKeyRecord[] = [
  {
    id: "key_1",
    label: "Drone-Telemetry-Feed",
    scope: "read_write",
    lastUsed: "2 hrs ago",
    ip: "192.168.1.1",
    createdAt: "Oct 12",
    revoked: false,
    prefix: "bs_live_8f9d",
  },
  {
    id: "key_2",
    label: "Weather Ingestion Pipeline",
    scope: "read_write",
    lastUsed: "22 min ago",
    ip: "198.51.100.17",
    createdAt: "Apr 18",
    revoked: false,
    prefix: "bs_live_c21e",
  },
  {
    id: "key_3",
    label: "Field App · Patna",
    scope: "read",
    lastUsed: "4 min ago",
    ip: "203.0.113.42",
    createdAt: "May 02",
    revoked: false,
    prefix: "bs_live_9f3a",
  },
  {
    id: "key_4",
    label: "Read-only Analytics Widget",
    scope: "read",
    lastUsed: "2 days ago",
    ip: "203.0.113.90",
    createdAt: "Mar 27",
    revoked: true,
    prefix: "bs_live_77b0",
  },
];

// ---------------------------------------------------------------------
// Data Retention (Phase 6 · Step 8)
// ---------------------------------------------------------------------

export type RetentionPolicy = {
  /** 0 = keep forever */
  chatHistoryDays: number;
  /** 0 = keep forever */
  predictionsDays: number;
  /** 0 = keep forever */
  attendanceMonths: number;
  /** GPS location archive window in hours — 24 / 168 / 720 (Settings · Step 8). */
  gpsLocationHours: number;
};

export const DEFAULT_RETENTION: RetentionPolicy = {
  chatHistoryDays: 30,
  predictionsDays: 90,
  attendanceMonths: 12,
  gpsLocationHours: 24,
};

// ---------------------------------------------------------------------
// Login & Session Security (Phase 6 · Step 4)
// ---------------------------------------------------------------------

export type SessionTimeout = "15m" | "30m" | "1h" | "4h" | "never";

export type LoginSecurityPolicy = {
  /** Auto sign-out after this idle period; "never" disables it. */
  sessionTimeout: SessionTimeout;
  /** Force a fresh password at each 90-day anniversary. */
  requirePasswordChange90d: boolean;
  /** Block logins from unknown IPs until an emailed link verifies them. */
  blockUnknownIp: boolean;
};

export const DEFAULT_LOGIN_SECURITY: LoginSecurityPolicy = {
  sessionTimeout: "30m",
  requirePasswordChange90d: false,
  // Secure-by-default: unknown-IP logins require email verification.
  blockUnknownIp: true,
};

export const SESSION_TIMEOUTS: { value: SessionTimeout; label: string; note?: string }[] = [
  { value: "15m", label: "15 minutes" },
  { value: "30m", label: "30 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "4h", label: "4 hours" },
  { value: "never", label: "Never", note: "Not Recommended" },
];

const SESSION_TIMEOUT_VALUES: SessionTimeout[] = SESSION_TIMEOUTS.map((t) => t.value);

function sanitizeLoginSecurity(raw: unknown): LoginSecurityPolicy {
  const out = { ...DEFAULT_LOGIN_SECURITY };
  if (!raw || typeof raw !== "object") return out;
  const s = raw as Record<string, unknown>;
  if (
    typeof s.sessionTimeout === "string" &&
    SESSION_TIMEOUT_VALUES.includes(s.sessionTimeout as SessionTimeout)
  ) {
    out.sessionTimeout = s.sessionTimeout as SessionTimeout;
  }
  if (typeof s.requirePasswordChange90d === "boolean") {
    out.requirePasswordChange90d = s.requirePasswordChange90d;
  }
  if (typeof s.blockUnknownIp === "boolean") {
    out.blockUnknownIp = s.blockUnknownIp;
  }
  return out;
}

// ---------------------------------------------------------------------
// Account Deactivation (Phase 6 · Step 9)
// ---------------------------------------------------------------------

export type DeactivationMode = "soft" | "hard" | null;

export type DeactivationRequest = {
  mode: DeactivationMode;
  /** ISO date the purge completes, or null when no request is pending. */
  effectiveAt: string | null;
};

export const DEFAULT_DEACTIVATION: DeactivationRequest = {
  mode: null,
  effectiveAt: null,
};

// ---------------------------------------------------------------------
// Data Visibility (Phase 6 · Step 2) — who may view my operational records.
// ---------------------------------------------------------------------

export type GpsVisibility = "nobody" | "team" | "admins";
export type ContactVisibility = "team_admins" | "admins";

export type DataVisibility = {
  gps: GpsVisibility;
  attendance: GpsVisibility;
  contact: ContactVisibility;
};

export const DEFAULT_VISIBILITY: DataVisibility = {
  gps: "team",
  attendance: "admins",
  contact: "team_admins",
};

export type PrivacySettings = {
  apiKeys: ApiKeyRecord[];
  retention: RetentionPolicy;
  deactivation: DeactivationRequest;
  loginSecurity: LoginSecurityPolicy;
  /** Who may view my operational records (Step 2). */
  visibility: DataVisibility;
};

export const DRIP_PRIVACY_SETTINGS_KEY = "drip_privacy_settings_v1";

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  apiKeys: DEFAULT_API_KEYS.map((k) => ({ ...k })),
  retention: { ...DEFAULT_RETENTION },
  deactivation: { ...DEFAULT_DEACTIVATION },
  loginSecurity: { ...DEFAULT_LOGIN_SECURITY },
  visibility: { ...DEFAULT_VISIBILITY },
};

const KEY_SCOPES: ApiKeyScope[] = ["read", "read_write"];

function sanitizeApiKey(raw: unknown): ApiKeyRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const k = raw as Record<string, unknown>;
  if (typeof k.id !== "string" || typeof k.label !== "string") return null;
  return {
    id: k.id,
    label: String(k.label).slice(0, 80),
    scope: KEY_SCOPES.includes(k.scope as ApiKeyScope)
      ? (k.scope as ApiKeyScope)
      : "read",
    lastUsed: typeof k.lastUsed === "string" ? k.lastUsed : null,
    ip: typeof k.ip === "string" ? k.ip : null,
    createdAt: typeof k.createdAt === "string" ? k.createdAt : "Unknown",
    revoked: k.revoked === true,
    prefix: typeof k.prefix === "string" ? k.prefix.slice(0, 24) : "bs_live_????",
  };
}

function sanitizeRetention(raw: unknown): RetentionPolicy {
  const out = { ...DEFAULT_RETENTION };
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Record<string, unknown>;
  const pick = (key: string, fallback: number) =>
    typeof r[key] === "number" && Number.isFinite(r[key] as number)
      ? Math.max(0, Math.round(r[key] as number))
      : fallback;
  out.chatHistoryDays = pick("chatHistoryDays", 30);
  out.predictionsDays = pick("predictionsDays", 90);
  out.attendanceMonths = pick("attendanceMonths", 12);
  out.gpsLocationHours = pick("gpsLocationHours", 24);
  return out;
}

function sanitizeDeactivation(raw: unknown): DeactivationRequest {
  const out = { ...DEFAULT_DEACTIVATION };
  if (!raw || typeof raw !== "object") return out;
  const d = raw as Record<string, unknown>;
  if (d.mode === "soft" || d.mode === "hard") out.mode = d.mode;
  out.effectiveAt =
    typeof d.effectiveAt === "string" ? d.effectiveAt.slice(0, 40) : null;
  return out;
}

/** Guarded merge — corrupt or partial snapshots never break privacy settings. */
export function mergePrivacySettings(raw: unknown): PrivacySettings {
  const base: PrivacySettings = {
    apiKeys: DEFAULT_API_KEYS.map((k) => ({ ...k })),
    retention: { ...DEFAULT_RETENTION },
    deactivation: { ...DEFAULT_DEACTIVATION },
    loginSecurity: { ...DEFAULT_LOGIN_SECURITY },
    visibility: { ...DEFAULT_VISIBILITY },
  };
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Record<string, unknown>;

  if (Array.isArray(data.apiKeys)) {
    // An explicitly stored array always wins — even empty (all keys
    // revoked) or fully invalid — so a user who revoked everything does
    // not get the 3 demo defaults resurrected.
    base.apiKeys = data.apiKeys
      .map(sanitizeApiKey)
      .filter((k): k is ApiKeyRecord => k !== null);
  }
  if (data.retention) base.retention = sanitizeRetention(data.retention);
  if (data.deactivation) base.deactivation = sanitizeDeactivation(data.deactivation);
  if (data.loginSecurity) base.loginSecurity = sanitizeLoginSecurity(data.loginSecurity);
  if (data.visibility) base.visibility = sanitizeVisibility(data.visibility);
  return base;
}

const GPS_VISIBILITY: GpsVisibility[] = ["nobody", "team", "admins"];
const CONTACT_VISIBILITY: ContactVisibility[] = ["team_admins", "admins"];

function sanitizeVisibility(raw: unknown): DataVisibility {
  const out = { ...DEFAULT_VISIBILITY };
  if (!raw || typeof raw !== "object") return out;
  const v = raw as Record<string, unknown>;
  if (GPS_VISIBILITY.includes(v.gps as GpsVisibility)) {
    out.gps = v.gps as GpsVisibility;
  }
  if (GPS_VISIBILITY.includes(v.attendance as GpsVisibility)) {
    out.attendance = v.attendance as GpsVisibility;
  }
  if (CONTACT_VISIBILITY.includes(v.contact as ContactVisibility)) {
    out.contact = v.contact as ContactVisibility;
  }
  return out;
}

export function readStoredPrivacySettings(): PrivacySettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRIP_PRIVACY_SETTINGS_KEY);
    if (!raw) return null;
    return mergePrivacySettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeStoredPrivacySettings(settings: PrivacySettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRIP_PRIVACY_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // storage full / blocked — ignore for the demo
  }
}

/** Generate a new key record with a masked prefix (secret only shown once).
 *  Secrets use the `bs_live_` brand prefix, e.g. bs_live_8f9d2a…
 */
export function createApiKey(
  label: string,
  scope: ApiKeyScope,
): { key: ApiKeyRecord; secret: string } {
  const stamp = Math.random().toString(36).slice(2, 6);
  const prefix = `bs_live_${stamp}`;
  const secret = `bs_live_${stamp}${Math.random().toString(36).slice(2, 12)}`;
  const record: ApiKeyRecord = {
    id: `key_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    label: label.slice(0, 80),
    scope,
    lastUsed: null,
    ip: null,
    createdAt: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    revoked: false,
    prefix,
  };
  return { key: record, secret };
}

export function revokeApiKey(id: string, keys: ApiKeyRecord[]): ApiKeyRecord[] {
  return keys.map((k) => (k.id === id ? { ...k, revoked: true } : k));
}

// ---------------------------------------------------------------------
// Audit Log (Phase 6 · Step 6) — event filtering helpers.
// Events themselves are written by lib/admin/audit-logger.ts on the
// server; this client store carries the filterable viewer + demo events.
// ---------------------------------------------------------------------

export type AuditSeverity = "info" | "warning" | "critical";

export type AuditEvent = {
  id: string;
  /** Human-readable action, e.g. "Login Success". */
  action: string;
  /** Who performed the action (name + role). */
  actor: string;
  /** What was acted on, e.g. "API key: Drone-Telemetry-Feed". */
  resource: string;
  severity: AuditSeverity;
  /** Calling IP address. */
  ip: string;
  /** Device / client string, e.g. "Chrome 130 · Windows 11". */
  device: string;
  /** Fixed ISO timestamp (deterministic for SSR — no hydration drift). */
  timestamp: string; // ISO
};

/**
 * Seeded security events for the Account Audit Log viewer.
 *
 * Timestamps are FIXED ISO strings (not Date.now()-relative) so server and
 * client render byte-identical rows — avoiding the SSR hydration mismatch
 * a relative clock would introduce. Production rows come from the server
 * audit logger (lib/admin/audit-logger.ts) instead.
 */
export const DEMO_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "a1",
    action: "Login Success",
    actor: "Asha Verma (district_admin)",
    resource: "session · Patna command console",
    severity: "info",
    ip: "203.0.113.24",
    device: "Chrome 130 · Windows 11",
    timestamp: "2026-08-08T10:24:00.000Z",
  },
  {
    id: "a2",
    action: "Exported Data",
    actor: "Arvind Sharma (district_admin)",
    resource: "alerts · Sitamarhi",
    severity: "info",
    ip: "203.0.113.90",
    device: "Edge 131 · Windows 11",
    timestamp: "2026-08-08T09:12:00.000Z",
  },
  {
    id: "a3",
    action: "Changed Alert Settings",
    actor: "Asha Verma (district_admin)",
    resource: "alert_rules · critical_flood",
    severity: "warning",
    ip: "203.0.113.24",
    device: "Chrome 130 · Windows 11",
    timestamp: "2026-08-08T08:45:00.000Z",
  },
  {
    id: "a4",
    action: "Revoked API Key",
    actor: "Meera Krishnan (super_admin)",
    resource: "API key: Read-only Analytics Widget",
    severity: "warning",
    ip: "198.51.100.9",
    device: "Safari 18 · macOS 15",
    timestamp: "2026-08-08T07:30:00.000Z",
  },
  {
    id: "a5",
    action: "Triggered AI Plan",
    actor: "Asha Verma (district_admin)",
    resource: "emergency_plan · evac-patna-north",
    severity: "critical",
    ip: "203.0.113.24",
    device: "Chrome 130 · Windows 11",
    timestamp: "2026-08-08T06:05:00.000Z",
  },
  {
    id: "a6",
    action: "Role Updated",
    actor: "Meera Krishnan (super_admin)",
    resource: "user:priya.n → field_responder",
    severity: "warning",
    ip: "198.51.100.9",
    device: "Safari 18 · iPhone 15 Pro",
    timestamp: "2026-08-07T18:40:00.000Z",
  },
];

export type AuditFilter = {
  severity: AuditSeverity | "all";
  query: string;
};

/** Filter + sort audit events by severity and free-text query. */
export function filterAuditEvents(
  events: AuditEvent[],
  filter: AuditFilter,
): AuditEvent[] {
  const q = filter.query.trim().toLowerCase();
  return [...events]
    .filter((e) => filter.severity === "all" || e.severity === filter.severity)
    .filter((e) =>
      q
        ? [e.action, e.actor, e.resource, e.ip, e.device].some((field) =>
            field.toLowerCase().includes(q),
          )
        : true,
    )
    .sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/**
 * Deterministic absolute timestamp (e.g. "08 Aug 2026 · 10:24 UTC").
 * Uses only UTC getters + a fixed month table so server-rendered HTML and
 * client hydration always match, regardless of the browser's locale/zone.
 */
export function formatAuditTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = MONTHS[d.getUTCMonth()];
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${d.getUTCFullYear()} · ${hours}:${minutes} UTC`;
}

/** "3m ago" / "5h ago" / "2d ago" relative time from an ISO timestamp. */
export function relativeAuditTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** Flatten audit events into a CSV string (header + rows). */
export function auditEventsToCsv(events: AuditEvent[]): string {
  const header = ["timestamp", "action", "actor", "resource", "severity", "ip", "device"];
  const rows = events.map((e) =>
    [
      e.timestamp,
      `"${e.action.replace(/"/g, '""')}"`,
      `"${e.actor.replace(/"/g, '""')}"`,
      `"${e.resource.replace(/"/g, '""')}"`,
      e.severity,
      e.ip,
      `"${e.device.replace(/"/g, '""')}"`,
    ].join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

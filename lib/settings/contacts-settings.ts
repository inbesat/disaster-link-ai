// ---------------------------------------------------------------------
// lib/settings/contacts-settings.ts — Contacts (Phase 7 · Step 10).
//
// Pure, framework-free model for the Emergency Contacts preferences:
// channel priority (failover order), GPS injection toggles, and the
// editable SOS message templates. Everything the /settings/contacts cards
// can tweak lives here as a single ContactSettings snapshot, persisted to
// localStorage under DRIP_CONTACTS_SETTINGS_KEY so a refresh restores the
// exact same configuration.
//
// The module is deliberately side-effect free (no window/React access) so
// the merge/sanitize logic is unit-testable under node.
// ---------------------------------------------------------------------

export const DRIP_CONTACTS_SETTINGS_KEY = "drip_contacts_settings_v1";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export const CHANNEL_IDS = ["sms", "whatsapp", "voice", "email"] as const;
export type ChannelId = (typeof CHANNEL_IDS)[number];

/** One slot in the failover chain — order in the array IS the priority. */
export type ChannelPriorityItem = {
  id: ChannelId;
  name: string;
  hint: string;
};

export type GpsInjectionSettings = {
  /** Append live GPS coordinates + tracking link to every SOS message. */
  enabled: boolean;
  /** Keep GPS tracking active for 60 minutes after SOS is triggered. */
  tracking60: boolean;
};

export type MessageTemplate = {
  id: string;
  name: string;
  emoji: string;
  text: string;
};

export type ContactSettings = {
  channelPriority: ChannelPriorityItem[];
  gpsInjection: GpsInjectionSettings;
  messageTemplates: MessageTemplate[];
};

// ---------------------------------------------------------------------
// Defaults — mirror the shipped demo configuration.
// ---------------------------------------------------------------------

export const DEFAULT_CHANNEL_PRIORITY: ChannelPriorityItem[] = [
  {
    id: "sms",
    name: "SMS",
    hint: "Best for low-bandwidth connectivity",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    hint: "Rich media and read receipts",
  },
  {
    id: "voice",
    name: "Automated Voice Call",
    hint: "Reaches landlines without any data",
  },
  {
    id: "email",
    name: "Email",
    hint: "Durable written trail for records",
  },
];

export const DEFAULT_GPS_INJECTION: GpsInjectionSettings = {
  enabled: true,
  tracking60: true,
};

export const DEFAULT_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "flood",
    name: "Flash Flood Alert",
    emoji: "🚨",
    text: "🚨 FLASH FLOOD: Evacuation initiated. Need immediate backup at {location}.",
  },
  {
    id: "medical",
    name: "Medical Emergency",
    emoji: "🏥",
    text: "🏥 MEDICAL EMERGENCY: Require med-evac for {count} civilians at {shelter}.",
  },
  {
    id: "route",
    name: "Route Blocked",
    emoji: "⚠️",
    text: "⚠️ ROUTE BLOCKED: {road} impassable near {location}. Rerouting evacuees to {shelter}.",
  },
];

export function cloneDefaultContactSettings(): ContactSettings {
  return {
    channelPriority: DEFAULT_CHANNEL_PRIORITY.map((c) => ({ ...c })),
    gpsInjection: { ...DEFAULT_GPS_INJECTION },
    messageTemplates: DEFAULT_MESSAGE_TEMPLATES.map((t) => ({ ...t })),
  };
}

// ---------------------------------------------------------------------
// Guard helpers
// ---------------------------------------------------------------------

function isChannelId(value: unknown): value is ChannelId {
  return (
    typeof value === "string" &&
    (CHANNEL_IDS as readonly string[]).includes(value)
  );
}

/**
 * Sanitize the failover order: keep the user's ordering, drop duplicates
 * and junk ids, and re-append any missing channels at the end so all four
 * always exist.
 */
function sanitizeChannelPriority(raw: unknown): ChannelPriorityItem[] {
  if (!Array.isArray(raw)) return DEFAULT_CHANNEL_PRIORITY.map((c) => ({ ...c }));

  const seen = new Set<ChannelId>();
  const out: ChannelPriorityItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    if (!isChannelId(entry.id) || seen.has(entry.id)) continue;
    seen.add(entry.id);
    out.push({
      id: entry.id,
      name: typeof entry.name === "string" ? entry.name.slice(0, 60) : entry.id,
      hint: typeof entry.hint === "string" ? entry.hint.slice(0, 120) : "",
    });
  }
  // Re-append defaults for any channels the snapshot dropped.
  for (const def of DEFAULT_CHANNEL_PRIORITY) {
    if (!seen.has(def.id)) out.push({ ...def });
  }
  return out;
}

function sanitizeGpsInjection(raw: unknown): GpsInjectionSettings {
  const out = { ...DEFAULT_GPS_INJECTION };
  if (!raw || typeof raw !== "object") return out;
  const g = raw as Record<string, unknown>;
  if (typeof g.enabled === "boolean") out.enabled = g.enabled;
  if (typeof g.tracking60 === "boolean") out.tracking60 = g.tracking60;
  return out;
}

function sanitizeTemplates(raw: unknown): MessageTemplate[] {
  if (!Array.isArray(raw)) return DEFAULT_MESSAGE_TEMPLATES.map((t) => ({ ...t }));

  const out: MessageTemplate[] = [];
  raw.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const t = item as Record<string, unknown>;
    out.push({
      id:
        typeof t.id === "string" && t.id.trim()
          ? t.id.slice(0, 40)
          : `tpl-${index + 1}`,
      name: typeof t.name === "string" ? t.name.slice(0, 60) : `Template ${index + 1}`,
      emoji: typeof t.emoji === "string" ? t.emoji.slice(0, 8) : "📢",
      text: typeof t.text === "string" ? t.text.slice(0, 500) : "",
    });
  });
  return out.length ? out : DEFAULT_MESSAGE_TEMPLATES.map((t) => ({ ...t }));
}

// ---------------------------------------------------------------------
// Merge / sanitize (pure, testable)
// ---------------------------------------------------------------------

export function mergeContactSettings(raw: unknown): ContactSettings {
  const base = cloneDefaultContactSettings();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Record<string, unknown>;
  if (data.channelPriority !== undefined) {
    base.channelPriority = sanitizeChannelPriority(data.channelPriority);
  }
  if (data.gpsInjection !== undefined) {
    base.gpsInjection = sanitizeGpsInjection(data.gpsInjection);
  }
  if (data.messageTemplates !== undefined) {
    base.messageTemplates = sanitizeTemplates(data.messageTemplates);
  }
  return base;
}

// ---------------------------------------------------------------------
// Storage accessors (guarded for SSR — no window at module scope)
// ---------------------------------------------------------------------

export function readStoredContactSettings(): ContactSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRIP_CONTACTS_SETTINGS_KEY);
    if (!raw) return null;
    return mergeContactSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeStoredContactSettings(settings: ContactSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DRIP_CONTACTS_SETTINGS_KEY,
      JSON.stringify(settings),
    );
  } catch {
    // storage full / blocked — in-memory state still applies this tab
  }
}

// ---------------------------------------------------------------------
// lib/settings/search-index.ts — catalog of findable settings (Phase 9).
//
// Every settings card / section that the SettingsSearchBar should surface.
// Each entry maps keywords → a card on the current page (via data-settings-key)
// or a sidebar section to navigate to. Shared so the search bar and any
// future keyboard shortcut UI use one source of truth.
// ---------------------------------------------------------------------

export type SettingsSearchEntry = {
  /** Stable id used for the card's data-settings-key attribute. */
  key: string;
  /** Human label shown in the results dropdown. */
  label: string;
  /** Keywords + label words used for matching. */
  keywords: string[];
  /** Sidebar section to visit when the card isn't on the current page. */
  sectionHref: string;
  /** When non-null, the card lives on this route (adds in-page highlight). */
  cardRoute?: string;
};

export const SETTINGS_SEARCH_ENTRIES: SettingsSearchEntry[] = [
  {
    key: "avatar",
    label: "Profile Avatar",
    keywords: ["avatar", "photo", "image", "picture", "upload", "crop"],
    sectionHref: "/settings/profile",
    cardRoute: "/settings/profile",
  },
  {
    key: "personal-info",
    label: "Personal Information",
    keywords: [
      "name",
      "display",
      "email",
      "phone",
      "bio",
      "designation",
      "profile",
    ],
    sectionHref: "/settings/profile",
    cardRoute: "/settings/profile",
  },
  {
    key: "professional-details",
    label: "Professional Details & Certifications",
    keywords: [
      "badge",
      "certification",
      "credential",
      "organization",
      "department",
      "employee id",
      "verification",
    ],
    sectionHref: "/settings/profile",
    cardRoute: "/settings/profile",
  },
  {
    key: "password",
    label: "Password & Security",
    keywords: [
      "password",
      "change",
      "update",
      "security",
      "credential",
      "strength",
      "recover",
    ],
    sectionHref: "/settings/profile",
    cardRoute: "/settings/profile",
  },
  {
    key: "sessions",
    label: "Active Sessions & Devices",
    keywords: [
      "sessions",
      "devices",
      "login",
      "log out",
      "sign out",
      "browser",
      "security",
    ],
    sectionHref: "/settings/profile",
    cardRoute: "/settings/profile",
  },
  {
    key: "localization",
    label: "Language, Region & Timezone",
    keywords: [
      "language",
      "region",
      "timezone",
      "localization",
      "ist",
      "translate",
      "sms language",
    ],
    sectionHref: "/settings/profile",
    cardRoute: "/settings/profile",
  },
  {
    key: "visibility",
    label: "Profile Visibility & Privacy",
    keywords: [
      "visibility",
      "privacy",
      "directory",
      "public",
      "private",
      "limited",
      "gps",
      "location",
      "access",
    ],
    sectionHref: "/settings/profile",
    cardRoute: "/settings/profile",
  },
  {
    key: "alert-prefs",
    label: "Notifications — Alert Preferences",
    keywords: [
      "notification",
      "alert",
      "alerts",
      "severity",
      "critical",
      "warning",
      "push",
    ],
    sectionHref: "/settings/notifications",
  },
  {
    key: "channels",
    label: "Notifications — Channels",
    keywords: ["sms", "email", "push", "channel", "twilio", "siren"],
    sectionHref: "/settings/notifications",
  },
  {
    key: "dnd",
    label: "Notifications — Do Not Disturb",
    keywords: ["do not disturb", "dnd", "quiet", "hours", "mute"],
    sectionHref: "/settings/notifications",
  },
  {
    key: "map-default",
    label: "Map — Default View",
    keywords: ["map", "view", "center", "zoom", "district", "pan"],
    sectionHref: "/settings/map",
    cardRoute: "/settings/map",
  },
  {
    key: "map-layers",
    label: "Map — Layers",
    keywords: ["map", "layer", "flood", "shelter", "road", "overlay"],
    sectionHref: "/settings/map",
    cardRoute: "/settings/map",
  },
  {
    key: "map-units",
    label: "Map — Units",
    keywords: ["units", "metric", "km", "kilometer", "measurement"],
    sectionHref: "/settings/map",
    cardRoute: "/settings/map",
  },
  {
    key: "map-offline",
    label: "Map — Offline Cache",
    keywords: ["offline", "cache", "tiles", "download", "storage"],
    sectionHref: "/settings/map",
    cardRoute: "/settings/map",
  },
  {
    key: "ai-model",
    label: "AI — Model & Provider",
    keywords: ["ai", "model", "llm", "openrouter", "provider", "groq", "engine"],
    sectionHref: "/settings/ai",
  },
  {
    key: "ai-style",
    label: "AI — Response Style",
    keywords: ["ai", "style", "tone", "concise", "detailed", "response"],
    sectionHref: "/settings/ai",
  },
  {
    key: "ai-tools",
    label: "AI — Tool Permissions",
    keywords: ["ai", "tools", "permissions", "shelter", "resource"],
    sectionHref: "/settings/ai",
  },
  {
    key: "ai-history",
    label: "AI — Chat History",
    keywords: ["ai", "chat", "history", "conversation", "clear"],
    sectionHref: "/settings/ai",
  },
  {
    key: "org-districts",
    label: "Organization — Districts",
    keywords: ["organization", "district", "patna", "admin"],
    sectionHref: "/settings/organization",
  },
  {
    key: "org-roles",
    label: "Organization — Team & Roles",
    keywords: ["organization", "team", "roles", "responder", "ndrf", "member"],
    sectionHref: "/settings/organization",
  },
  {
    key: "org-branding",
    label: "Organization — Branding",
    keywords: ["organization", "brand", "logo", "theme", "admin"],
    sectionHref: "/settings/organization",
  },
  {
    key: "privacy-data",
    label: "Privacy — Data Visibility",
    keywords: ["privacy", "data", "visibility", "anonymize"],
    sectionHref: "/settings/privacy",
  },
  {
    key: "privacy-2fa",
    label: "Privacy — Two-factor Authentication",
    keywords: ["2fa", "two factor", "mfa", "otp", "authenticator", "security"],
    sectionHref: "/settings/privacy",
  },
  {
    key: "privacy-audit",
    label: "Privacy — Audit Log",
    keywords: ["audit", "log", "activity", "history", "export"],
    sectionHref: "/settings/privacy",
  },
  {
    key: "privacy-export",
    label: "Privacy — Data Export",
    keywords: ["export", "data", "gdpr", "download", "csv"],
    sectionHref: "/settings/privacy",
  },
  {
    key: "contacts-personal",
    label: "Emergency Contacts — Personal",
    keywords: ["contact", "emergency", "personal", "phone", "next of kin"],
    sectionHref: "/settings/contacts",
  },
  {
    key: "contacts-quickdial",
    label: "Emergency Contacts — Quick Dial",
    keywords: ["contact", "quick dial", "speed dial", "hotline", "shortcut"],
    sectionHref: "/settings/contacts",
  },
  {
    key: "contacts-templates",
    label: "Emergency Contacts — Templates",
    keywords: ["contact", "template", "message", "sms"],
    sectionHref: "/settings/contacts",
  },
  {
    key: "contacts-emergencymode",
    label: "Emergency Contacts — Emergency Mode",
    keywords: ["emergency", "mode", "panic", "safety", "sos"],
    sectionHref: "/settings/contacts",
  },
  {
    key: "integrations-weather",
    label: "Integrations — Weather APIs",
    keywords: ["integration", "weather", "api", "openweather", "imd", "data"],
    sectionHref: "/settings/integrations",
  },
  {
    key: "integrations-sms",
    label: "Integrations — SMS / Voice",
    keywords: ["integration", "sms", "voice", "twilio", "fast2sms"],
    sectionHref: "/settings/integrations",
  },
  {
    key: "integrations-satellite-gis",
    label: "Integrations — Satellite & GIS Providers",
    keywords: [
      "integration",
      "satellite",
      "gis",
      "bhuvan",
      "earth engine",
      "sentinel",
      "imagery",
      "geospatial",
      "datasets",
    ],
    sectionHref: "/settings/integrations",
  },
  {
    key: "integrations-webhooks",
    label: "Integrations — Webhooks",
    keywords: ["integration", "webhook", "endpoint", "callback"],
    sectionHref: "/settings/integrations",
  },
  {
    key: "integrations-sensors",
    label: "Integrations — Sensor Data Pipelines",
    keywords: ["integration", "sensor", "iot", "gauge", "telemetry", "pipeline"],
    sectionHref: "/settings/integrations",
  },
  {
    key: "integrations-health",
    label: "Integrations — System Health",
    keywords: [
      "integration",
      "system",
      "health",
      "status",
      "uptime",
      "ping",
      "latency",
      "diagnostics",
    ],
    sectionHref: "/settings/integrations",
  },
  {
    key: "integrations-rate-limit",
    label: "Integrations — Rate Limits & Quotas",
    keywords: [
      "integration",
      "rate",
      "limit",
      "quota",
      "cost",
      "billing",
      "bill",
      "budget",
      "guardrail",
    ],
    sectionHref: "/settings/integrations",
  },
];

/** Ranked fuzzy-ish match: score by how many keyword terms match the query. */
export function searchSettings(
  query: string,
  entries: SettingsSearchEntry[] = SETTINGS_SEARCH_ENTRIES,
): SettingsSearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);

  return entries
    .map((entry) => {
      const text = `${entry.label} ${entry.keywords.join(" ")}`.toLowerCase();
      const matches = tokens.filter((token) => text.includes(token)).length;
      // An exact phrase hit on a keyword weighs more than partial token hits.
      const phraseBonus = entry.keywords.some((k) =>
        q.length > 3 && k.toLowerCase().startsWith(q),
      ) ? 1 : 0;
      return { entry, score: matches + phraseBonus };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ entry }) => entry);
}
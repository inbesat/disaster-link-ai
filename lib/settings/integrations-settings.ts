// ---------------------------------------------------------------------
// lib/settings/integrations-settings.ts — Integrations (Phase 8 · Step 10).
//
// Pure model + sanitizer + localStorage accessors for the Integrations
// snapshot: weather API keys, failover priority, outgoing webhooks and
// monthly quotas / bill-shock protection. Mirrors the privacy-settings /
// org-settings pattern so every Integrations card reads and writes one
// consistent store that survives refresh during the demo.
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// Weather API keys (Phase 8 · Step 2)
// ---------------------------------------------------------------------

export type WeatherProviderId = "imd" | "openweather" | "glofas";

export type WeatherApiKeys = Record<WeatherProviderId, string>;

// ---------------------------------------------------------------------
// Outgoing webhooks (Phase 8 · Step 5)
// ---------------------------------------------------------------------

export type WebhookTriggerId = "alert" | "plan" | "resource";

export type IntegrationWebhook = {
  id: string;
  name: string;
  endpoint: string;
  /** Masked in the UI — stored only so a rotate/reveal is possible. */
  secret: string;
  triggers: WebhookTriggerId[];
  /** Relative display string, e.g. "2 min ago" — null when never pinged. */
  lastPing: string | null;
};

// ---------------------------------------------------------------------
// Quotas & bill-shock protection (Phase 8 · Step 8)
// ---------------------------------------------------------------------

export type QuotaUsage = { id: string; used: number; limit: number };

export type QuotaSettings = {
  /** Auto-disable service when quota hits 95% (bill-shock protection). */
  autoDisable: boolean;
  usage: QuotaUsage[];
};

// ---------------------------------------------------------------------
// Root snapshot
// ---------------------------------------------------------------------

export type IntegrationsSettings = {
  /** Live API keys for the weather ingestion providers (masked inputs). */
  weatherApiKeys: WeatherApiKeys;
  /** Failover order — the first healthy source wins the fetch. */
  weatherPriority: WeatherProviderId[];
  /** Outgoing event webhooks. */
  webhooks: IntegrationWebhook[];
  /** Monthly quota / bill-shock state. */
  quotas: QuotaSettings;
};

export const DRIP_INTEGRATIONS_SETTINGS_KEY = "drip_integrations_settings_v1";

export const DEFAULT_INTEGRATIONS_SETTINGS: IntegrationsSettings = {
  weatherApiKeys: { imd: "", openweather: "", glofas: "" },
  weatherPriority: ["imd", "openweather", "glofas"],
  webhooks: [
    {
      id: "wh-slack",
      name: "Slack Command Center Channel",
      endpoint: "https://hooks.slack.com/services/T0ABCDE/B0FGHIJ/redacted",
      secret: "whsec_SlackLive",
      triggers: ["alert", "plan"],
      lastPing: "2 min ago",
    },
    {
      id: "wh-gov",
      name: "State Gov Portal",
      endpoint: "https://api.sdma.bihar.gov.in/v1/disaster-events",
      secret: "whsec_StatePortal",
      triggers: ["alert", "resource"],
      lastPing: "1 hr ago",
    },
  ],
  quotas: {
    autoDisable: true,
    usage: [
      { id: "twilio", used: 850, limit: 1000 },
      { id: "openrouter", used: 120_000, limit: 500_000 },
    ],
  },
};

export function cloneDefaultIntegrationsSettings(): IntegrationsSettings {
  const d = DEFAULT_INTEGRATIONS_SETTINGS;
  return {
    weatherApiKeys: { ...d.weatherApiKeys },
    weatherPriority: [...d.weatherPriority],
    webhooks: d.webhooks.map((w) => ({ ...w, triggers: [...w.triggers] })),
    quotas: {
      autoDisable: d.quotas.autoDisable,
      usage: d.quotas.usage.map((u) => ({ ...u })),
    },
  };
}

const WEATHER_PROVIDER_IDS: WeatherProviderId[] = ["imd", "openweather", "glofas"];
const WEBHOOK_TRIGGERS: WebhookTriggerId[] = ["alert", "plan", "resource"];

function sanitizeWeatherApiKeys(raw: unknown): WeatherApiKeys {
  const out: WeatherApiKeys = { imd: "", openweather: "", glofas: "" };
  if (!raw || typeof raw !== "object") return out;
  const k = raw as Record<string, unknown>;
  for (const id of WEATHER_PROVIDER_IDS) {
    if (typeof k[id] === "string") out[id] = (k[id] as string).slice(0, 200);
  }
  return out;
}

function sanitizeWeatherPriority(raw: unknown): WeatherProviderId[] {
  if (!Array.isArray(raw)) {
    return [...DEFAULT_INTEGRATIONS_SETTINGS.weatherPriority];
  }
  const seen = new Set<WeatherProviderId>();
  const out: WeatherProviderId[] = [];
  for (const item of raw) {
    if (
      WEATHER_PROVIDER_IDS.includes(item as WeatherProviderId) &&
      !seen.has(item as WeatherProviderId)
    ) {
      seen.add(item as WeatherProviderId);
      out.push(item as WeatherProviderId);
    }
  }
  // Only accept a full, deduplicated permutation — anything else (missing
  // providers, junk ids) falls back to the shipped order.
  return out.length === WEATHER_PROVIDER_IDS.length
    ? out
    : [...DEFAULT_INTEGRATIONS_SETTINGS.weatherPriority];
}

function sanitizeWebhook(raw: unknown): IntegrationWebhook | null {
  if (!raw || typeof raw !== "object") return null;
  const w = raw as Record<string, unknown>;
  if (typeof w.id !== "string" || typeof w.name !== "string") return null;
  return {
    id: w.id.slice(0, 64),
    name: w.name.slice(0, 80),
    endpoint: typeof w.endpoint === "string" ? w.endpoint.slice(0, 300) : "",
    secret: typeof w.secret === "string" ? w.secret.slice(0, 200) : "",
    triggers: Array.isArray(w.triggers)
      ? w.triggers
          .filter(
            (t): t is WebhookTriggerId =>
              WEBHOOK_TRIGGERS.includes(t as WebhookTriggerId),
          )
          .slice(0, WEBHOOK_TRIGGERS.length)
      : [],
    lastPing: typeof w.lastPing === "string" ? w.lastPing.slice(0, 40) : null,
  };
}

function sanitizeQuotaUsage(raw: unknown): QuotaUsage[] {
  if (!Array.isArray(raw)) return [];
  const out: QuotaUsage[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const u = item as Record<string, unknown>;
    if (typeof u.id !== "string" || seen.has(u.id)) continue;
    const used =
      typeof u.used === "number" && Number.isFinite(u.used)
        ? Math.max(0, Math.round(u.used))
        : 0;
    const limit =
      typeof u.limit === "number" && Number.isFinite(u.limit)
        ? Math.max(1, Math.round(u.limit))
        : 1;
    seen.add(u.id);
    out.push({ id: u.id.slice(0, 40), used, limit });
  }
  return out;
}

/** Guarded merge — corrupt or partial snapshots never break Integrations. */
export function mergeIntegrationsSettings(raw: unknown): IntegrationsSettings {
  const base = cloneDefaultIntegrationsSettings();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Record<string, unknown>;
  const rawQuotas = data.quotas as Record<string, unknown> | undefined;

  return {
    weatherApiKeys: sanitizeWeatherApiKeys(data.weatherApiKeys),
    weatherPriority: sanitizeWeatherPriority(data.weatherPriority),
    // An explicitly stored array always wins — even empty — so webhooks the
    // user removed stay removed after refresh instead of being resurrected.
    webhooks: Array.isArray(data.webhooks)
      ? data.webhooks
          .map(sanitizeWebhook)
          .filter((w): w is IntegrationWebhook => w !== null)
      : base.webhooks,
    quotas: {
      autoDisable:
        rawQuotas && typeof rawQuotas.autoDisable === "boolean"
          ? rawQuotas.autoDisable
          : base.quotas.autoDisable,
      usage:
        rawQuotas && Array.isArray(rawQuotas.usage)
          ? sanitizeQuotaUsage(rawQuotas.usage)
          : base.quotas.usage,
    },
  };
}

export function readStoredIntegrationsSettings(): IntegrationsSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRIP_INTEGRATIONS_SETTINGS_KEY);
    if (!raw) return null;
    return mergeIntegrationsSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeStoredIntegrationsSettings(settings: IntegrationsSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRIP_INTEGRATIONS_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // storage full / blocked — ignore for the demo
  }
}

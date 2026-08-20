// ---------------------------------------------------------------------
// lib/broadcast/rds-encoder.ts — Phase 6 · RDS (Radio Data System)
// scrolling-text integration.
//
// Pushes emergency text to RDS-enabled FM receivers (car radios, phones
// with FM). RDS capabilities this module uses:
//
//   • PS  (Program Service) — 8-char station name (left to the encoder)
//   • RT  (Radio Text)      — 64 chars of scrolling text — THIS is ours
//   • PTY (Program Type)    — some encoders set "News"/"Alarm" — out of
//     scope here (no universal API surface)
//   • EAS — advanced encoders only, no standard HTTP API — out of scope
//
// Content: severity-tuned templates (Critical / Warning / Watch), each
// smart-truncated to 64 chars prioritising DISASTER TYPE + LOCATION +
// ACTION (reusing lib/broadcast/rds-text.ts). Confirmation: some
// encoders echo the live text or a "confirmed" flag back — that feedback
// is parsed and logged to fm_broadcast_logs by the caller.
// ---------------------------------------------------------------------

import type { FmStation } from "@prisma/client";
import { buildRdsText, truncateSmart, RDS_MAX_CHARS } from "./rds-text";
import { isUsableUrl } from "./strategies/cap-api";

/** The three severity tiers the RDS templates cover. */
export type RdsSeverity = "critical" | "warning" | "watch";

/**
 * CAP 1.2 severity → RDS tier. Unknown/blank stays on "warning" rather
 * than the lowest tier — an event whose severity wasn't recorded must not
 * be under-warned on the radio.
 */
export function mapCapSeverity(capSeverity: string | null | undefined): RdsSeverity {
  const normalized = (capSeverity ?? "").trim();
  if (normalized === "Extreme" || normalized === "Severe") return "critical";
  if (normalized === "Moderate") return "warning";
  if (normalized === "Minor") return "watch";
  return "warning"; // Unknown / blank
}

/** Display label for a disaster type on the scrolling display. */
export function rdsDisasterLabel(disasterType: string | null | undefined): string {
  const key = (disasterType ?? "").trim().toLowerCase();
  switch (key) {
    case "flood":
      return "FLOOD";
    case "cyclone":
      return "CYCLONE";
    case "earthquake":
      return "EARTHQUAKE";
    case "heatwave":
      return "HEATWAVE";
    default:
      return key ? key.toUpperCase() : "EMERGENCY";
  }
}

/** Default national emergency helpline for the "Call {helpline}" action. */
const DEFAULT_HELPLINE = "1070";

/**
 * Severity templates. {disaster}/{district} render UPPERCASE for radio
 * readability; {helpline} defaults to the national disaster helpline 1070.
 */
const SEVERITY_TEMPLATES: Record<RdsSeverity, string> = {
  critical: "EVACUATE NOW: {disaster} in {district}. Go to shelter. Call {helpline}",
  warning: "WARNING: {disaster} expected in {district}. Stay alert. Tune for updates.",
  watch: "WATCH: {disaster} conditions in {district}. Monitor local news.",
};

export interface SeverityRdsInput {
  severity: RdsSeverity;
  disasterType: string | null | undefined;
  district: string | null | undefined;
  helpline?: string;
}

/** Build a ≤64-char severity-tuned RDS text. */
export function buildSeverityRdsText(input: SeverityRdsInput): string {
  const template = SEVERITY_TEMPLATES[input.severity];
  const rendered = template
    .replace("{disaster}", rdsDisasterLabel(input.disasterType))
    .replace("{district}", (input.district ?? "").trim().toUpperCase() || "YOUR AREA")
    .replace("{helpline}", input.helpline?.trim() || DEFAULT_HELPLINE);
  return truncateSmart(rendered, RDS_MAX_CHARS);
}

export interface EmergencyRdsInput {
  severity?: RdsSeverity | null;
  /** Disaster type — known types (flood/cyclone/…) use severity templates. */
  disasterType?: string | null;
  district?: string | null;
  helpline?: string;
  /** Fallback inputs (used when the disaster type isn't template-covered). */
  headline?: string;
  instruction?: string;
  script?: string;
}

/**
 * The dispatch-path text builder: severity templates for known disaster
 * types, otherwise the generic lib/broadcast/rds-text.ts fallback.
 */
export function buildEmergencyRdsText(input: EmergencyRdsInput): string {
  const key = (input.disasterType ?? "").trim().toLowerCase();
  if (["flood", "cyclone", "earthquake", "heatwave"].includes(key) && input.severity) {
    return buildSeverityRdsText({
      severity: input.severity,
      disasterType: key,
      district: input.district,
      helpline: input.helpline,
    });
  }
  return buildRdsText({
    event: input.disasterType ?? "Emergency",
    district: input.district ?? "",
    headline: input.headline ?? "",
    instruction: input.instruction ?? "",
    script: input.script,
  });
}

/** The subset of a station the encoder needs. */
export type RdsStationLike = Pick<
  FmStation,
  "id" | "name" | "rdsEnabled" | "rdsApiEndpoint"
>;

export interface RdsPushResult {
  ok: boolean;
  /** True when the encoder echoed/confirmed the live text. */
  confirmed: boolean;
  responseCode: number;
  responseBody: string;
  error?: string;
}

/**
 * Pure confirmation check — the encoder "confirms" when its response
 * echoes the sent text (the encoder's own truncation allowed) or carries
 * a live/active keyword. Unit-tested.
 */
export function parseRdsConfirmation(responseBody: string, sentText: string): boolean {
  const body = responseBody.toLowerCase();
  if (/confirmed|live|active|playing|broadcasting/i.test(body)) return true;
  const sent = sentText.toLowerCase().slice(0, 32);
  return sent.length > 8 && body.includes(sent);
}

/** Optional routing fields some multi-station encoder hosts require. */
export interface RdsPushContext {
  stationId?: string;
  alertId?: string;
}

/**
 * Push a scrolling RDS text to a station's encoder API.
 *
 * @param station         RDS-enabled station with a usable rds_api_endpoint.
 * @param text            The message — smart-truncated to 64 chars here.
 * @param durationMinutes How long the text stays on-air (min 1 minute).
 * @param context         Optional station/alert ids for multi-station hosts.
 */
export async function sendRDSText(
  station: RdsStationLike,
  text: string,
  durationMinutes: number,
  context: RdsPushContext = {},
): Promise<RdsPushResult> {
  if (!station.rdsEnabled) {
    return {
      ok: false,
      confirmed: false,
      responseCode: 0,
      responseBody: "Station is not RDS-enabled.",
      error: "Not an RDS station",
    };
  }
  const endpoint = station.rdsApiEndpoint;
  if (!endpoint || !isUsableUrl(endpoint)) {
    return {
      ok: false,
      confirmed: false,
      responseCode: 0,
      responseBody: "No usable rds_api_endpoint (http/https expected).",
      error: "Unusable RDS endpoint",
    };
  }

  const rdsText = truncateSmart(text.trim(), RDS_MAX_CHARS);
  const payload = {
    rds_text: rdsText,
    duration_minutes: Math.max(1, Math.floor(durationMinutes)),
    ...(context.stationId ? { station_id: context.stationId } : {}),
    ...(context.alertId ? { alert_id: context.alertId } : {}),
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FM_BROADCAST_TOKEN ?? "demo-fm-broadcast-token"}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    const body = (await response.text()).slice(0, 500);
    if (!response.ok) {
      return {
        ok: false,
        confirmed: false,
        responseCode: response.status,
        responseBody: body,
        error: `RDS encoder rejected (${response.status}): ${body}`,
      };
    }

    return {
      ok: true,
      confirmed: parseRdsConfirmation(body, rdsText),
      responseCode: response.status,
      responseBody: body,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      confirmed: false,
      responseCode: 0,
      responseBody: message.slice(0, 500),
      error: message,
    };
  }
}

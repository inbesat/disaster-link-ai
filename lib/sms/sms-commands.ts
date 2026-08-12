// ---------------------------------------------------------------------
// lib/sms/sms-commands.ts — Phase 13 · Step 4 · SMS webhook logic.
//
// Pure helpers behind app/api/webhooks/sms/route.ts — parsing Twilio's
// form-encoded POST, normalising the citizen's command, building the
// TwiML reply, and composing the reply texts from the shared lite-status
// data. Everything is unit-testable in the node vitest env; the route
// only wires these to Prisma + HTTP.
// ---------------------------------------------------------------------

import { getLiteStatus } from "@/lib/mock-data/lite-status";
import type { SafetyStatus } from "@/lib/mock-data/hazard-zones";

/** Risk wording per SafetyStatus (used by /lite + the SMS STATUS reply). */
export type LiteRiskLabels = Record<SafetyStatus, { label: string; smsWord: string }>;

/**
 * The subset of Twilio's inbound-webhook POST fields (SMS / WhatsApp /
 * voice). All optional: a voice-call GET carries no form body, so a
 * parsed form must never fabricate fields — validateRequest signatures
 * are computed over EXACTLY the fields Twilio sent.
 */
export type TwilioSmsForm = {
  /** Message body as typed by the citizen (SMS/WhatsApp). */
  Body?: string;
  /** Sender number in E.164, e.g. "+919876543210". */
  From?: string;
  /** The Twilio number the SMS was sent to. */
  To?: string;
  /** Twilio's message SID. */
  MessageSid?: string;
  [key: string]: string | undefined;
};

/**
 * Decode Twilio's application/x-www-form-urlencoded POST body. Twilio
 * URL-encodes values; keys are case-sensitive as sent (Body, From, …).
 */
export function parseSmsForm(rawBody: string): TwilioSmsForm {
  // Start empty — an empty body is a form with NO fields, and fabricating
  // keys would break signature validation (params must match exactly).
  const out: TwilioSmsForm = {};
  for (const pair of rawBody.split("&")) {
    if (!pair) continue;
    const eq = pair.indexOf("=");
    const key = eq === -1 ? pair : pair.slice(0, eq);
    const value = eq === -1 ? "" : pair.slice(eq + 1);
    try {
      out[decodeURIComponent(key.replace(/\+/g, " "))] = decodeURIComponent(
        value.replace(/\+/g, " "),
      );
    } catch {
      // Malformed percent-encoding (e.g. %ZZ) — skip the pair rather than
      // throw; the command still resolves from whatever parsed cleanly.
    }
  }
  return out;
}

/** Recognised SMS commands (case-insensitive, punctuation-tolerant). */
export type SmsCommand = "STATUS" | "SAFE" | "SHELTER" | "ROUTE" | "HELP";

/**
 * Normalise a citizen's message to a known command. Trims, uppercases and
 * strips common punctuation ("status!", "safe.", "HELP" all match).
 */
export function normalizeSmsCommand(body: string): SmsCommand | null {
  const cleaned = body
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned === "STATUS") return "STATUS";
  if (cleaned === "SAFE") return "SAFE";
  if (cleaned === "SHELTER" || cleaned === "SHELTERS" || cleaned === "NEAREST") return "SHELTER";
  if (cleaned === "ROUTE" || cleaned === "DIRECTIONS" || cleaned === "EVACUATE") return "ROUTE";
  if (cleaned === "HELP" || cleaned === "COMMANDS" || cleaned === "MENU") return "HELP";
  return null;
}

/**
 * Normalise an E.164 (or loose) phone number for DB matching: the last 10
 * digits, which is the stable identity across "+91…", "91…" and "0…" forms.
 */
export function normalizePhoneForMatch(from: string): string {
  const digits = from.replace(/\D/g, "");
  return digits.slice(-10);
}

/** Escape text for embedding in XML (TwiML is XML). */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Wrap a message in a Twilio TwiML <Response><Message> document. The
 * webhook returns this with Content-Type: text/xml.
 */
export function buildTwiML(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response><Message>${escapeXml(message)}</Message></Response>`;
}

/** "STATUS" reply — current risk + nearest shelter from lite-status. */
export function statusReplyMessage(): string {
  const s = getLiteStatus();
  return `Bharat Shakti: ${s.district} is under ${s.riskSmsWord}. Nearest shelter: ${s.shelter.name}, ${s.shelterDistanceKm}km away. Call 1070 for help.`;
}

/** "SHELTER" reply — nearest shelter details with facilities. */
export function shelterReplyMessage(): string {
  const s = getLiteStatus();
  const facilities: string[] = [];
  if (s.shelter.medical) facilities.push("medical");
  if (s.shelter.food) facilities.push("food");
  const facStr = facilities.length ? ` Facilities: ${facilities.join(", ")}.` : "";
  const pct = Math.round((s.shelter.occupancy / s.shelter.capacity) * 100);
  const status = pct >= 100 ? "FULL" : pct >= 80 ? "FILLING" : "OPEN";
  return `Nearest shelter: ${s.shelter.name} (${s.shelterDistanceKm}km).${facStr} Status: ${status} (${pct}% full). Reply ROUTE for directions.`;
}

/** "ROUTE" reply — evacuation guidance. */
export function routeReplyMessage(): string {
  const s = getLiteStatus();
  return `Evacuation route to ${s.shelter.name}: ${s.shelterDistanceKm}km via main roads. Avoid flooded streets. Walk if water is below knee level. Call 1070 for rescue.`;
}

/** "SAFE" reply (sent after the DB status update succeeds). */
export const SAFE_REPLY =
  "Your status is marked SAFE. Family members have been notified.";

/** Fallback when the SAFE status could not be recorded (e.g. DB down). */
export const SAFE_FAILED_REPLY =
  "Could not update your status right now. Call 1070 for help.";

/** Reply when the From number is not a registered citizen. */
export const NOT_REGISTERED_REPLY =
  "Number not registered with Bharat Shakti. Reply HELP for options.";

/** "HELP" / unknown-command reply. */
export function helpReplyMessage(): string {
  return `Reply: STATUS (risk + shelter), SHELTER (nearest shelter details), ROUTE (evacuation guidance), SAFE (mark yourself safe + notify family).`;
}

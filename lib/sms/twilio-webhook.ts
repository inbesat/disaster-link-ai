// ---------------------------------------------------------------------
// lib/sms/twilio-webhook.ts — Phase 13 · Steps 4–6 · Shared Twilio
// inbound-webhook helpers.
//
// The three inbound Twilio endpoints (SMS / voice IVR / WhatsApp) share
// the same HTTP contract, so the plumbing lives here:
//
//   • verifyTwilioSignature — HMAC check (403 on forged/unsigned requests
//     when a token is configured). Canonical-URL aware: behind a proxy the
//     incoming request.url can differ from the URL Twilio signed, so when
//     NEXT_PUBLIC_SITE_URL is set the canonical URL is rebuilt from it.
//   • TWI_ML_HEADERS — text/xml response headers every TwiML reply needs.
//   • buildVoiceAlertTwiml — the IVR <Say> + <Pause> + repeat document.
// ---------------------------------------------------------------------

import { NextRequest } from "next/server";
import twilio from "twilio";
import type { TwilioSmsForm } from "@/lib/sms/sms-commands";

/** TwiML responses are XML, exactly as Twilio requires. */
export const TWI_ML_HEADERS = { "Content-Type": "text/xml; charset=utf-8" };

export type SignatureCheck = { ok: true; reason: string } | { ok: false; reason: string };

/**
 * Verify the request came from Twilio when credentials are configured.
 * With no token configured (local dev) the check passes through, matching
 * the lazy-init convention in lib/alerts/twilio-client.ts.
 */
/** Warn once when signatures are unverifiable (missing token) so a
 * misconfigured production env is never silently unauthenticated. */
let warnedNoToken = false;

function warnNoTokenOnce() {
  if (warnedNoToken) return;
  warnedNoToken = true;
  console.warn(
    "[twilio-webhook] TWILIO_AUTH_TOKEN not configured — skipping webhook " +
      "signature validation. Set it in production or webhooks are open to abuse.",
  );
}

export function verifyTwilioSignature(
  request: NextRequest,
  form: TwilioSmsForm,
): SignatureCheck {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    warnNoTokenOnce();
    // In production, fail closed when no token is configured
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "no-token-configured-production" };
    }
    return { ok: true, reason: "no-token-configured-dev" };
  }
  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return { ok: false, reason: "missing-signature" };

  // Twilio signs the EXACT public URL it called, query string included
  // (voice webhooks are GETs carrying ?CallSid=…&From=…). Behind a proxy
  // the incoming request.url can differ, so when a site origin is
  // configured (same env as the next.config CORS allow list) rebuild the
  // canonical URL from it — keeping the query string; otherwise trust
  // request.url.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const canonicalUrl = siteUrl
    ? `${siteUrl.replace(/\/$/, "")}${request.nextUrl.pathname}${request.nextUrl.search}`
    : request.url;

  // validateRequest needs a plain string map (no undefined values).
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(form)) {
    if (value !== undefined) params[key] = value;
  }

  const valid = twilio.validateRequest(authToken, signature, canonicalUrl, params);
  return valid ? { ok: true, reason: "valid" } : { ok: false, reason: "invalid" };
}

/**
 * The IVR emergency-alert script (Phase 13 · Step 5): the critical message
 * spoken once, a 2-second pause, then repeated so a distracted listener
 * gets a second chance to catch it. Polly.Aditi = Amazon's Indian-English
 * voice, intelligible to the widest audience.
 */
export const VOICE_ALERT_MESSAGE =
  "This is a critical emergency alert from the Disaster Management Authority. Flood waters are rising in your area. Please evacuate immediately.";

export function buildVoiceAlertTwiml(message: string = VOICE_ALERT_MESSAGE): string {
  const say = `<Say voice="Polly.Aditi" language="en-IN">${escapeXml(message)}</Say>`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>${say}<Pause length="2"/>${say}</Response>`;
}

/** Escape text for embedding in XML (TwiML is XML). */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ---------------------------------------------------------------------
// lib/alerts/twilio-client.ts
// Thin, safe wrapper around the Twilio SDK for sending SMS warnings.
//
// The client is lazily initialised so importing this module never throws
// when Twilio env vars are absent. All send failures (including hitting
// free-trial limits) are caught and logged so the wider app never crashes.
// ---------------------------------------------------------------------

import twilio from "twilio";
import { isDemoMode } from "@/lib/demo-mode";
import { safeLog } from "@/lib/logger";

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
// Keep the TWILIO_PHONE_NUMBER env name (current convention) but also accept
// the legacy TWILIO_FROM_NUMBER key found in older .env stubs.
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER ?? process.env.TWILIO_FROM_NUMBER;

type TwilioClient = ReturnType<typeof twilio>;

let cachedClient: TwilioClient | null = null;

function getClient(): TwilioClient | null {
  if (cachedClient) return cachedClient;
  if (!ACCOUNT_SID || !AUTH_TOKEN) return null;
  cachedClient = twilio(ACCOUNT_SID, AUTH_TOKEN);
  return cachedClient;
}

export type SendSmsResult = { ok: true; sid: string } | { ok: false; error: string };

export async function sendSMSAlert(
  toNumber: string,
  messageBody: string,
): Promise<SendSmsResult> {
  // Phase 24 · Demo mode: never touch the Twilio API (saves trial credits).
  // Returns a fake success so the alert pipeline (delivery tracking, audit
  // logs) keeps flowing end-to-end during the demo.
  if (isDemoMode()) {
    safeLog("info", "DEMO MODE: SMS bypassed", { metadata: { to: toNumber } });
    return { ok: true, sid: "demo-bypass" };
  }

  const client = getClient();

  if (!client) {
    safeLog("warn", "[twilio] SMS not sent: TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not configured.");
    return { ok: false, error: "Twilio not configured" };
  }

  if (!FROM_NUMBER) {
    safeLog("warn", "[twilio] SMS not sent: no TWILIO_PHONE_NUMBER configured.");
    return { ok: false, error: "Twilio sender number not configured" };
  }

  try {
    const message = await client.messages.create({
      from: FROM_NUMBER,
      to: toNumber,
      body: messageBody,
    });
    safeLog("info", `[twilio] SMS sent (sid=${message.sid})`, { metadata: { sid: message.sid, to: toNumber } });
    return { ok: true, sid: message.sid };
  } catch (error: unknown) {
    // Includes trial-credit exhaustion and quota errors — never throw.
    safeLog("error", "[twilio] SMS send failed", { metadata: { error: String(error) } });
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ---------------------------------------------------------------------
// Voice calls (Phase 5 · IVR fallback to FM station control rooms).
// Same lazy client + demo-mode bypass conventions as sendSMSAlert.
// ---------------------------------------------------------------------

export type VoiceCallResult =
  { ok: true; callSid: string } | { ok: false; error: string };

export interface VoiceCallInput {
  /** E.164 destination — the station control-room number. */
  to: string;
  /** The full TwiML document the call should play. */
  twiml: string;
  /** Absolute URL that receives call-status callbacks (optional). */
  statusCallbackUrl?: string;
}

/**
 * Place an outbound voice call that plays the supplied TwiML.
 * Never throws — returns a result so callers can log/retry.
 */
export async function placeVoiceCall(input: VoiceCallInput): Promise<VoiceCallResult> {
  if (isDemoMode()) {
    safeLog("info", "DEMO MODE: voice call bypassed", { metadata: { to: input.to } });
    return { ok: true, callSid: "demo-bypass" };
  }

  const client = getClient();
  if (!client) {
    safeLog("warn", "[twilio] Voice call not placed: TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not configured.");
    return { ok: false, error: "Twilio not configured" };
  }
  if (!FROM_NUMBER) {
    safeLog("warn", "[twilio] Voice call not placed: no TWILIO_PHONE_NUMBER configured.");
    return { ok: false, error: "Twilio sender number not configured" };
  }

  try {
    const call = await client.calls.create({
      to: input.to,
      from: FROM_NUMBER,
      twiml: input.twiml,
      ...(input.statusCallbackUrl
        ? {
            statusCallback: input.statusCallbackUrl,
            statusCallbackEvent: [
              "initiated",
              "ringing",
              "answered",
              "completed",
              "busy",
              "failed",
              "no-answer",
            ] as const,
            statusCallbackMethod: "POST" as const,
          }
        : {}),
    });
    safeLog("info", `[twilio] Voice call placed (sid=${call.sid})`, { metadata: { sid: call.sid, to: input.to } });
    return { ok: true, callSid: call.sid };
  } catch (error: unknown) {
    safeLog("error", "[twilio] Voice call failed", { metadata: { error: String(error) } });
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

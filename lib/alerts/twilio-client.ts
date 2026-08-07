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
    console.log(`DEMO MODE: SMS bypassed (to ${toNumber})`);
    return { ok: true, sid: "demo-bypass" };
  }

  const client = getClient();

  if (!client) {
    console.warn(
      "[twilio] SMS not sent: TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not configured.",
    );
    return { ok: false, error: "Twilio not configured" };
  }

  if (!FROM_NUMBER) {
    console.warn("[twilio] SMS not sent: no TWILIO_PHONE_NUMBER configured.");
    return { ok: false, error: "Twilio sender number not configured" };
  }

  try {
    const message = await client.messages.create({
      from: FROM_NUMBER,
      to: toNumber,
      body: messageBody,
    });
    console.log(`[twilio] SMS sent (sid=${message.sid}) to ${toNumber}`);
    return { ok: true, sid: message.sid };
  } catch (error) {
    // Includes trial-credit exhaustion and quota errors — never throw.
    console.error("[twilio] SMS send failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

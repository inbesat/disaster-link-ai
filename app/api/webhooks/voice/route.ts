// ---------------------------------------------------------------------
// app/api/webhooks/voice/route.ts — Phase 13 · Step 5 · Voice Call IVR
// Alerts.
//
// Twilio dials a citizen and requests this endpoint's TwiML (GET or POST)
// to decide what the call says. It returns the critical alert script:
//
//   <Response>
//     <Say voice="Polly.Aditi" language="en-IN">
//       This is a critical emergency alert from the Disaster Management
//       Authority. Flood waters are rising in your area. Please evacuate
//       immediately.
//     </Say>
//     <Pause length="2"/>
//     <Say voice="Polly.Aditi" language="en-IN">… same message …</Say>
//   </Response>
//
// The 2-second pause + repeat gives a distracted listener a second chance
// to catch the evacuation instruction. The same Twilio signature
// validation guards this endpoint as the SMS/WhatsApp webhooks.
// ---------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { parseSmsForm } from "@/lib/sms/sms-commands";
import {
  buildVoiceAlertTwiml,
  TWI_ML_HEADERS,
  verifyTwilioSignature,
} from "@/lib/sms/twilio-webhook";

/** Twilio needs a long-lived runtime — no edge. */
export const runtime = "nodejs";
/** Webhooks must never be statically cached or revalidated. */
export const dynamic = "force-dynamic";

/** Twilio requests the call's TwiML via GET or POST. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleVoice(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleVoice(request);
}

async function handleVoice(request: NextRequest) {
  // Twilio may append call metadata as form params on POST (and query
  // params on GET) — parse what we can for the signature check. An empty
  // body parses to an empty form (never fabricate fields).
  const raw = await request.text().catch(() => "");
  const form = parseSmsForm(raw);

  const verification = verifyTwilioSignature(request, form);
  if (!verification.ok) {
    return NextResponse.json({ ok: false, error: "Invalid Twilio signature." }, {
      status: 403,
    });
  }

  return new NextResponse(buildVoiceAlertTwiml(), {
    status: 200,
    headers: TWI_ML_HEADERS,
  });
}

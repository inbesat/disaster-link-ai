// ---------------------------------------------------------------------
// app/api/webhooks/whatsapp/route.ts — Phase 13 · Step 6 · WhatsApp Bot
// Integration.
//
// Many Indians rely entirely on WhatsApp — this endpoint handles inbound
// WhatsApp messages Twilio forwards (application/x-www-form-urlencoded
// POST, same contract as the SMS webhook) and replies over WhatsApp via
// TwiML <Message>:
//
//   SHELTER → nearest shelter with WhatsApp *bold* formatting
//   HELP    → nearest shelter + a Google Maps link to walk there
//   <other> → command menu
//
// The same Twilio signature validation guards this endpoint.
// ---------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { buildTwiML, parseSmsForm } from "@/lib/sms/sms-commands";
import {
  TWI_ML_HEADERS,
  verifyTwilioSignature,
} from "@/lib/sms/twilio-webhook";
import {
  normalizeWhatsappCommand,
  whatsappHelpReply,
  whatsappMenuReply,
  whatsappShelterReply,
} from "@/lib/sms/whatsapp-commands";

/** Twilio needs a long-lived runtime — no edge. */
export const runtime = "nodejs";
/** Webhooks must never be statically cached or revalidated. */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const form = parseSmsForm(rawBody);

  const verification = verifyTwilioSignature(request, form);
  if (!verification.ok) {
    return NextResponse.json({ ok: false, error: "Invalid Twilio signature." }, {
      status: 403,
    });
  }

  const command = normalizeWhatsappCommand(form.Body ?? "");
  let reply: string;
  switch (command) {
    case "SHELTER":
      reply = whatsappShelterReply();
      break;
    case "HELP":
      reply = whatsappHelpReply();
      break;
    default:
      reply = whatsappMenuReply();
      break;
  }

  return new NextResponse(buildTwiML(reply), {
    status: 200,
    headers: TWI_ML_HEADERS,
  });
}

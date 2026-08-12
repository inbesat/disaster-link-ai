// ---------------------------------------------------------------------
// app/api/webhooks/sms/route.ts — Phase 13 · Step 4 · SMS Fallback
// Webhook (Twilio).
//
// For citizens with NO internet — only cellular SMS. Twilio POSTs inbound
// SMS here (application/x-www-form-urlencoded) and expects a TwiML reply
// (text/xml) that it sends back to the sender:
//
//   STATUS  → current district risk + nearest shelter (from lite-status)
//   SAFE    → updates the citizen's safetyStatus in the database and
//             confirms to the sender
//   HELP    → lists the available commands
//   <other> → treated as HELP
//
// Security: when TWILIO_AUTH_TOKEN is configured AND the request carries
// the x-twilio-signature header, the request is verified with Twilio's
// validateRequest helper (HMAC over the full URL + sorted params). Without
// the token (local dev) the check is skipped, mirroring the lazy-init
// convention in lib/alerts/twilio-client.ts — never fail-closed on a cold
// start with no credentials.
// ---------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import {
  buildTwiML,
  normalizePhoneForMatch,
  normalizeSmsCommand,
  parseSmsForm,
  statusReplyMessage,
  shelterReplyMessage,
  routeReplyMessage,
  SAFE_REPLY,
  SAFE_FAILED_REPLY,
  NOT_REGISTERED_REPLY,
  helpReplyMessage,
} from "@/lib/sms/sms-commands";
import {
  TWI_ML_HEADERS,
  verifyTwilioSignature,
} from "@/lib/sms/twilio-webhook";

/** Twilio needs a long-lived runtime — no edge. */
export const runtime = "nodejs";
/** Webhooks must never be statically cached or revalidated. */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // SAFE — record the citizen's status in the database so family and
  // responders can see it (mirrors the in-app "I am safe" flow).
  const recordSafeStatus = async (from: string) => {
    const last10 = normalizePhoneForMatch(from);
    try {
      // A null phone can never satisfy endsWith, so no null filter needed.
      const user = await prisma.user.findFirst({
        where: { phone: { endsWith: last10 } },
      });
      if (!user) return NOT_REGISTERED_REPLY;
      await prisma.user.update({
        where: { id: user.id },
        data: { safetyStatus: "safe", lastSafeAt: new Date() },
      });
      return SAFE_REPLY;
    } catch (error) {
      // DB unreachable (dev cold start) — never 500 Twilio; reply honestly.
      console.error("[sms-webhook] failed to record SAFE status:", error);
      return SAFE_FAILED_REPLY;
    }
  };

  try {
    const form = parseSmsForm(rawBody);
    const verification = verifyTwilioSignature(request, form);
    if (!verification.ok) {
      return NextResponse.json({ ok: false, error: "Invalid Twilio signature." }, {
        status: 403,
      });
    }

    const command = normalizeSmsCommand(form.Body ?? "");
    let reply: string;
    switch (command) {
      case "STATUS":
        reply = statusReplyMessage();
        break;
      case "SHELTER":
        reply = shelterReplyMessage();
        break;
      case "ROUTE":
        reply = routeReplyMessage();
        break;
      case "SAFE":
        reply = await recordSafeStatus(form.From ?? "");
        break;
      default:
        reply = helpReplyMessage();
        break;
    }

    return new NextResponse(buildTwiML(reply), {
      status: 200,
      headers: TWI_ML_HEADERS,
    });
  } catch (error) {
    // A malformed body must never bubble up as an HTML 500 — Twilio shows
    // the response body to the sender.
    console.error("[sms-webhook] failed to handle SMS:", error);
    return new NextResponse(buildTwiML(helpReplyMessage()), {
      status: 200,
      headers: TWI_ML_HEADERS,
    });
  }
}

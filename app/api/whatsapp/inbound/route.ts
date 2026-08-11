// ---------------------------------------------------------------------
// app/api/whatsapp/inbound/route.ts — Phase 1 · Step 3 · WhatsApp
// Business Inbound Webhook.
//
// Citizens get disaster info over standard WhatsApp messaging. Twilio
// forwards inbound WhatsApp messages here (application/x-www-form-urlencoded
// POST, same contract as the SMS webhook) and this route answers with the
// TwiML <Message> Twilio sends back over WhatsApp:
//
//   STATUS  → current flood risk for their area (from the shared hazard
//             table, via lite-status)
//   SHELTER → the top 3 nearest shelters with distances
//   ROUTE   → a Google Maps deep link for evacuation
//   SAFE    → records the citizen's safetyStatus in the DB and confirms
//             ("Status marked safe. Family notified.")
//   HELP    → triggers the backend SOS flow (persists a danger status)
//   <other> → command menu
//
// Same Twilio signature validation guards this endpoint (403 on forged
// requests when a token is configured), same lazy-init behaviour in dev.
// ---------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import {
  buildTwiML,
  normalizePhoneForMatch,
  parseSmsForm,
} from "@/lib/sms/sms-commands";
import {
  TWI_ML_HEADERS,
  verifyTwilioSignature,
} from "@/lib/sms/twilio-webhook";
import {
  normalizeWhatsappCommand,
  whatsappMenuReply,
  whatsappRouteReply,
  whatsappSheltersTop3Reply,
  whatsappSosReply,
  whatsappStatusReply,
  WHATSAPP_SAFE_REPLY,
} from "@/lib/sms/whatsapp-commands";

/** Twilio needs a long-lived runtime — no edge. */
export const runtime = "nodejs";
/** Webhooks must never be statically cached or revalidated. */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const form = parseSmsForm(rawBody);

    const verification = verifyTwilioSignature(request, form);
    if (!verification.ok) {
      return NextResponse.json(
        { ok: false, error: "Invalid Twilio signature." },
        { status: 403 },
      );
    }

    const from = form.From ?? "";
    const last10 = normalizePhoneForMatch(from);

    // SAFE — persist the citizen's safe status so family + responders can
    // see it (mirrors the in-app "I am safe" flow and the SMS webhook).
    const recordSafeStatus = async () => {
      try {
        const user = await prisma.user.findFirst({
          where: { phone: { endsWith: last10 } },
        });
        if (!user) return whatsappMenuReply();
        await prisma.user.update({
          where: { id: user.id },
          data: { safetyStatus: "safe", lastSafeAt: new Date() },
        });
        return WHATSAPP_SAFE_REPLY;
      } catch (error) {
        console.error("[whatsapp-inbound] failed to record SAFE status:", error);
        return "Could not update your status right now. Call 1070 for help.";
      }
    };

    // HELP — trigger the backend SOS flow. In the demo this persists a
    // danger status (the same field the SOS banner reads); a real build
    // would fan out to nearby units + the control room.
    const triggerSosFlow = async () => {
      try {
        const user = await prisma.user.findFirst({
          where: { phone: { endsWith: last10 } },
        });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { safetyStatus: "danger" },
          });
        }
        return whatsappSosReply();
      } catch (error) {
        console.error("[whatsapp-inbound] failed to trigger SOS flow:", error);
        return "Could not raise your SOS right now. Call 1070 for help.";
      }
    };

    const command = normalizeWhatsappCommand(form.Body ?? "");
    let reply: string;
    switch (command) {
      case "STATUS":
        reply = whatsappStatusReply();
        break;
      case "SHELTER":
        reply = whatsappSheltersTop3Reply();
        break;
      case "ROUTE":
        reply = whatsappRouteReply();
        break;
      case "SAFE":
        reply = await recordSafeStatus();
        break;
      case "HELP":
        reply = await triggerSosFlow();
        break;
      default:
        reply = whatsappMenuReply();
        break;
    }

    return new NextResponse(buildTwiML(reply), {
      status: 200,
      headers: TWI_ML_HEADERS,
    });
  } catch (error) {
    console.error("[whatsapp-inbound] failed to handle WhatsApp message:", error);
    return new NextResponse(buildTwiML(whatsappMenuReply()), {
      status: 200,
      headers: TWI_ML_HEADERS,
    });
  }
}

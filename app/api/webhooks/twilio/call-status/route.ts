// ---------------------------------------------------------------------
// app/api/webhooks/twilio/call-status/route.ts — Phase 5 · IVR call
// completion status.
//
// Twilio POSTs the lifecycle of every outbound control-room call here
// (initiated → ringing → answered → completed, or busy / failed /
// no-answer). We match the CallSid against fm_broadcast_logs.external_ref
// and move the log's status: completed → delivered (broadcast_time set),
// busy/failed/no-answer → failed, in-progress states → retrying.
//
// Same Twilio signature validation as the SMS/WhatsApp/voice webhooks.
// ---------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { parseSmsForm } from "@/lib/sms/sms-commands";
import { TWI_ML_HEADERS, verifyTwilioSignature } from "@/lib/sms/twilio-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Terminal statuses that finalise a call. */
const FINAL_OK = new Set(["completed"]);
const FINAL_FAIL = new Set(["busy", "failed", "no-answer", "canceled"]);

/** Map a Twilio call status onto an fm_broadcast_log status. */
function mapCallStatus(status: string): "delivered" | "failed" | "retrying" {
  if (FINAL_OK.has(status)) return "delivered";
  if (FINAL_FAIL.has(status)) return "failed";
  return "retrying"; // initiated / ringing / answered / in-progress
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const raw = await request.text().catch(() => "");
  const form = parseSmsForm(raw);

  const verification = verifyTwilioSignature(request, form);
  if (!verification.ok) {
    return NextResponse.json(
      { ok: false, error: "Invalid Twilio signature." },
      { status: 403 },
    );
  }

  const callSid = form.CallSid;
  const callStatus = form.CallStatus;
  if (!callSid || !callStatus) {
    return NextResponse.json(
      { ok: false, error: "CallSid and CallStatus are required." },
      { status: 400 },
    );
  }

  try {
    const log = await prisma.fmBroadcastLog.findFirst({
      where: { externalRef: callSid },
    });

    if (!log) {
      // Unknown CallSid — acknowledge so Twilio stops retrying the callback.
      console.warn(`[twilio] call-status for unknown CallSid ${callSid}`);
      return new NextResponse("<Response/>", { status: 200, headers: TWI_ML_HEADERS });
    }

    const mapped = mapCallStatus(callStatus);
    await prisma.fmBroadcastLog.update({
      where: { id: log.id },
      data: {
        status: mapped,
        responseCode: mapped === "delivered" ? 200 : (log.responseCode ?? 0),
        responseBody: `call-status=${callStatus}${form.CallDuration ? ` duration=${form.CallDuration}s` : ""}`,
        broadcastTime: mapped === "delivered" ? new Date() : log.broadcastTime,
      },
    });

    console.log(`[twilio] Call ${callSid} → ${mapped}`);
    return new NextResponse("<Response/>", { status: 200, headers: TWI_ML_HEADERS });
  } catch (error: unknown) {
    console.error("[twilio] Failed to process call-status:", error);
    // Never 5xx Twilio — it would retry a state we may already have applied.
    return new NextResponse("<Response/>", { status: 200, headers: TWI_ML_HEADERS });
  }
}

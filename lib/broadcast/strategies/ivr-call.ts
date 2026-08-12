// ---------------------------------------------------------------------
// lib/broadcast/strategies/ivr-call.ts — Phase 5 · Strategy E · IVR
// voice-call fallback to station control rooms.
//
// The last-resort channel: dials the station's emergency contact number
// and plays the regional intro → the radio-ready MP3 → the broadcast
// directive (see lib/broadcast/fm-ivr-fallback.ts). Used when the
// digital channels fail and always attempted for AIR stations, which
// carry the mandatory EWS broadcast obligation. The resulting Twilio
// CallSid is surfaced via DispatchResult.externalRef so the dispatcher
// can store it in fm_broadcast_logs.external_ref for the call-status
// webhook to match.
// ---------------------------------------------------------------------

import type { FmStation } from "@prisma/client";
import type { DispatchContext, DispatchResult, FMDispatchStrategy } from "../types";
import { callStationControlRoom } from "../fm-ivr-fallback";

/** Strategy E: control-room phone call (fallback / AIR guarantee). */
export class IvrCallStrategy implements FMDispatchStrategy {
  readonly name = "ivr" as const;

  /**
   * A station can be IVR-called when it has a control-room number, or it
   * is an AIR station (mandatory EWS obligation — always escalated).
   */
  supports(station: FmStation): boolean {
    return Boolean(station.emergencyContactPhone) || station.type === "air";
  }

  async send(station: FmStation, context: DispatchContext): Promise<DispatchResult> {
    const phone = station.emergencyContactPhone;
    if (!phone) {
      return {
        ok: false,
        strategy: this.name,
        responseCode: 0,
        responseBody:
          `${station.name} (${station.type}) has no emergency contact phone — ` +
          "manual escalation required.",
        error: "No emergency contact phone configured.",
      };
    }

    const result = await callStationControlRoom(
      phone,
      context.capAlert.audioUrl,
      context.rdsText || context.headline,
      { state: station.state },
    );

    if (!result.ok) {
      return {
        ok: false,
        strategy: this.name,
        responseCode: result.responseCode,
        responseBody: result.responseBody,
        error: result.error,
      };
    }

    return {
      ok: true,
      strategy: this.name,
      responseCode: result.responseCode,
      responseBody: result.responseBody,
      broadcastTime: new Date().toISOString(),
      externalRef: result.callSid ?? undefined,
    };
  }
}

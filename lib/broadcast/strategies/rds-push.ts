// ---------------------------------------------------------------------
// lib/broadcast/strategies/rds-push.ts — Phase 4 · Strategy B · RDS text
// push (delegating to the Phase 6 encoder).
//
// For RDS-enabled stations with an RDS control endpoint. Pushes the
// scrolling text line (≤64 chars, built by lib/broadcast/rds-encoder.ts)
// so car radio displays show the alert for the given duration. This
// reaches drivers who are already listening — no studio staff needed.
// The encoder module owns the payload + confirmation parsing; this class
// maps the result onto the dispatcher's DispatchResult contract.
// ---------------------------------------------------------------------

import type { FmStation } from "@prisma/client";
import type { DispatchContext, DispatchResult, FMDispatchStrategy } from "../types";
import { isUsableUrl } from "./cap-api";
import { sendRDSText } from "../rds-encoder";

const RDS_DURATION_MINUTES = 30;

/** Strategy B: RDS text scrolling on rds-enabled stations. */
export class RdsPushStrategy implements FMDispatchStrategy {
  readonly name = "rds" as const;

  /** Needs an RDS-capable station with a usable rds_api_endpoint. */
  supports(station: FmStation): boolean {
    return station.rdsEnabled && isUsableUrl(station.rdsApiEndpoint);
  }

  async send(station: FmStation, context: DispatchContext): Promise<DispatchResult> {
    const result = await sendRDSText(station, context.rdsText, RDS_DURATION_MINUTES, {
      stationId: station.id,
      alertId: context.alertId,
    });

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
    };
  }
}

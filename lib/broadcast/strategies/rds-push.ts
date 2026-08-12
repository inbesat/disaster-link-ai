// ---------------------------------------------------------------------
// lib/broadcast/strategies/rds-push.ts — Phase 4 · Strategy B · RDS text push.
//
// For RDS-enabled stations with an RDS control endpoint. Pushes the
// scrolling text line (≤64 chars, built by lib/broadcast/rds-text.ts) so
// car radio displays show the alert for the given duration. This reaches
// drivers who are already listening — no studio staff needed.
// ---------------------------------------------------------------------

import type { FmStation } from "@prisma/client";
import type { DispatchContext, DispatchResult, FMDispatchStrategy } from "../types";
import { isUsableUrl } from "./cap-api";

const RDS_DURATION_MINUTES = 30;

/** Strategy B: RDS text scrolling on rds-enabled stations. */
export class RdsPushStrategy implements FMDispatchStrategy {
  readonly name = "rds" as const;

  /** Needs an RDS-capable station with a usable rds_api_endpoint. */
  supports(station: FmStation): boolean {
    return station.rdsEnabled && isUsableUrl(station.rdsApiEndpoint);
  }

  async send(
    station: FmStation,
    context: DispatchContext,
  ): Promise<DispatchResult> {
    const endpoint = station.rdsApiEndpoint;
    if (!endpoint) {
      return {
        ok: false,
        strategy: this.name,
        responseCode: 0,
        responseBody: "No rds_api_endpoint configured.",
        error: "No rds_api_endpoint configured.",
      };
    }

    const payload = {
      rds_text: context.rdsText.slice(0, 64),
      duration_minutes: RDS_DURATION_MINUTES,
      station_id: station.id,
      alert_id: context.alertId,
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.FM_BROADCAST_TOKEN ?? "demo-fm-broadcast-token"}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });

      const text = (await response.text()).slice(0, 500);
      if (response.ok) {
        return {
          ok: true,
          strategy: this.name,
          responseCode: response.status,
          responseBody: text,
        };
      }

      return {
        ok: false,
        strategy: this.name,
        responseCode: response.status,
        responseBody: text,
        error: `RDS push rejected (${response.status}): ${text}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        strategy: this.name,
        responseCode: 0,
        responseBody: message.slice(0, 500),
        error: message,
      };
    }
  }
}

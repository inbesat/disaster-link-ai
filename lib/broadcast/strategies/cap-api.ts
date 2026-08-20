// ---------------------------------------------------------------------
// lib/broadcast/strategies/cap-api.ts — Phase 4 · Strategy A · CAP API push.
//
// For stations with a modern emergency API (emergency_api_endpoint). Sends
// the CAP v1.2 XML (Content-Type: application/cap+xml) plus the voiced MP3
// as a multipart/form-data upload with an Authorization bearer token.
//
//   → 200 accepted       { accepted: true, broadcast_time }
//   → 202 queued         accepted, no broadcast_time yet
//   → 4xx / 5xx          rejected / error → fails the attempt (retried later)
// ---------------------------------------------------------------------

import type { FmStation } from "@prisma/client";
import type { DispatchContext, DispatchResult, FMDispatchStrategy } from "../types";

/** Strategy A: modern CAP-capable station APIs. */
export class CapApiStrategy implements FMDispatchStrategy {
  readonly name = "cap_api" as const;

  /** Needs a real (non-placeholder) endpoint URL to be usable. */
  supports(station: FmStation): boolean {
    return isUsableUrl(station.emergencyApiEndpoint);
  }

  async send(
    station: FmStation,
    context: DispatchContext,
  ): Promise<DispatchResult> {
    const endpoint = station.emergencyApiEndpoint;
    if (!endpoint) {
      return {
        ok: false,
        strategy: this.name,
        responseCode: 0,
        responseBody: "No emergency_api_endpoint configured.",
        error: "No emergency_api_endpoint configured.",
      };
    }

    const body = new FormData();
    body.set("cap", new Blob([context.capAlert.capXml], { type: "application/cap+xml" }), "alert.cap");
    body.set(
      "audio",
      new Blob([new Uint8Array(context.audioBuffer)], { type: "audio/mpeg" }),
      `alert-${context.alertId}.mp3`,
    );

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${bearerToken()}`,
        },
        body,
        signal: AbortSignal.timeout(15_000),
      });

      const text = (await response.text()).slice(0, 500);
      const parsed = parseJson(text) as { accepted?: boolean; broadcast_time?: string } | null;

      if (response.status === 200 || response.status === 202) {
        const accepted = parsed?.accepted ?? response.status === 200;
        return {
          ok: accepted,
          strategy: this.name,
          responseCode: response.status,
          responseBody: text,
          broadcastTime: parsed?.broadcast_time,
        };
      }

      return {
        ok: false,
        strategy: this.name,
        responseCode: response.status,
        responseBody: text,
        error: `CAP API rejected (${response.status}): ${text}`,
      };
    } catch (error: unknown) {
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

/** Placeholder-safe check: "http(s)://" + host + not "your-…". */
export function isUsableUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  if (value.startsWith("your-") || value.startsWith("https://your-")) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Broadcast API bearer token (single shared credential for the demo). */
function bearerToken(): string {
  return process.env.FM_BROADCAST_TOKEN ?? "demo-fm-broadcast-token";
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

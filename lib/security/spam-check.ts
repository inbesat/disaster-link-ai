// ---------------------------------------------------------------------
// lib/security/spam-check.ts
// Enterprise Security — SpamPatrol integration for crowdsourced SOS
// reports. Checks the free-text of a citizen report against the external
// SpamPatrol API before it is accepted.
//
// CRITICAL HACKATHON FALLBACK: the check is fail-open. If the
// SPAMPATROL_API_KEY is missing or the API call fails for any reason we
// log a warning and return { isSpam: false } so the public demo never
// crashes and citizens are never blocked by a broken integration.
//
// NOTE: SpamPatrol has no stable public API contract today, so the
// request shape below is a documented convention (JSON POST, Bearer key).
// Swap in the exact endpoint / field names once real credentials exist.
// ---------------------------------------------------------------------

export type SpamPatrolPayload = {
  /** Sanitised free-text of the citizen report (max 2000 chars upstream). */
  text: string;
  reportType?: "flooding" | "road_blocked" | "shelter_needed" | "rescue";
  lat?: number;
  lng?: number;
};

export type SpamPatrolResult = {
  isSpam: boolean;
  reason?: string;
  /** Optional confidence score when the provider returns one. */
  score?: number;
};

const SPAMPATROL_ENDPOINT =
  process.env.SPAMPATROL_ENDPOINT ?? "https://api.spampatrol.com/v1/check";

/**
 * Ask SpamPatrol whether a citizen report looks like spam.
 *
 * Never throws: every failure mode (missing key, non-2xx, network error,
 * bad JSON) is logged and falls back to `{ isSpam: false }`.
 */
export async function checkSpamPatrol(
  payload: SpamPatrolPayload,
): Promise<SpamPatrolResult> {
  const apiKey = process.env.SPAMPATROL_API_KEY;

  if (!apiKey) {
    console.warn(
      "[spampatrol] SPAMPATROL_API_KEY missing — skipping external spam check (demo fallback: not spam).",
    );
    return { isSpam: false };
  }

  try {
    const res = await fetch(SPAMPATROL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text: payload.text,
        report_type: payload.reportType,
        location: { lat: payload.lat, lng: payload.lng },
        source: "citizen_report",
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      console.warn(
        `[spampatrol] API returned ${res.status} — falling back to isSpam: false.`,
      );
      return { isSpam: false };
    }

    const data = (await res.json()) as {
      is_spam?: boolean;
      isSpam?: boolean;
      reason?: string;
      score?: number;
    };
    const isSpam = data.is_spam === true || data.isSpam === true;

    if (isSpam) {
      console.warn(`[spampatrol] Spam detected: "${payload.text.slice(0, 80)}"`);
    }
    return { isSpam, reason: data.reason, score: data.score };
  } catch (error: unknown) {
    console.warn("[spampatrol] API call failed — falling back to isSpam: false.", error);
    return { isSpam: false };
  }
}

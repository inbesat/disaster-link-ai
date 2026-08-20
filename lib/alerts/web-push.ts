// ---------------------------------------------------------------------
// lib/alerts/web-push.ts — SERVER-ONLY. VAPID signing + delivery utilities
// for Web Push (browser) notifications.
//
// IMPORTANT: this module reads VAPID_PRIVATE_KEY (a server secret). It must
// NEVER be imported from a "use client" component or any client-reachable
// file — the private key reference would then be inlined into the client
// bundle. Browser-side service-worker registration lives in
// components/pwa/ServiceWorkerRegister.tsx (which only uses the public
// NEXT_PUBLIC_VAPID_PUBLIC_KEY).
//
// Env contract:
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY  - public key (exposed to the browser)
//   VAPID_PRIVATE_KEY             - private key (server-only)
//   VAPID_SUBJECT                 - contact (mailto:) for the push service
//
// If any key is missing or still a placeholder, sendWebPush() degrades to
// { ok: false } and never throws, so the app keeps working without push.
// ---------------------------------------------------------------------

import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:team@disaster-response.in";

export type WebPushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type WebPushPayload = {
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  renotify?: boolean;
  [key: string]: unknown;
};

export type SendWebPushResult =
  { ok: true; statusCode?: number } | { ok: false; error: string };

// True when VAPID keys exist and are not "<your-...>" placeholders.
export function isWebPushConfigured(): boolean {
  const isPlaceholder = (value: string | undefined) =>
    !value || value.includes("<") || value.includes("your-");

  return (
    !isPlaceholder(VAPID_PUBLIC_KEY) &&
    !isPlaceholder(VAPID_PRIVATE_KEY) &&
    Boolean(VAPID_SUBJECT)
  );
}

function ensureConfigured() {
  if (!isWebPushConfigured()) {
    throw new Error(
      "Web Push is not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.",
    );
  }
  webpush.setVapidDetails(
    VAPID_SUBJECT as string,
    VAPID_PUBLIC_KEY as string,
    VAPID_PRIVATE_KEY as string,
  );
}

/**
 * Sends a Web Push notification to a single subscription. Never throws —
 * failed / expired subscriptions are reported as { ok: false } so callers
 * can drop the row from their push_subscriptions table.
 */
export async function sendWebPush(
  subscription: WebPushSubscription,
  payload: WebPushPayload = {},
): Promise<SendWebPushResult> {
  try {
    ensureConfigured();
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify({ title: "Disaster Alert", ...payload }),
    );
    return { ok: true, statusCode: result.statusCode };
  } catch (error: unknown) {
    console.error("[web-push] sendNotification failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

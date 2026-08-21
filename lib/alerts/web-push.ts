// ---------------------------------------------------------------------
// lib/alerts/web-push.ts — SERVER-ONLY. VAPID signing + delivery utilities
// for Web Push (browser) notifications with high-priority flags and tag grouping.
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
  isCritical?: boolean;
  [key: string]: unknown;
};

export type SendWebPushResult =
  { ok: true; statusCode?: number } | { ok: false; error: string };

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
 * Sends a Web Push notification to a single subscription.
 * Critical alerts use high urgency and requireInteraction flags.
 */
export async function sendWebPush(
  subscription: WebPushSubscription,
  payload: WebPushPayload = {},
): Promise<SendWebPushResult> {
  try {
    ensureConfigured();

    const isCritical = payload.isCritical ?? true;

    // Build payload with grouping tag and high priority options
    const fullPayload = {
      title: "Disaster Alert",
      body: "Emergency alert update",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      url: "/public/alerts",
      tag: payload.tag || "disaster-alert",
      renotify: payload.renotify ?? false, // Prevents alert spam for same group
      requireInteraction: isCritical,
      ...payload,
    };

    const options: webpush.RequestOptions = {
      TTL: 86400, // 24 hours
      urgency: isCritical ? "high" : "normal",
    };

    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(fullPayload),
      options,
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

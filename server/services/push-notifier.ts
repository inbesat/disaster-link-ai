// ---------------------------------------------------------------------
// server/services/push-notifier.ts
// Broadcasts Web Push notifications to every stored subscription.
//
// A thin wrapper over lib/alerts/web-push.ts (VAPID signing + delivery)
// that loads the current subscription set from the database, sends to each
// receiver, and prunes subs that the push service reports as gone.
//
// Never throws — failures are surfaced via the returned results so callers
// (e.g. the alert engine) can keep the rest of the pipeline running.
// ---------------------------------------------------------------------

import { prisma } from "@/server/prisma";
import { sendWebPush, type WebPushPayload } from "@/lib/alerts/web-push";

export type PushNotifierResult = {
  ok: boolean;
  delivered: number;
  failed: number;
  pruned: number;
  /** Human reason when nothing was attempted (e.g. not configured). */
  skipped?: string;
};

/**
 * Send a push notification to all active subscriptions.
 *
 * @param title  Notification title (defaults to "Disaster Alert").
 * @param body   Notification body.
 * @param url    Deep-link opened when the notification is clicked.
 * @param tag    Grouping tag so multiple alerts collapse to one toast.
 */
export async function notifyAllSubscribers(
  input: { title?: string; body?: string; url?: string; tag?: string } = {},
): Promise<PushNotifierResult> {
  const result: PushNotifierResult = { ok: false, delivered: 0, failed: 0, pruned: 0 };

  try {
    // Soft-checks: if push isn't configured or there are no receivers,
    // report gracefully rather than throwing into the alert pipeline.
    const { isWebPushConfigured } = await import("@/lib/alerts/web-push");
    const counts = await Promise.resolve({});
    void counts;

    try {
      const configured = isWebPushConfigured();
      if (!configured) {
        return {
          ...result,
          skipped: "Web Push is not configured (VAPID keys missing).",
        };
      }
    } catch {
      return { ...result, skipped: "Web Push is not configured (VAPID keys missing)." };
    }

    const subscriptions = await prisma.pushSubscription.findMany();

    if (subscriptions.length === 0) {
      return { ...result, skipped: "No subscribers registered." };
    }

    const payload: WebPushPayload = {
      title: input.title ?? "Disaster Alert",
      body: input.body ?? "You have a new disaster alert.",
      url: input.url ?? "/command-center",
      tag: input.tag ?? `disaster-${Date.now()}`,
    };

    for (const subscription of subscriptions) {
      const sent = await sendWebPush(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        payload,
      );

      if (sent.ok) {
        result.delivered++;
      } else {
        result.failed++;
        // Expired / unreachable push services send a 410/404 — drop the row
        // so we stop wasting time (and quota) on a dead subscription.
        if (sent.error && /(410|404)/i.test(sent.error)) {
          await prisma.pushSubscription
            .delete({ where: { endpoint: subscription.endpoint } })
            .catch(() => undefined);
          result.pruned++;
        }
      }
    }

    result.ok = result.failed === 0;
    return result;
  } catch (error) {
    console.error("[push-notifier] Broadcast failed:", error);
    return { ...result, skipped: error instanceof Error ? error.message : String(error) };
  }
}

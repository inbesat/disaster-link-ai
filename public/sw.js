// Service Worker for browser push notifications (Web Push).
// Serves as the push receiver for the Disaster Request Intelligence Platform.
// Register hook in lib/alerts/web-push.ts #registerServiceWorker.

self.addEventListener("push", (event) => {
  let payload: Record<string, unknown> = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = String(payload.title ?? "Disaster Alert");
  const options: NotificationOptions = {
    body: String(payload.body ?? "You have a new disaster alert."),
    icon: String(payload.icon ?? "/icons/icon-192.png"),
    badge: String(payload.badge ?? "/icons/icon-192.png"),
    tag: String(payload.tag ?? "disaster-alert"),
    renotify: payload.renotify === true ? true : false,
    data: { url: String(payload.url || "/command-center") },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/command-center";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    }),
  );
});
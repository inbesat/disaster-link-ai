// ---------------------------------------------------------------------
// worker/index.js — Phase 13 · Step 1 · next-pwa custom worker.
//
// next-pwa (customWorkerDir) bundles this file and importScripts it into
// the generated public/sw.js. It carries BOTH responsibilities of the app
// service worker:
//
//   1. Web Push notifications (VAPID receiver).
//   2. Offline shell — precaches /~offline + icons and serves navigations
//      network-first with the offline fallback page.
//   3. Offline-First sync (Phase 2) — relays a periodic background-sync
//      event (or an in-page "sync now" message) out to every open client,
//      which runs the IndexedDB offline sync engine.
//
// Workbox coexistence: inside the generated worker, next-pwa's
// DefinePlugin replaces the `__PWA_SW__` token with a string at build time
// (it is applied to the custom-worker bundle too) — that gives us a
// deterministic "running inside the generated worker" signal. When it is
// present, workbox owns precaching, runtime caching and the document
// fallback (fallbacks: { document: "/~offline" }), so our handlers no-op
// to avoid double respondWith. When this file runs standalone (dev
// public/sw.js), the token is undeclared and the handlers act.
//
// NOTE: keep public/sw.js in sync with this file (it is the dev fallback;
// next-pwa overwrites it on every production build).
// ---------------------------------------------------------------------

// --- Offline shell ------------------------------------------------------
const OFFLINE_CACHE = "bharat-shakti-shell-v1";
const OFFLINE_SHELL = [
  "/~offline",
  "/manifest.json",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Defined only inside the next-pwa-generated worker (DefinePlugin).
const inGeneratedWorker = () => typeof __PWA_SW__ !== "undefined";

self.addEventListener("install", (event) => {
  if (inGeneratedWorker()) return; // workbox precaches + fallback document
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      // Per-URL so one missing asset degrades to 'no offline shell' instead
      // of failing the whole install (which would kill push notifications).
      .then((cache) =>
        Promise.all(OFFLINE_SHELL.map((url) => cache.add(url).catch(() => undefined))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  if (inGeneratedWorker()) return; // workbox cleans its own outdated caches
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== OFFLINE_CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (inGeneratedWorker()) return; // workbox owns caching in the generated worker
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Never touch cross-origin requests (map tiles, CDNs) or the dynamic API.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network-first, then cache, then the offline fallback page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(OFFLINE_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/~offline");
        }),
    );
    return;
  }

  // Same-origin static assets: cache-first with a network backfill.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(OFFLINE_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});

// --- Web Push (VAPID receiver) -------------------------------------------
// Register hook in lib/alerts/web-push.ts #registerServiceWorker.

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = String(payload.title ?? "Disaster Alert");
  const options = {
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
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
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

// --- Offline-First sync (Phase 2) ---------------------------------------
// The engine itself (Dexie + fetchers) runs in the page; the SW only
// nudges open clients to run a sync. Covers:
//   • Periodic Background Sync ('periodicsync' event with our tag).
//   • An explicit in-page nudge via postMessage({ type: "drip:sync:request" })
//     (the page uses it for "Sync Now" while backgrounded).
const SYNC_TAG = "disasterlink-sync";
const SYNC_MSG = "drip:sync:request";

function relaySyncRequest() {
  self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      for (const client of clients) client.postMessage({ type: SYNC_MSG });
    })
    .catch(() => {});
}

// Periodic Background Sync — browser woke us to sync offline data.
self.addEventListener("periodicsync", (event) => {
  if (event.tag !== SYNC_TAG) return;
  event.waitUntil(Promise.resolve(relaySyncRequest()));
});

// In-page "Sync Now" nudge → relay to all open clients.
self.addEventListener("message", (event) => {
  const data = event.data && typeof event.data === "object" ? event.data : {};
  if (data.type !== SYNC_MSG) return;
  relaySyncRequest();
});

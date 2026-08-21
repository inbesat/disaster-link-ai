// ---------------------------------------------------------------------
// worker/index.js — Phase 13/12 · Service Worker Caching, Fallback & Security
//
// Responsibilities:
//   1. Web Push notifications (VAPID receiver + offline queue).
//   2. Offline shell & stale-while-revalidate caching (version: bharat-shakti-shell-v2).
//   3. Never-cache rules for sensitive paths (/api/auth/, /api/chat/, tokens, private data).
//   4. Automated cache invalidation on deployment activate.
//   5. QuotaExceededError graceful recovery.
// ---------------------------------------------------------------------

// --- Offline shell ------------------------------------------------------
const OFFLINE_CACHE = "bharat-shakti-shell-v2";
const OFFLINE_SHELL = [
  "/~offline",
  "/manifest.json",
  "/icons/icon-72.png",
  "/icons/icon-96.png",
  "/icons/icon-128.png",
  "/icons/icon-144.png",
  "/icons/icon-152.png",
  "/icons/icon-192.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-384.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
];

// Sensitive endpoint paths that MUST NEVER be cached
const SENSITIVE_PATH_PATTERNS = [
  "/api/auth",
  "/api/chat",
  "/api/user",
  "/api/settings",
  "/login",
  "/auth",
];

// Defined only inside the next-pwa-generated worker (DefinePlugin).
const inGeneratedWorker = () => typeof __PWA_SW__ !== "undefined";

/** Helper to put item into cache with QuotaExceededError handling. */
async function safeCachePut(cacheName, request, response) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
  } catch (error) {
    if (error && (error.name === "QuotaExceededError" || error.code === 22)) {
      console.warn("[SW] Storage quota exceeded. Clearing old cache entries.");
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        // Delete first 10 oldest entries to free up quota
        for (let i = 0; i < Math.min(10, keys.length); i++) {
          await cache.delete(keys[i]);
        }
      } catch {
        // Non-fatal
      }
    }
  }
}

self.addEventListener("install", (event) => {
  if (inGeneratedWorker()) return; // workbox precaches + fallback document
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
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
          keys
            .filter((key) => key.startsWith("bharat-shakti-") && key !== OFFLINE_CACHE)
            .map((key) => caches.delete(key)),
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

  // Never touch cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Never cache sensitive API routes or auth paths
  const isSensitive = SENSITIVE_PATH_PATTERNS.some((pattern) =>
    url.pathname.includes(pattern),
  );
  if (isSensitive || url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigations: Network-first, fallback to cache, then fallback to offline shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void safeCachePut(OFFLINE_CACHE, request, copy);
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offlinePage = await caches.match("/~offline");
          if (offlinePage) return offlinePage;

          // If offline page itself fails, return minimal inline fallback
          return new Response(
            `<!DOCTYPE html><html><head><title>Offline</title></head><body style="background:#0a0f1a;color:#fff;font-family:sans-serif;text-align:center;padding:2rem;"><h1>Offline</h1><p>Emergency offline mode active. Reconnect to sync latest data.</p></body></html>`,
            { headers: { "Content-Type": "text/html" } },
          );
        }),
    );
    return;
  }

  // Static Assets: Stale-while-revalidate strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const copy = networkResponse.clone();
            void safeCachePut(OFFLINE_CACHE, request, copy);
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    }),
  );
});

// --- Web Push (VAPID receiver) + offline queue ---------------------------
const PUSH_QUEUE_CACHE = "disasterlink-push-queue-v1";

function swOnline() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

async function enqueuePushPayload(payload, title, options) {
  try {
    const cache = await caches.open(PUSH_QUEUE_CACHE);
    const id = `push-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await cache.put(
      new Request(`/${id}`),
      new Response(JSON.stringify({ payload, title, options })),
    );
    return true;
  } catch {
    return false;
  }
}

async function flushPushQueue() {
  let cache;
  try {
    cache = await caches.open(PUSH_QUEUE_CACHE);
  } catch {
    return;
  }
  const requests = await cache.keys();
  if (requests.length === 0) return;
  const shows = requests.map(async (request) => {
    const response = await cache.match(request);
    if (!response) return;
    let entry;
    try {
      entry = await response.json();
    } catch {
      entry = {};
    }
    const payload = entry.payload || {};
    const title = String(entry.title || payload.title || "Disaster Alert");
    const options = {
      body: String(entry.options?.body || payload.body || "You have a new disaster alert."),
      icon: String(entry.options?.icon || payload.icon || "/icons/icon-192.png"),
      badge: String(entry.options?.badge || payload.badge || "/icons/icon-192.png"),
      tag: String(entry.options?.tag || payload.tag || "disaster-alert"),
      renotify: entry.options?.renotify === true ? true : false,
      data: { url: String(entry.options?.data?.url || payload.url || "/command-center") },
    };
    await self.registration.showNotification(title, options);
  });
  await Promise.all(shows);
  await cache.delete(PUSH_QUEUE_CACHE);
}

function buildPushOptions(payload) {
  return {
    body: String(payload.body ?? "You have a new disaster alert."),
    icon: String(payload.icon ?? "/icons/icon-192.png"),
    badge: String(payload.badge ?? "/icons/icon-192.png"),
    tag: String(payload.tag ?? "disaster-alert"),
    renotify: payload.renotify === true ? true : false,
    data: { url: String(payload.url || "/command-center") },
  };
}

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = String(payload.title ?? "Disaster Alert");
  const options = buildPushOptions(payload);

  if (!swOnline()) {
    event.waitUntil(enqueuePushPayload(payload, title, options));
    return;
  }

  event.waitUntil(
    self.registration.showNotification(title, options).catch(() =>
      enqueuePushPayload(payload, title, options).then(() => undefined),
    ),
  );
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
const SYNC_TAG = "disasterlink-sync";
const SYNC_MSG = "drip:sync:request";
const BG_SYNC_TAGS = ["sync-predictions", "sync-alerts"];

function relaySyncRequest() {
  self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      for (const client of clients) client.postMessage({ type: SYNC_MSG });
    })
    .catch(() => {});
}

function handleSyncTick() {
  relaySyncRequest();
  return flushPushQueue();
}

self.addEventListener("sync", (event) => {
  if (!BG_SYNC_TAGS.includes(event.tag)) return;
  event.waitUntil(handleSyncTick());
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag !== SYNC_TAG) return;
  event.waitUntil(Promise.resolve(handleSyncTick()));
});

self.addEventListener("message", (event) => {
  const data = event.data && typeof event.data === "object" ? event.data : {};
  if (data.type !== SYNC_MSG) return;
  event.waitUntil(Promise.resolve(handleSyncTick()));
});

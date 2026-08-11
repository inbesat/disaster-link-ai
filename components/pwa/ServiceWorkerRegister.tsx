"use client";

// ---------------------------------------------------------------------
// components/pwa/ServiceWorkerRegister.tsx — Phase 13 · Steps 1 & 3 ·
// PWA service worker registration + update watcher for the App Router.
//
// next-pwa cannot auto-register in the App Router (no _app), so this
// island registers /sw.js once on mount — production builds only (dev
// has next-pwa disabled and the worker would 404). Registration is
// idempotent, so it never clashes with the web-push register() call in
// lib/alerts/web-push.ts.
//
// Step 3 · update flow: when a NEW worker installs while an older one is
// already controlling the page (i.e. a fresh deploy), the banner in
// components/pwa/PwaUpdateBanner.tsx is told via the
// drip:pwa:update-available window event and offers Reload. The workbox
// worker calls skipWaiting() on install, so the reload serves the new
// build immediately.
// ---------------------------------------------------------------------

import { useEffect } from "react";
import { PWA_EVENTS } from "@/lib/pwa/pwa-utils";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Phase 13 · Step 3 — new-version detection. `controller` present
        // means an older worker already owns the page, so this install is
        // a genuine update (not the first visit's initial install).
        registration.addEventListener("updatefound", () => {
          // The fresh worker normally lands in `installing`; on a very fast
          // install it may already be `waiting` by the time this runs.
          const newWorker = registration.installing ?? registration.waiting;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              window.dispatchEvent(
                new CustomEvent(PWA_EVENTS.UPDATE_AVAILABLE, {
                  detail: { installedAt: Date.now() },
                }),
              );
            }
          });
        });
      })
      .catch((error) => {
        console.error("[pwa] service worker registration failed:", error);
      });
  }, []);

  return null;
}

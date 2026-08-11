// ---------------------------------------------------------------------
// lib/pwa/pwa-utils.ts — Phase 13 · Step 3 · PWA install/update plumbing
//
// Pure, browser-free helpers for the PWA install prompt and the
// update-available flow. Keeping the logic here (instead of inline in the
// hooks/components) makes it unit-testable in the node-only vitest env —
// every function takes its dependencies (storage, matchMedia) as
// parameters, so nothing touches `window` unless it is passed in.
//
//   • Install prompt: capture the `beforeinstallprompt` event, remember
//     when the citizen dismissed the nudge (never nag again), and detect
//     whether the app is already running standalone (installed).
//   • Update flow: the service worker dispatches a window CustomEvent
//     when a new build takes over; the update banner remembers dismissals
//     per update so "Later" doesn't permanently mute future releases.
// ---------------------------------------------------------------------

export const PWA_STORAGE_KEYS = {
  /** Citizen tapped "Not now" on the install banner — never nag again. */
  installDismissed: "drip:pwa:install-dismissed",
  /**
   * Per-update dismissal ("Later" on the update banner). Keyed by the
   * update's install time so the NEXT release can prompt again.
   */
  updateDismissed: (installKey: string) => `drip:pwa:update-dismissed:${installKey}`,
} as const;

/**
 * Window event names bridged between the PWA modules.
 *
 *   ServiceWorkerRegister → dispatches UPDATE_AVAILABLE when a new worker
 *     installs over an existing one.
 *   usePwaInstall → dispatches INSTALLABLE / INSTALLED for analytics or
 *     other consumers; PwaInstallPrompt/PwaUpdateBanner listen.
 */
export const PWA_EVENTS = {
  UPDATE_AVAILABLE: "drip:pwa:update-available",
  INSTALLABLE: "drip:pwa:installable",
  INSTALLED: "drip:pwa:installed",
} as const;

/**
 * The `beforeinstallprompt` event shape (Chromium). Typed structurally so
 * tests and non-Chromium browsers can feed a conforming object without
 * depending on the (non-standard) DOM interface.
 */
export interface BeforeInstallPromptEventLike {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/** Runtime guard for the beforeinstallprompt event. */
export function isBeforeInstallPromptEvent(value: unknown): value is BeforeInstallPromptEventLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "prompt" in value &&
    typeof (value as { prompt?: unknown }).prompt === "function"
  );
}

// ---------------------------------------------------------------------
// Storage helpers (storage injected for node tests; window.localStorage
// with guards at runtime). Every read/write is non-throwing: a private
// browsing session or a denied localStorage must never crash the app.
// ---------------------------------------------------------------------

export type PwaStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): PwaStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readInstallDismissed(storage: PwaStorage | null = defaultStorage()): boolean {
  try {
    return storage?.getItem(PWA_STORAGE_KEYS.installDismissed) === "true";
  } catch {
    return false;
  }
}

export function writeInstallDismissed(
  dismissed: boolean,
  storage: PwaStorage | null = defaultStorage(),
): void {
  try {
    if (!storage) return;
    if (dismissed) {
      storage.setItem(PWA_STORAGE_KEYS.installDismissed, "true");
    } else {
      storage.removeItem(PWA_STORAGE_KEYS.installDismissed);
    }
  } catch {
    // Non-fatal — the in-memory state still applies for this session.
  }
}

export function readUpdateDismissed(
  installKey: string,
  storage: PwaStorage | null = defaultStorage(),
): boolean {
  try {
    return storage?.getItem(PWA_STORAGE_KEYS.updateDismissed(installKey)) === "true";
  } catch {
    return false;
  }
}

export function writeUpdateDismissed(
  installKey: string,
  dismissed: boolean,
  storage: PwaStorage | null = defaultStorage(),
): void {
  try {
    if (!storage) return;
    if (dismissed) {
      storage.setItem(PWA_STORAGE_KEYS.updateDismissed(installKey), "true");
    } else {
      storage.removeItem(PWA_STORAGE_KEYS.updateDismissed(installKey));
    }
  } catch {
    // Non-fatal.
  }
}

// ---------------------------------------------------------------------
// Standalone detection — is the app already running as an installed app?
// iOS Safari exposes navigator.standalone; everyone else supports the
// display-mode media query. matchMedia is injected for node tests.
// ---------------------------------------------------------------------

export function detectStandalone(
  matchMedia: ((query: string) => { matches: boolean }) | null,
  navigatorStandalone: unknown,
): boolean {
  if (navigatorStandalone === true) return true;
  try {
    return matchMedia?.("(display-mode: standalone)")?.matches === true;
  } catch {
    return false;
  }
}

/** Best-effort "can this browser install a PWA at all?" gate. */
export function detectPwaSupport(): boolean {
  // serviceWorker lives on navigator (NOT on window — `"serviceWorker" in
  // window` is always false and would short-circuit this to a permanent no).
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return "serviceWorker" in navigator;
}

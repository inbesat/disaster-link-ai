// ---------------------------------------------------------------------
// lib/pwa/wake-lock.ts — Phase 11 · Screen Wake Lock (PWA path).
//
// Keeps the screen on during emergency navigation ("navigator.wakeLock").
// The browser auto-releases a wake lock when the tab is hidden, so the
// lock must be re-requested on visibility return — `requestScreenWakeLock`
// returns a sentinel and the hook re-acquires on `visibilitychange`.
//
// Every function is dependency-injected (navigator, document) so the
// node-only vitest env can unit test the guards without a real browser.
// ---------------------------------------------------------------------

/** Structural view of the browser's wake-lock sentinel. */
export interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
}

interface ScreenWakeLockApi {
  request(type: "screen"): Promise<WakeLockSentinelLike>;
}

export interface WakeLockDeps {
  navigator?: unknown;
  document?: unknown;
}

/** True when the Screen Wake Lock API exists on this runtime. */
export function isWakeLockSupported(deps: WakeLockDeps = defaultDeps()): boolean {
  const nav = deps.navigator as { wakeLock?: unknown } | undefined;
  return !!nav && typeof nav.wakeLock === "object" && nav.wakeLock !== null;
}

/** True when the document is visible (page in the foreground). */
export function isDocumentVisible(deps: WakeLockDeps = defaultDeps()): boolean {
  const doc = deps.document as { visibilityState?: string } | undefined;
  return !doc || doc.visibilityState === "visible";
}

/**
 * Requests the screen wake lock. Resolves null when unsupported, the page
 * is hidden (the request is rejected there), or the API throws — callers
 * treat null as "screen not held" and keep navigating regardless.
 */
export async function requestScreenWakeLock(deps: WakeLockDeps = defaultDeps()): Promise<WakeLockSentinelLike | null> {
  if (!isWakeLockSupported(deps) || !isDocumentVisible(deps)) return null;
  try {
    const nav = deps.navigator as { wakeLock: ScreenWakeLockApi };
    return await nav.wakeLock.request("screen");
  } catch {
    return null;
  }
}

/** Best-effort release of a held wake lock. */
export async function releaseScreenWakeLock(sentinel: WakeLockSentinelLike | null): Promise<void> {
  if (!sentinel || sentinel.released) return;
  try {
    await sentinel.release();
  } catch {
    // already released — non-fatal
  }
}

function defaultDeps(): WakeLockDeps {
  if (typeof window === "undefined") return {};
  return { navigator: navigator, document };
}

export default requestScreenWakeLock;
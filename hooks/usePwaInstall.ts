"use client";

// ---------------------------------------------------------------------
// hooks/usePwaInstall.ts — Phase 13 · Step 3 · PWA install-prompt hook.
//
// Captures the browser's `beforeinstallprompt` event (Chromium), exposes
// promptInstall() for a button, remembers a one-time dismissal ("Not now"
// never nags again), and detects when the app is already installed
// (running standalone, or the `appinstalled` event fired).
//
// All state starts false on the server + first client paint (no hydration
// mismatch); the listeners attach in a mount effect only.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import {
  detectStandalone,
  isBeforeInstallPromptEvent,
  readInstallDismissed,
  writeInstallDismissed,
  type BeforeInstallPromptEventLike,
} from "@/lib/pwa/pwa-utils";

export type PwaInstallState = {
  /** A beforeinstallprompt was captured and the browser can install. */
  canInstall: boolean;
  /** The app is running as an installed PWA (standalone). */
  isInstalled: boolean;
  /** The citizen tapped "Not now" previously — suppress the nudge. */
  dismissed: boolean;
  /** Ask the browser for the install dialog. Resolves true when accepted. */
  promptInstall: () => Promise<boolean>;
  /** Persist "Not now" and hide the prompt. */
  dismissInstall: () => void;
  /** Reset a prior dismissal so the nudge can show again (settings). */
  resetDismissal: () => void;
};

export function usePwaInstall(): PwaInstallState {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [prompt, setPrompt] = useState<BeforeInstallPromptEventLike | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed — no install nudge needed on this device.
    // (navigator.standalone is iOS Safari's non-standard install flag.)
    const nav = navigator as Navigator & { standalone?: unknown };
    if (detectStandalone(window.matchMedia.bind(window), nav.standalone)) {
      setIsInstalled(true);
      return;
    }

    setDismissed(readInstallDismissed());

    const onBeforeInstallPrompt = (event: Event) => {
      // preventDefault stops Chrome's automatic mini-infobar so the app's
      // own banner is the single install surface.
      event.preventDefault();
      if (!isBeforeInstallPromptEvent(event)) return;
      setPrompt(event);
      setCanInstall(true);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!prompt) return false;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setCanInstall(false);
        setPrompt(null);
        return true;
      }
    } catch {
      // Some browsers throw when prompt() is called twice — swallow it.
    }
    return false;
  }, [prompt]);

  const dismissInstall = useCallback(() => {
    setDismissed(true);
    setCanInstall(false);
    setPrompt(null);
    writeInstallDismissed(true);
  }, []);

  const resetDismissal = useCallback(() => {
    setDismissed(false);
    writeInstallDismissed(false);
    // The beforeinstallprompt event fires once per page load, so a
    // previously dismissed prompt won't be re-captured in THIS session —
    // the next navigation/load re-arms the banner. If a prompt is still
    // captured (fresh settings visit), keep it usable.
    setCanInstall(prompt !== null);
  }, [prompt]);

  return { canInstall, isInstalled, dismissed, promptInstall, dismissInstall, resetDismissal };
}

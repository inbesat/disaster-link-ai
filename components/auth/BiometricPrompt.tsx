"use client";

// ---------------------------------------------------------------------
// components/auth/BiometricPrompt.tsx — UI/UX Phase 9 · Step 8.
//
// First-login enhancement that makes every subsequent sign-in instant: a
// modal asking the responder to enroll Face ID / Fingerprint. This is a
// hackathon mock — instead of the real WebAuthn `navigator.credentials`
// handshake we simulate a sub-second "scan", persist the preference to
// localStorage, and report the outcome through `onResult`. A later step
// can swap the simulated scan for a genuine `PublicKeyCredential` creation.
//
//   • Fully recalled / enrolled → "authed" (toast + close).
//   • "No Thanks" → dismissed and the preference remembered so we never
//     nag again on this device.
//   • To let the user change their mind later, `onManage` can be wired to
//     a settings toggle that calls `disable()`.
// -------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Fingerprint, Loader2, ShieldCheck, X } from "lucide-react";

/** localStorage key + shape (versioned so the schema can evolve later). */
export const BIOMETRIC_PREF_KEY = "drip_biometric_enabled_v1";

export type BiometricResult =
  | { enabled: true }
  | { enabled: false; reason: "declined" | "closed" | "unsupported" };

type BiometricPromptProps = {
  /** Open the prompt (usually on first login while logged in). */
  open: boolean;
  /** Fired with the outcome so the caller can update its own state. */
  onResult?: (result: BiometricResult) => void;
  /** Fired on dismiss — the caller hides the modal. */
  onClose?: () => void;
  /** Pass a stored preference (from localStorage) to skip the prompt. */
  alreadyEnabled?: boolean;
};

/** Read the stored preference (SSR-safe). */
export function readBiometricPref(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(BIOMETRIC_PREF_KEY) === "true";
  } catch {
    return false;
  }
}

/** Persist the preference (never throws — blocked storage is harmless). */
export function writeBiometricPref(enabled: boolean): void {
  try {
    window.localStorage.setItem(BIOMETRIC_PREF_KEY, enabled ? "true" : "false");
  } catch {
    /* storage blocked */
  }
}

/** Whether this browser can plausibly do WebAuthn (mock gate). */
export function supportsBiometricAuth(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.isSecureContext === "boolean" && window.isSecureContext;
}

export function BiometricPrompt({
  open,
  onResult,
  onClose,
  alreadyEnabled = false,
}: BiometricPromptProps) {
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);

  // Never show if the preference is already on — and clear the animation
  // state whenever the modal reopens so the scan replays fresh.
  useEffect(() => {
    if (!open) {
      setScanning(false);
      setDone(false);
    }
  }, [open]);

  if (!open || alreadyEnabled) return null;

  const cancel = () => {
    onResult?.({ enabled: false, reason: "closed" });
    onClose?.();
  };

  const enable = () => {
    if (scanning || done) return;
    setScanning(true);
    // Mock fast enroll: a ~900ms fingerprint sweep then success.
    window.setTimeout(() => {
      setScanning(false);
      setDone(true);
      writeBiometricPref(true);
      onResult?.({ enabled: true });
      // Auto-dismiss after the success flash.
      window.setTimeout(() => onClose?.(), 1400);
    }, 900);
  };

  const skip = () => {
    writeBiometricPref(false);
    onResult?.({ enabled: false, reason: "declined" });
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && !alreadyEnabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-4 sm:items-center"
          onClick={cancel}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Enable biometric login"
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0f172a] p-6 text-center shadow-2xl shadow-black/60"
          >
            <button
              type="button"
              onClick={cancel}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Fingerprint — pulsing ring while "scanning". */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[var(--accent-primary)]/10">
              {done ? (
                <ShieldCheck
                  className="h-14 w-14 text-emerald-400"
                  strokeWidth={1.5}
                  aria-hidden
                />
              ) : (
                <div className="relative flex h-14 w-14 items-center justify-center">
                  <Fingerprint
                    className={`h-14 w-14 ${
                      scanning
                        ? "animate-pulse text-[var(--accent-primary)]"
                        : "text-[var(--accent-primary)]"
                    }`}
                    strokeWidth={1.25}
                    aria-hidden
                  />
                  {scanning && (
                    <span
                      aria-hidden
                      className="absolute inset-0 -z-10 animate-ping rounded-[100%] bg-[var(--accent-primary)]/30 [animation-duration:0.9s]"
                    />
                  )}
                </div>
              )}
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">
              {done ? "Biometrics Enabled" : "Enable Biometric Login"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {done
                ? "Your next login will take under a second."
                : "Use Face ID or Fingerprint for faster access — no more typing in the rain."}
            </p>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={enable}
                disabled={scanning || done}
                className="flex h-13 min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 text-base font-bold text-white shadow-[0_0_18px_rgba(59,130,246,0.35)] transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {scanning ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Scanning…
                  </>
                ) : done ? (
                  "Done"
                ) : (
                  "Enable"
                )}
              </button>
              <button
                type="button"
                onClick={skip}
                disabled={scanning}
                className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-[0.98] disabled:opacity-40"
              >
                No Thanks
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Disable + clear the stored preference. */
export function disableBiometric(): void {
  writeBiometricPref(false);
}

export default BiometricPrompt;
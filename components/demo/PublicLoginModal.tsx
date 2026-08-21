"use client";

// ---------------------------------------------------------------------
// components/demo/PublicLoginModal.tsx — Phase 2 · Step 3 · One-tap
// citizen demo login.
//
// Drops judges straight into the Citizen Companion app. The Citizen card
// on the two-door landing (/demo) opens this modal, which shows the
// pre-filled, VISIBLE citizen identity — phone, auto-verified OTP,
// location and language — then a single "One-Tap Experience" button.
//
// One-tap first writes the pre-filled location to localStorage
// (`citizen_location`, the key the citizen map + SafetyHero read), then
// calls the publicDemoLogin server action: it mocks the citizen session
// by writing role=public + demo_mode cookies and redirects to
// /public/dashboard.
// ---------------------------------------------------------------------

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Home,
  Languages,
  Loader2,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { publicDemoLogin } from "@/app/actions/auth";
import { trackAnalytics } from "@/lib/demo/analytics";

const CITIZEN_LOCATION_KEY = "citizen_location";

const DEMO_CITIZEN_FIELDS = [
  { icon: Phone, label: "Phone", value: "+91 9876543210" },
  { icon: CheckCircle2, label: "OTP", value: "123456 · auto-verified" },
  { icon: MapPin, label: "Location", value: "Karanpur, Patna" },
  { icon: Languages, label: "Language", value: "Hindi" },
] as const;

type PublicLoginModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function PublicLoginModal({ open, onClose }: PublicLoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOneTap() {
    setError(null);
    setLoading(true);

    // Step 9 — record the presenter entering Citizen demo mode.
    trackAnalytics("mode.enter.citizen", "citizen");

    // Apply the pre-filled location so the citizen map + SafetyHero open
    // on the exact demo village (Karanpur, Patna) the modal advertises.
    try {
      window.localStorage.setItem(
        CITIZEN_LOCATION_KEY,
        JSON.stringify({
          type: "manual",
          district: "Patna",
          village: "Karanpur",
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // Storage unavailable — the login still works, just without the
      // prefilled location.
    }

    try {
      await publicDemoLogin();
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Login failed. Try again.");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Demo citizen login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-[var(--dl-radius)] border border-white/15 bg-panel-deep p-6 text-[var(--dl-text-on-navy)] shadow-[var(--dl-shadow-soft)]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close demo login"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[var(--dl-text-muted)] transition hover:border-white/25 hover:text-white"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                <Home aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Citizen</p>
                <p className="text-xs text-[var(--dl-text-muted)]">
                  Public Safety App · One-tap demo access
                </p>
              </div>
            </div>

            {/* Pre-filled, visible citizen identity */}
            <div className="mt-5 overflow-hidden rounded-[var(--dl-radius-sm)] border border-white/10">
              <p className="flex items-center gap-1.5 border-b border-white/10 bg-emerald-500/15 px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-wider text-emerald-300">
                <CheckCircle2 aria-hidden="true" className="h-3 w-3" />
                Identity · pre-filled
              </p>
              <dl className="divide-y divide-white/10">
                {DEMO_CITIZEN_FIELDS.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 bg-white/5 px-3 py-2.5"
                  >
                    <dt className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--dl-text-muted)]">
                      <Icon aria-hidden="true" className="h-3.5 w-3.5 text-emerald-300/80" />
                      {label}
                    </dt>
                    <dd className="truncate font-mono text-sm font-semibold text-white">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {error && (
              <p className="mt-3 rounded-[var(--dl-radius-sm)] border border-[var(--dl-orange)]/40 bg-[var(--dl-orange)]/10 px-3 py-2 text-sm text-[var(--dl-orange-light)]">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleOneTap}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] bg-emerald-500 px-4 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] transition hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
              ) : (
                <Home aria-hidden="true" className="h-5 w-5" />
              )}
              {loading ? "Signing in…" : "One-Tap Experience"}
            </button>

            <p className="mt-3 text-center text-xs text-[var(--dl-text-muted)]">
              Demo session — no real phone or OTP used.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
"use client";

// ---------------------------------------------------------------------
// components/demo/AdminLoginModal.tsx — Phase 2 · Step 2 · One-tap gov
// demo login.
//
// Bypasses real auth to drop judges straight into the Command Center. The
// Government card on the two-door landing (/demo) opens this modal, which
// shows the pre-filled, VISIBLE demo credentials (email, password, role,
// district), then a single "One-Tap Login" button.
//
// One-tap calls the govDemoLogin server action — it mocks the
// authenticated session by writing the `role=district_admin` cookie (the
// middleware's auth signal) plus a `demo_mode=true` marker, then
// redirects to /gov/dashboard. Nothing to type, nothing to fail.
// ---------------------------------------------------------------------

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Lock, ShieldCheck, X } from "lucide-react";
import { govDemoLogin } from "@/app/actions/auth";
import { trackAnalytics } from "@/lib/demo/analytics";

export const DEMO_CREDENTIALS = [
  { label: "Email", value: "demo.admin@drip.gov.in" },
  { label: "Password", value: "demo1234" },
  { label: "Role", value: "district_admin" },
  { label: "District", value: "Patna" },
] as const;

type AdminLoginModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AdminLoginModal({ open, onClose }: AdminLoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOneTapLogin() {
    setError(null);
    setLoading(true);
    // Step 9 — record the presenter entering Government demo mode.
    trackAnalytics("mode.enter.government", "government");
    try {
      // Demo bypass: writes role=district_admin + demo_mode cookies and
      // redirects to /gov/dashboard (the action's redirect performs the
      // navigation; the try/catch only catches genuine failures).
      await govDemoLogin();
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
          aria-label="Demo government login"
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
            className="relative w-full max-w-md rounded-[var(--dl-radius)] border border-white/15 bg-[#0d1526] p-6 text-[var(--dl-text-on-navy)] shadow-[var(--dl-shadow-soft)]"
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
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--dl-blue)]/20 text-[var(--dl-blue-light)]">
                <ShieldCheck aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Government Official</p>
                <p className="text-xs text-[var(--dl-text-muted)]">
                  Command Center · One-tap demo access
                </p>
              </div>
            </div>

            {/* Pre-filled, visible demo credentials */}
            <div className="mt-5 overflow-hidden rounded-[var(--dl-radius-sm)] border border-white/10">
              <p className="flex items-center gap-1.5 border-b border-white/10 bg-[var(--dl-blue)]/15 px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--dl-blue-light)]">
                <Lock aria-hidden="true" className="h-3 w-3" />
                Demo credentials · pre-filled
              </p>
              <dl className="divide-y divide-white/10">
                {DEMO_CREDENTIALS.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 bg-white/5 px-3 py-2.5"
                  >
                    <dt className="text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--dl-text-muted)]">
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
              onClick={handleOneTapLogin}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] bg-[var(--dl-blue)] px-4 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition hover:bg-[var(--dl-blue-light)] active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
              ) : (
                <Lock aria-hidden="true" className="h-5 w-5" />
              )}
              {loading ? "Signing in…" : "One-Tap Login"}
            </button>

            <p className="mt-3 text-center text-xs text-[var(--dl-text-muted)]">
              Demo session — no real credentials required.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
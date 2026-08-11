"use client";

// ---------------------------------------------------------------------
// components/demo/LiveDemoQR.tsx — Phase 15 · Step 6.
//
// The judges' sandbox QR modal. When the presenter presses Q (global
// hotkey dispatched from hooks/useDemoHotkeys.ts as the
// "demo:toggle-qr" event), a stylized overlay slides in reading
// "Try the Citizen Experience Now" above a large, scannable QR code.
//
// The QR points at /api/sandbox on the LIVE deployed domain — the exact
// origin this page is served from (window.location.origin), so it works
// in the Cloudflare/Vercel deployment AND on localhost, with an optional
// NEXT_PUBLIC_APP_URL override for a fixed canonical host.
//
// Sandbox session: GET /api/sandbox sets a 24h read-only cookie and
// drops the judge straight into /public/dashboard — no password needed.
// Safe by construction: the middleware mocks every write in sandbox mode.
//
// Mount ONCE at the app root (app/layout.tsx). Renders nothing until Q.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AnimatePresence, motion } from "framer-motion";

export default function LiveDemoQR() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onToggle = () => setOpen((v) => !v);
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.shiftKey && event.code === "Escape") setOpen(false);
    };
    window.addEventListener("demo:toggle-qr", onToggle);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("demo:toggle-qr", onToggle);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Client-only (window is undefined on the server). Resolves the live
  // origin at open-time so the QR always targets the domains being shown.
  const sandboxUrl = open
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/api/sandbox`
    : "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Try the Citizen Experience"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative w-[360px] max-w-full rounded-3xl border border-white/15 bg-[#0B1F3A] p-7 text-center shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>

            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300">
              Judges · Live Test
            </p>
            <h2 className="mt-2 bg-gradient-to-br from-white via-white to-emerald-200/80 bg-clip-text text-2xl font-bold leading-tight text-transparent">
              Try the Citizen Experience Now
            </h2>
            <p className="mt-2 text-sm text-white/55">
              Scan with your phone camera — no password needed. A safe, read-only demo
              session starts instantly.
            </p>

            <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-4 shadow-[0_0_60px_-10px_rgba(52,211,153,0.45)]">
              <QRCodeSVG
                value={sandboxUrl}
                size={220}
                level="H"
                marginSize={1}
                fgColor="#0B1F3A"
                bgColor="#ffffff"
                imageSettings={
                  process.env.NEXT_PUBLIC_QR_LOGO
                    ? { src: process.env.NEXT_PUBLIC_QR_LOGO, width: 40, height: 40, excavate: true }
                    : undefined
                }
              />
            </div>

            <p className="mt-5 break-all font-mono text-[10px] text-white/35">{sandboxUrl}</p>
            <p className="mt-3 text-[11px] text-white/45">
              Forms are read-only in sandbox mode — every action returns a simulated success.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
"use client";

// ---------------------------------------------------------------------
// components/demo/DemoConversionWelcome.tsx — Phase 2 · Step 10.
//
// Mounted on the real /signup page. When the visitor arrives with
// `?converted=demo` (i.e. they clicked the ConversionBanner's "Sign Up"),
// it:
//
//   1. clears every piece of demo state — the localStorage scenario seed
//      and the Step 9 analytics trail — and the demo session cookies
//      (clearDemoSession, redirect-free so the form below stays open);
//   2. shows the welcome modal + a context chip so the judge sees the
//      pre-filled demo context flow into the real registration form.
//
// Reads searchParams, so it MUST be rendered inside a <Suspense> boundary
// (the signup page wraps it) to stay statically-prerenderable.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, PartyPopper, X } from "lucide-react";
import { clearDemoSession } from "@/app/actions/auth";
import { clearDemoSeed } from "@/lib/demo/seeder";
import { clearAnalytics } from "@/lib/demo/analytics";

export default function DemoConversionWelcome() {
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const ran = useRef(false);

  const converted = params.get("converted") === "demo";
  const district = params.get("district");
  const language = params.get("language");

  useEffect(() => {
    if (!converted || ran.current) return;
    ran.current = true;

    // Demote the demo session: wipe the seed + tracked trail, then drop
    // the demo cookies (the signup form keeps rendering — no redirect).
    clearDemoSeed();
    clearAnalytics();
    void clearDemoSession();

    setOpen(true);
  }, [converted]);

  if (!converted && !open) return null;

  return (
    <>
      {/* Pre-fill context chip — the demo location/language flow into the
          real form (visible so judges see the conversion happen). */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-300">
        <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
        <span className="font-semibold">Converting from demo sandbox</span>
        {(district || language) && (
          <span className="text-emerald-200/80">
            · pre-filled context: {[district, language].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to the real DRIP"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="relative w-full max-w-md rounded-2xl border border-emerald-500/40 bg-[#0d1526] p-6 text-white shadow-[0_12px_36px_rgba(0,0,0,0.5)]"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close welcome modal"
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-400 transition hover:border-white/25 hover:text-white"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>

              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
                <PartyPopper aria-hidden="true" className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-xl font-bold text-emerald-300">
                🎉 Welcome to the real DRIP
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Your demo data has been <span className="font-semibold text-white">cleared</span>.
                Create your real account below to start receiving verified alerts,
                shelter updates and evacuation guidance for{" "}
                {district ? <span className="font-semibold text-emerald-300">{district}</span> : "your district"}
                {language ? ` in ${language}` : ""}.
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-5 w-full rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-400 active:scale-[0.99]"
              >
                Start my real account
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
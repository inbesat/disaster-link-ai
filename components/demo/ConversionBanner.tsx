"use client";

// ---------------------------------------------------------------------
// components/demo/ConversionBanner.tsx — Phase 2 · Step 10 · Demo-to-real
// conversion flow.
//
// Persistent, dismissible bottom banner shown ONLY inside a demo session
// (gated in app/layout.tsx): "This is a demo. Want to register for real
// alerts? Sign Up →".
//
//   • "Sign Up" routes to the real /signup page while passing the demo
//     context (district + language) via URL params so the registration
//     form can prefill them — tracked as a conversion intent in Step 9.
//   • Dismiss hides the banner for this browser (localStorage).
//   • The /signup page itself hosts the "Welcome to the real DRIP — your
//     demo data has been cleared" modal (DemoConversionWelcome).
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { trackAnalytics, type DemoMode } from "@/lib/demo/analytics";

const DISMISS_KEY = "drip:conversion-dismissed";
const CITIZEN_LOCATION_KEY = "citizen_location";

type ConversionBannerProps = {
  mode: DemoMode;
};

export default function ConversionBanner({ mode }: ConversionBannerProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let stored = false;
    try {
      stored = window.localStorage.getItem(DISMISS_KEY) === "true";
    } catch {
      // Storage unavailable — banner shows as normal.
    }
    setDismissed(stored);
  }, []);

  // Never overlap the conversion welcome modal on /signup itself.
  if (dismissed || pathname === "/signup") return null;

  function resolveContext(): { district: string; language: string } {
    if (mode === "citizen") {
      let district = "Patna";
      try {
        const raw = window.localStorage.getItem(CITIZEN_LOCATION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { district?: string };
          if (parsed.district) district = parsed.district;
        }
      } catch {
        // Fall back to the modal's advertised location.
      }
      return { district, language: "Hindi" };
    }
    return { district: "Patna (Ganga)", language: "English" };
  }

  function handleSignUp() {
    trackAnalytics("conversion.signup.click", mode);
    const { district, language } = resolveContext();
    const params = new URLSearchParams({
      converted: "demo",
      district,
      language,
      mode,
    });
    router.push(`/signup?${params.toString()}`);
  }

  function handleDismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // Best-effort.
    }
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-2xl">
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/50 bg-[#0d1526]/95 px-4 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <Sparkles aria-hidden="true" className="h-5 w-5 shrink-0 text-amber-400" />
        <p className="min-w-0 flex-1 text-sm font-medium text-primary">
          This is a <span className="font-bold text-amber-400">demo</span>. Want to register
          for real alerts?
        </p>
        <button
          type="button"
          onClick={handleSignUp}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-amber-600 px-3.5 py-2 text-sm font-bold text-black transition hover:bg-amber-500 active:scale-95"
        >
          Sign Up <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss demo conversion banner"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-400 transition hover:border-white/25 hover:text-white"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
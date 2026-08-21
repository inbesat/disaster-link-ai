"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check 'Do Not Track' browser header/property
    if (typeof window !== "undefined") {
      const dnt = navigator.doNotTrack === "1" || (window as unknown as { doNotTrack?: string }).doNotTrack === "1";
      const consent = localStorage.getItem("safesphere_cookie_consent");
      if (!consent && !dnt) {
        setVisible(true);
      }
    }
  }, []);

  function acceptCookies() {
    localStorage.setItem("safesphere_cookie_consent", "accepted");
    setVisible(false);
  }

  function declineNonEssential() {
    localStorage.setItem("safesphere_cookie_consent", "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[90] max-w-xl rounded-lg border border-panel-border bg-panel-darker/95 p-4 shadow-2xl backdrop-blur sm:left-auto">
      <div className="flex items-start gap-3">
        <Cookie className="h-5 w-5 shrink-0 text-cyan-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground">Privacy & Cookie Consent</p>
          <p className="mt-1 text-xs text-slate-400">
            We use essential cookies for session authentication and system security. Non-essential operational analytics are optional. We respect &apos;Do Not Track&apos; browser signals.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={acceptCookies}
              className="rounded bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-cyan-500"
            >
              Accept All
            </button>
            <button
              type="button"
              onClick={declineNonEssential}
              className="rounded border border-panel-border bg-panel px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-panel-border"
            >
              Essential Only
            </button>
            <Link
              href="/settings/privacy/policy"
              className="text-xs font-semibold text-cyan-400 hover:underline"
            >
              Read Privacy Policy
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={declineNonEssential}
          className="text-slate-500 hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { X, Cookie, Check } from "lucide-react";

const COOKIE_CONSENT_KEY = "safesphere_cookie_consent";

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShow(true);
    } else {
      setAccepted(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: true,
      timestamp: Date.now(),
      version: "1.0",
    }));
    setAccepted(true);
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: false,
      timestamp: Date.now(),
      version: "1.0",
    }));
    setShow(false);
  };

  if (!show || accepted) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-96 z-50 animate-slide-up"
    >
      <div className="eoc-panel rounded-xl border border-border/50 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Cookie className="h-5 w-5 text-accent" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="cookie-title" className="font-semibold text-foreground">
              We value your privacy
            </h3>
            <p id="cookie-desc" className="mt-1 text-sm text-slate-400">
              We use cookies to enhance your experience, analyze traffic, and enable emergency features like
              offline alerts and location-based shelter routing.
            </p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleAccept}
                className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--dl-navy)]"
              >
                <span className="flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" aria-hidden />
                  Accept All
                </span>
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 rounded-md border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--dl-navy)]"
              >
                Decline
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              By accepting, you agree to our{" "}
              <a href="/settings/privacy/policy" className="underline hover:text-accent">Privacy Policy</a>
              {" "}and{" "}
              <a href="/settings/privacy/policy" className="underline hover:text-accent">Terms of Service</a>
              .
            </p>
          </div>
          <button
            onClick={handleDecline}
            aria-label="Dismiss cookie banner"
            className="flex-shrink-0 p-1 text-slate-500 hover:text-slate-300 transition"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

/**
 * Two-Factor Authentication setup page for admin users.
 * After Supabase login, admins must verify a TOTP code before accessing
 * the Admin Control Panel. This page simulates the flow — a real
 * implementation would use speakeasy + QR codes.
 */
export default function TwoFactorSetupPage() {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    // Simulate TOTP verification (accept any 6-digit code for demo)
    await new Promise((r) => setTimeout(r, 800));
    if (/^\d{6}$/.test(code)) {
      setVerified(true);
      showToast("success", { title: "2FA Verified", description: "You can now access the admin panel." });
      // Set a cookie that the middleware checks
      document.cookie = "2fa_verified=true; path=/; max-age=28800"; // 8 hours
      // Redirect to the original destination
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/admin";
      window.location.href = next;
    } else {
      showToast("error", { title: "Invalid Code", description: "Enter a 6-digit code (any code works for the demo)." });
    }
    setIsVerifying(false);
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--bg-primary)] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-subtle bg-secondary p-8 text-center">
        {verified ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <ShieldCheck className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-white">Verification Complete</h1>
            <p className="mt-2 text-sm text-muted">Redirecting to admin panel...</p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <ShieldAlert className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-white">Two-Factor Authentication</h1>
            <p className="mt-2 text-sm text-muted">
              Admin accounts require 2FA. Enter the 6-digit code from your authenticator app.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full rounded-lg border border-subtle bg-tertiary px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-white outline-none focus:border-accent"
              />
              <button
                onClick={handleVerify}
                disabled={isVerifying || code.length !== 6}
                className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
              >
                {isVerifying ? "Verifying..." : "Verify & Continue"}
              </button>
              <p className="text-xs text-muted">
                Demo: enter any 6 digits (e.g. 123456)
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

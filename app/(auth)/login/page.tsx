import type { Metadata } from "next";
import { Suspense } from "react";
import UnifiedLoginPage from "./UnifiedLoginPage";
import SupportButton from "@/components/ui/SupportButton";

// ---------------------------------------------------------------------
// app/(auth)/login/page.tsx — unified login entry point.
//
// Renders the single UnifiedLoginPage component which provides both
// Citizen (phone+OTP) and Government (email+password) auth behind a
// mode switcher. The ?mode=citizen|gov query param sets the initial tab.
//
// The old standalone pages at /gov/login and /public/login now redirect
// here for backward compatibility.
// ---------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Sign In | SafeSphere",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--dl-navy)]">
          <p className="eoc-label text-[var(--dl-blue-light)]">LOADING…</p>
        </main>
      }
    >
      <UnifiedLoginPage />
      <SupportButton />
    </Suspense>
  );
}

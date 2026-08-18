import type { Metadata } from "next";
import { Suspense } from "react";
import UnifiedAuthCard from "./UnifiedAuthCard";
import PasswordlessLogin from "./PasswordlessLogin";

export const metadata: Metadata = {
  title: "Sign In | SafeSphere",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background">
          <p className="eoc-label text-accent">LOADING…</p>
        </main>
      }
    >
      <main className="flex min-h-screen flex-col bg-background">
        <div className="my-auto flex w-full flex-col items-center gap-8 px-4 py-10">
          {/* Unified Sign In / Create Account card */}
          <UnifiedAuthCard />
          {/* Enterprise Security · GetOTP passwordless responder login */}
          <PasswordlessLogin />
        </div>
      </main>
    </Suspense>
  );
}

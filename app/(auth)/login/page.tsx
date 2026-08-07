import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In | Disaster Response",
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
      <LoginForm />
    </Suspense>
  );
}

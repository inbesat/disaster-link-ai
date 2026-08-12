import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

// ---------------------------------------------------------------------
// app/lite/layout.tsx — Phase 13 · Step 3 · Lite layout.
//
// Ultra-lightweight shell for feature phones. Server Component by design:
// no client hooks, no Tailwind complexity — just a plain, semantic HTML
// page. The only "chrome" is the document metadata; the page renders the
// content. The 5-minute auto-refresh <meta> lives in the page (it is
// hoisted into <head> by the App Router).
// ---------------------------------------------------------------------

export const metadata: Metadata = {
  title: "SafeSphere — Lite",
  description:
    "Offline-friendly disaster status for basic phones: district risk, nearest shelter and emergency numbers.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function LiteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

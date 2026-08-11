import type { Metadata } from "next";
import DemoPresentation from "@/components/demo/DemoPresentation";

// ---------------------------------------------------------------------
// app/demo/page.tsx — Phase 15 · Step 2 · Side-by-side presentation.
//
// Fullscreen pitch layout showing the Citizen App and the Gov Command
// Center interacting on ONE projector screen (50/50 split). The heavy
// lifting lives in DemoPresentation (client) — including the guest-session
// bootstrap so both embedded dashboards render under the middleware's
// dual-mode guards.
// ---------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Live Demo — Citizen & Gov | DRIP",
  description:
    "Side-by-side presentation mode: the Citizen App and Gov Command Center interacting in real time.",
};

export default function DemoPage() {
  return <DemoPresentation />;
}

import type { Metadata } from "next";
import DemoPresentation from "@/components/demo/DemoPresentation";

// ---------------------------------------------------------------------
// app/demo/present/page.tsx — Phase 15 · Step 2 (relocated).
//
// Fullscreen pitch layout showing the Citizen App and the Gov Command
// Center interacting on ONE projector screen (50/50 split). The heavy
// lifting lives in DemoPresentation (client) — including the guest-session
// bootstrap so both embedded dashboards render under the middleware's
// dual-mode guards.
//
// Phase 2 · Step 1 moved this off /demo (which is now the "Two Doors"
// landing page) to /demo/present so judges still have both entry points:
// pick a door, or open the side-by-side presentation directly.
// ---------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Live Demo — Citizen & Gov | DRIP",
  description:
    "Side-by-side presentation mode: the Citizen App and Gov Command Center interacting in real time.",
};

export default function DemoPresentPage() {
  return <DemoPresentation />;
}
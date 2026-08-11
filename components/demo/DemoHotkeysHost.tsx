"use client";

// ---------------------------------------------------------------------
// components/demo/DemoHotkeysHost.tsx — Phase 15 · Step 3.
//
// Mounts the invisible demo hotkeys at the app root (app/layout.tsx).
// Renders nothing — it exists purely so a client component ("use client")
// can run useDemoHotkeys() inside the server layout.
//
//   Shift+1  Critical Flood Warning
//   Shift+2  Shelter → FULL
//   Shift+3  Responder arrives on-scene
//   Shift+0  Reset hero scenario
// ---------------------------------------------------------------------

import useDemoHotkeys from "@/hooks/useDemoHotkeys";

export default function DemoHotkeysHost() {
  useDemoHotkeys();
  return null;
}

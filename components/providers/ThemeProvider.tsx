// ---------------------------------------------------------------------
// components/providers/ThemeProvider.tsx
// UI/UX Phase 1 · Step 10 — Dark Mode Theme Provider
//                 · Demo-day hardening · Step 6 — dark mode LOCKED.
//
// Wraps next-themes for the whole app. Dark-only by construction:
//   • attribute="class"          → toggles the `dark` class on <html> —
//     what tailwind darkMode:"class" and globals.css :root:not(.dark) read
//   • forcedTheme="dark"         → dark is THE only theme: next-themes
//     ignores storage/OS and always writes `dark`; useTheme().setTheme()
//     becomes a no-op. Projector-safe — zero risk of a white flash.
//   • defaultTheme="dark"        → fallback before the forced value applies
//   • enableSystem={false}       → never follows the OS theme (deterministic
//     demos — no surprise light flip mid-presentation on a projector)
//   • disableTransitionOnChange  → next-themes strips color transitions while
//     swapping, so the theme is instant (no washed-out flash)
//
// Demo-day decision (recorded): dark mode is LOCKED for the hackathon — a
// projector demo cannot risk a white flash. The ThemeToggle was removed
// from the landing page, the Navbar, and the DashboardTopBar, and the
// component file (components/ThemeToggle.tsx) was deleted (it's in git
// history). The light "day ops" palette still exists under
// :root:not(.dark) in globals.css (hybrid approach — legacy tokens kept)
// but is unreachable while forcedTheme is set. To re-enable light mode
// post-hackathon: drop `forcedTheme="dark"` and restore the toggle.
//
// INSTALL (only if starting fresh): npm install next-themes
// Already installed here — package.json: "next-themes": "^0.4.6"
// ---------------------------------------------------------------------

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Dark-locked theme provider. Must wrap any component that calls
 * `useTheme()` — with `forcedTheme="dark"` every `setTheme()` call is a
 * no-op, so the light palette cannot be reached during the demo.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

export default ThemeProvider;

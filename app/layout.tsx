import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Poppins } from "next/font/google";
import { cookies } from "next/headers";
import ToastViewport from "@/components/ui/Toast";
import EmergencyContactCard from "@/components/EmergencyContactCard";
import SimulationToggle from "@/components/admin/SimulationToggle";
import DemoController from "@/components/demo/DemoController";
import ShortcutModal from "@/components/ui/ShortcutModal";
import ThemeProvider from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { MapSettingsProvider } from "@/lib/settings/MapSettingsContext";
import { SIMULATION_COOKIE } from "@/lib/admin/simulation";
import "./globals.css";

// Phase 22 · Step 9 + UI Phase 1 · Step 9 — next/font/google (Inter for the
// UI, JetBrains Mono for technical data readouts — coordinates, timestamps,
// quotas). Exposed as --font-sans / --font-mono so tailwind.config.ts and
// globals.css pick them up. Fonts are self-hosted at build time (no runtime
// Google requests) and next/font applies fallback metric overrides, so text
// never shifts while fonts load (zero CLS). `display: swap` is implied.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Disaster Response Intelligence Platform",
  description:
    "Flood prediction, emergency planning, and resource allocation for the Bharat Shakti Hackathon.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const simulationActive = cookies().get(SIMULATION_COOKIE)?.value === "true";

  return (
    <html lang="en" suppressHydrationWarning>
      {/* bg-primary / text-primary = the roadmap tokens (globals.css also
          sets them on body — these classes make it explicit). */}
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${poppins.variable} bg-[#0B1F3A] text-primary antialiased scroll-smooth`}
      >
        {simulationActive && (
          <div
            role="alert"
            className="relative z-50 flex h-9 items-center justify-center overflow-hidden bg-[repeating-linear-gradient(45deg,#facc15_0_28px,#111111_28px_56px)]"
          >
            <span className="animate-pulse font-bold tracking-widest text-black drop-shadow">
              ⚠️ TRAINING SIMULATION MODE ACTIVE - NO REAL ALERTS WILL BE SENT ⚠️
            </span>
          </div>
        )}

        {/* SimulationToggle — bottom-LEFT so it never collides with the
            fixed elements that own the bottom-right corner: the emergency
            contact card (bottom-4 right-4 z-50, taller) used to fully cover
            this toggle on desktop, and on phones the one-handed Restore
            chip lives at bottom-[84px] right-3. Below md it clears the
            fixed mobile BottomNav (72px + safe area); at md+ it sits in the
            corner (no bottom nav there). Fixes the documented Phase-9/10
            overlay issue (the nav is z-30, this stays z-50). */}
        <div className="fixed bottom-[calc(72px+env(safe-area-inset-bottom)+12px)] left-4 z-50 md:bottom-4 md:left-4">
          <SimulationToggle active={simulationActive} />
        </div>

        <ThemeProvider>
          <LanguageProvider>
            <MapSettingsProvider>
              {children}
              <EmergencyContactCard />
            </MapSettingsProvider>
          </LanguageProvider>
        </ThemeProvider>

        {/* Phase 10 · Step 4 — secret pitch-day controller: renders nothing
            unless the URL carries ?demo=1. */}
        <DemoController />

        {/* Phase 11 · Step 5 — power-user shortcuts reference: renders
            nothing until "?" (Shift+/) is pressed. */}
        <ShortcutModal />

        <ToastViewport />
      </body>
    </html>
  );
}

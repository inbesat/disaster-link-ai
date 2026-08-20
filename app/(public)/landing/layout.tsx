import { Poppins, Inter } from "next/font/google";
import type { Metadata } from "next";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "SafeSphere — AI-Powered Disaster Management Platform",
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${poppins.variable} ${inter.variable} font-sans bg-[var(--brand-navy)] min-h-screen scroll-smooth`}
    >
      <main>{children}</main>
    </div>
  );
}

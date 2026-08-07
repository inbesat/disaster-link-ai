import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./server/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)",
          muted: "var(--surface-muted)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
        },
        severity: {
          green: {
            300: "var(--severity-green-300)",
            400: "var(--severity-green-400)",
            500: "var(--severity-green-500)",
            600: "var(--severity-green-600)",
          },
          amber: {
            300: "var(--severity-amber-300)",
            400: "var(--severity-amber-400)",
            500: "var(--severity-amber-500)",
            600: "var(--severity-amber-600)",
          },
          red: {
            300: "var(--severity-red-300)",
            400: "var(--severity-red-400)",
            500: "var(--severity-red-500)",
            600: "var(--severity-red-600)",
          },
          purple: {
            300: "var(--severity-purple-300)",
            400: "var(--severity-purple-400)",
            500: "var(--severity-purple-500)",
            600: "var(--severity-purple-600)",
          },
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          "var(--font-roboto-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        eoc: "0.625rem",
      },
      boxShadow: {
        "glow-green":
          "0 0 0 1px rgba(16, 185, 129, 0.4), 0 0 18px rgba(16, 185, 129, 0.25)",
        "glow-amber":
          "0 0 0 1px rgba(245, 158, 11, 0.4), 0 0 18px rgba(245, 158, 11, 0.25)",
        "glow-red": "0 0 0 1px rgba(239, 68, 68, 0.4), 0 0 18px rgba(239, 68, 68, 0.25)",
        "glow-purple":
          "0 0 0 1px rgba(168, 85, 247, 0.4), 0 0 18px rgba(168, 85, 247, 0.25)",
        "glow-accent":
          "0 0 0 1px rgba(56, 189, 248, 0.4), 0 0 18px rgba(56, 189, 248, 0.25)",
      },
      keyframes: {
        "pulse-ring": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        flash: {
          "0%, 100%": { boxShadow: "0 0 0 1px rgba(239,68,68,0.5), 0 0 22px rgba(239,68,68,0.4)" },
          "50%": { boxShadow: "0 0 0 1px rgba(239,68,68,0.1), 0 0 40px rgba(239,68,68,0.8)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.8s ease-in-out infinite",
        flash: "flash 1.6s ease-in-out infinite",
        marquee: "marquee 45s linear infinite",
      },
    },
  },
  plugins: [typography],
};

export default config;

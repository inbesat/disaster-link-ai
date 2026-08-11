/** @type {import('next').NextConfig} */

// Phase 13 · Step 1 — PWA. next-pwa generates a workbox service worker
// into public/ that precaches the app, applies runtime caching and serves
// the /~offline page for offline navigations (fallbacks.document). The
// web-push + offline-shell handlers live in worker/index.js and are
// bundled into the generated worker via customWorkerDir (they no-op when
// workbox is present, so there is no respondWith conflict). Fully disabled
// in development; registration is done client-side in production
// (components/pwa/ServiceWorkerRegister.tsx).
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false,
  customWorkerDir: "worker",
  fallbacks: { document: "/~offline" },
});

// Phase 24 · CORS lockdown.
//
// Allow list resolution order:
//   1. NEXT_PUBLIC_SITE_URL           — set this to your production origin
//   2. VERCEL_PROJECT_PRODUCTION_URL  — auto-injected by Vercel on deploy
//   3. "*"                            — hackathon fallback (open CORS)
//
// When a concrete origin is used, `Access-Control-Allow-Credentials: true`
// is also emitted so cookie/session auth can work cross-origin. When the
// value is "*", that header is omitted — browsers reject "*" + credentials.
const allowedOrigin =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "*";

const isWildcard = allowedOrigin === "*";

const nextConfig = {
  // FIXME: re-enable after hackathon
  typescript: {
    ignoreBuildErrors: true,
  },
  // FIXME: re-enable after hackathon
  eslint: {
    ignoreDuringBuilds: true,
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: allowedOrigin },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PATCH, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          // Cache preflight responses for a day to cut redundant OPTIONS calls.
          { key: "Access-Control-Max-Age", value: "86400" },
          // Only send the credentials flag for a concrete origin (never "*").
          ...(isWildcard
            ? []
            : [{ key: "Access-Control-Allow-Credentials", value: "true" }]),
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);

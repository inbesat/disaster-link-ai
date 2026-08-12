/** @type {import('next').NextConfig} */

// Phase 13 · Step 1 — PWA. next-pwa generates a workbox service worker
// into public/ that precaches the app, applies runtime caching and serves
// the /~offline page for offline navigations (fallbacks.document). The
// web-push + offline-shell handlers live in worker/index.js and are
// bundled into the generated worker via customWorkerDir (they no-op when
// workbox is present, so there is no respondWith conflict).
//
// The wrapper is applied ONLY outside development. Skipping it in dev
// means next-pwa never loads, so it stops printing its misleading
// "[PWA] PWA support is disabled" notice (twice per compile — node +
// edge) and adds zero webpack overhead during `next dev`. The service
// worker is still built on `next build` and registered client-side in
// production (components/pwa/ServiceWorkerRegister.tsx).
import withPWAInit from "next-pwa";

const isDev = process.env.NODE_ENV === "development";

const withPWA = withPWAInit({
  dest: "public",
  disable: false,
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
          // Security headers
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          // Security headers for all pages
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none';",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

// Skip the PWA plugin entirely in dev (fast cold starts, no misleading
// "[PWA] PWA support is disabled" log). Production keeps the service
// worker as before.
export default isDev ? nextConfig : withPWA(nextConfig);

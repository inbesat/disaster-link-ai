/** @type {import('next').NextConfig} */

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
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  "*";

const isWildcard = allowedOrigin === "*";

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
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

export default nextConfig;
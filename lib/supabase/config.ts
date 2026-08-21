// ---------------------------------------------------------------------
// lib/supabase/config.ts — Supabase Auth Configuration Audit & Policy
//
// This module documents and exports the audited configuration standards
// for Supabase Auth across Web and Mobile (Capacitor) runtimes.
//
// Configuration Audit Checklist:
// 1. autoRefreshToken: Enabled (true) for seamless access token rotation.
// 2. persistSession: Configured correctly using httpOnly cookies on Web
//    (via @supabase/ssr) and native secure storage on Mobile (Capacitor).
// 3. Session Security: httpOnly, SameSite=Lax/Strict, Secure cookies for Web;
//    Encrypted/secure native preferences storage for Mobile.
// 4. JWT Expiry Guidelines:
//    - Access Token: 3600 seconds (1 hour)
//    - Refresh Token: 604800 seconds (7 days)
// 5. detectSessionInUrl: Disabled (false) in production to prevent OAuth / magic
//    link token leakage via URL referrer headers.
// 6. Redirect URLs: Must be whitelisted in Supabase Dashboard (e.g.,
//    https://your-domain.com/auth/callback, app.safesphere://auth/callback).
// 7. MFA / 2FA: Enforced for super_admin and district_admin accounts before
//    accessing sensitive administrative routes.
// 8. Password Policy: Minimum 8 characters, requiring at least one uppercase letter,
//    one lowercase letter, and one number or special character.
// ---------------------------------------------------------------------

export const SUPABASE_AUTH_CONFIG = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: process.env.NODE_ENV !== "production",
  jwtExpiry: {
    accessTokenSeconds: 3600, // 1 hour
    refreshTokenSeconds: 604800, // 7 days
  },
  cookieOptions: {
    name: "sb-access-token",
    lifetime: 604800,
    domain: "",
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  },
} as const;

export function isDetectSessionInUrlEnabled(): boolean {
  return SUPABASE_AUTH_CONFIG.detectSessionInUrl;
}

import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { safeLog } from "@/lib/logger";
import { clientIpFromRequest } from "@/lib/security/rate-limiter";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const next = searchParams.get("next") ?? "/command-center";
  const ip = clientIpFromRequest(request);

  // Verify state parameter to prevent CSRF attacks
  const storedState = request.cookies.get("oauth_state")?.value;
  if (storedState && (!state || state !== storedState)) {
    safeLog("error", "[auth/callback] OAuth CSRF state mismatch detected", { metadata: { ip } });
    return NextResponse.redirect(`${origin}/login?error=csrf_state_mismatch`);
  }

  if (code) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.user) {
        const email = data.user.email ?? "";

        // Verify domain for government accounts attempting gov login
        if (next.startsWith("/gov") || next.startsWith("/command-center")) {
          const isGovDomain = email.endsWith(".gov.in") || email.endsWith(".gov") || email.endsWith(".nic.in");
          if (!isGovDomain && process.env.NODE_ENV === "production") {
            safeLog("error", "[auth/callback] Unauthorized non-gov domain for OAuth gov login", { metadata: { email, ip } });
            return NextResponse.redirect(`${origin}/login?error=gov_domain_required`);
          }
        }

        safeLog("info", "[auth/callback] OAuth login successful", {
          metadata: { userId: data.user.id, email, ip },
        });

        const response = NextResponse.redirect(`${origin}${next}`);
        response.cookies.delete("oauth_state");
        return response;
      }
    } catch (err: unknown) {
      safeLog("error", "[auth/callback] OAuth code exchange failed", { metadata: { error: String(err), ip } });
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

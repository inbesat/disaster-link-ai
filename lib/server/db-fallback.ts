// ---------------------------------------------------------------------
// lib/server/db-fallback.ts — dev-friendly Prisma fallback logging.
//
// Several API routes fall back to mock data when Postgres is unreachable
// (hackathon/demo setups where DATABASE_URL points at a placeholder like
// db.your-project-id.supabase.co). Logging the full Prisma stack trace on
// EVERY request drowns the dev console; this helper prints one concise
// warning per scope per server process instead.
//
//   catch (error) {
//     warnDbUnavailableOnce("public/shelters", error);
//     return mockResponse();
//   }
// ---------------------------------------------------------------------

const warnedScopes = new Set<string>();

/** True when DATABASE_URL still contains the scaffolded placeholder host. */
export function isPlaceholderDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.includes("your-project-id") || url.length === 0;
}

/**
 * Log a single concise line the first time a scope hits an unreachable DB.
 * Subsequent failures for the same scope are silent (the route already
 * serves its fallback), keeping the dev console readable.
 */
export function warnDbUnavailableOnce(scope: string, error: unknown): void {
  if (warnedScopes.has(scope)) return;
  warnedScopes.add(scope);

  const hint = isPlaceholderDatabaseUrl()
    ? "DATABASE_URL appears to be a placeholder — set real Supabase/Postgres credentials in .env to use live data."
    : "Check your database connection.";

  const message =
    error instanceof Error ? error.message.split("\n")[0] : String(error);

  console.warn(`[db-fallback] ${scope}: database unavailable (${message}). Serving mock data. ${hint}`);
}

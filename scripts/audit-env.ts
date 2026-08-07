// ---------------------------------------------------------------------
// scripts/audit-env.ts
// Phase 21 item 10 — environment variable security audit.
//
// Scans the local environment file and fails loudly if any *secret* key
// (API key, auth token, service role, private key, password, …) is
// prefixed with NEXT_PUBLIC_ — which would inline it into the Next.js
// client bundle and expose it to every visitor's browser.
//
//   Run:  npm run audit:env
//   Args: optional path to the env file (defaults to .env.local, then .env)
//
//   Exit codes (CI-friendly):
//     0 = clean — no sensitive keys exposed
//     1 = at least one NEXT_PUBLIC_ secret leak detected
//     2 = no env file found
//
// Values are NEVER printed in full — only a masked preview (first 6 + last
// 4 chars), so running the audit is itself safe to demo in public.
// ---------------------------------------------------------------------

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Substring patterns that mark a variable as a *secret*. Deliberately does
// NOT match NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_VAPID_PUBLIC_KEY —
// those are publishable by design.
const SENSITIVE_PATTERNS: RegExp[] = [
  /SERVICE_ROLE/i,
  /AUTH_TOKEN/i,
  /API_KEY/i,
  /SECRET/i,
  /PRIVATE_KEY/i,
  /PASSWORD/i,
  /CREDENTIAL/i,
  /TOKEN/i,
  /_SID/i,
];

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some((re) => re.test(key));
}

/** Mask a value so the audit never prints real secrets: `sk-or-…2c62`. */
function maskValue(value: string): string {
  const v = value.trim();
  if (v.length <= 12) return "[redacted]";
  return `${v.slice(0, 6)}…${v.slice(-4)}`;
}

/** Minimal dotenv-style parser: `KEY=value`, ignoring comments/blank lines. */
function parseEnv(raw: string): Map<string, string> {
  const vars = new Map<string, string>();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars.set(trimmed.slice(0, eq).trim(), value);
  }
  return vars;
}

function main(): void {
  const cliArg = process.argv[2];
  const candidates = [cliArg, ".env.local", ".env"].filter(
    (p): p is string => Boolean(p),
  );
  const file = candidates.find((p) => existsSync(resolve(p)));

  if (!file) {
    console.error(
      `[audit-env] No env file found (looked for: ${candidates.join(", ")}).`,
    );
    process.exit(2);
  }

  const vars = parseEnv(readFileSync(resolve(file), "utf8"));
  const publicKeys = Array.from(vars.keys()).filter((k) =>
    k.startsWith("NEXT_PUBLIC_"),
  );
  const leaks = publicKeys.filter((k) => isSensitiveKey(k));

  console.log(`\n[audit-env] Scanning ${file} (${vars.size} variables)`);
  console.log("=".repeat(64));
  console.log(`  Public (NEXT_PUBLIC_) keys : ${publicKeys.length}`);
  console.log(`  Server-only keys          : ${vars.size - publicKeys.length}`);

  if (leaks.length === 0) {
    console.log("\n  ✔ PASS — no sensitive keys exposed in the client bundle.\n");
    process.exit(0);
  }

  console.log(
    "\n  ✖ FAIL — SECRET LEAK: the following sensitive keys must NOT be NEXT_PUBLIC_:\n",
  );
  for (const key of leaks) {
    console.log(`    ${key}=${maskValue(vars.get(key) ?? "")}`);
    console.log(
      "      → Drop the NEXT_PUBLIC_ prefix. Server code can read the plain",
    );
    console.log(
      "        key directly from the environment; only the client bundle needs",
    );
    console.log("        NEXT_PUBLIC_ inlining.\n");
  }
  console.log(
    "  Next.js only inlines NEXT_PUBLIC_* variables into the client bundle —",
  );
  console.log(
    "  see docs/SECURITY_COMPLIANCE.md §2 (API Key & Secrets Management).\n",
  );
  process.exit(1);
}

main();

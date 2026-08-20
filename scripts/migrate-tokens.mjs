/**
 * Design-token migration codemod (Phase 1 · Prompt 1.1)
 * -----------------------------------------------------------------------------
 * Replaces hardcoded Tailwind arbitrary values with token-driven utilities /
 * CSS-var references across app/ and components/:
 *
 *   • Custom dark-panel family  : bg-[#0b1120] → bg-panel, border-[#1c2740] → border-panel-border, …
 *   • Roadmap dark surfaces     : bg-[#0a0f1a] → bg-primary, bg-[#0f172a] → bg-secondary, …
 *   • Slate text/border scale   : text-[#94a3b8] → text-secondary, text-[#64748b] → text-muted, …
 *   • Severity hexes            : text-[#34d399] → text-severity-green-400, …
 *   • SafeSphere brand hexes    : landing-scoped → var(--navy/--blue/--orange); elsewhere → bg-brand-*
 *   • Radius arbitrary values   : rounded-[14px] → rounded-lg, rounded-[16px] → rounded-[var(--radius-xl5)], …
 *   • Repeated floating shadows : shadow-[0_8px_24px_rgba(0,0,0,0.4)] → shadow-[var(--shadow-float-md)]
 *
 * Opacity safety: `[#hex]/opacity` combos are ONLY migrated when the target
 * utility has an RGB-channel color in tailwind.config.ts (panel/severity/brand/
 * surface/surface-elevated/surface-muted/border). The hijacked roadmap
 * utilities (bg-primary, text-secondary, … — plain var() rules in globals.css)
 * would resolve /opacity to the WRONG color, so those become
 * `bg-[rgb(var(--bg-primary-rgb)/0.95)]` form. var()-only landing targets are
 * left untouched when they carry an opacity modifier.
 *
 * Usage:
 *   node scripts/migrate-tokens.mjs          # apply
 *   node scripts/migrate-tokens.mjs --dry    # report only
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOTS = ["app", "components"];
const EXT = [".tsx", ".ts"];
const DRY = process.argv.includes("--dry");

const PREFIXES = ["bg", "text", "border", "divide", "from", "to", "via", "fill", "stroke", "ring", "outline", "decoration", "caret", "accent"];

/**
 * Hex → per-prefix target.
 *   "all": "name"      → every color prefix maps to the config color `name`
 *                        (safe with /opacity — RGB-channel-backed).
 *   { bg: "name" }     → only the listed prefixes map; those targets are
 *                        "hijacked" utilities (plain var() rules) so any
 *                        /opacity occurrence is converted to
 *                        `-[rgb(var(--<rgbVar>)/<n>)]` via `rgbVar`.
 *   { bg: { name, rgbVar } } → explicit rgb channel var for the slash case.
 */
const COLOR_MAP = {
  // Panel family (all prefixes that occur; config-backed, opacity-safe)
  "0b1120": { bg: "panel" },
  "0d1526": { bg: "panel-deep" },
  "020617": { bg: "panel-darker" },
  "131b30": { bg: "panel-hover" },
  "1a2338": { bg: "panel-hoverAlt" },
  "1a2740": { bg: "panel-chip" },
  "1c2740": { border: "panel-border" },
  "2a3a5c": { border: "panel-borderStrong" },
  "2a3a5a": { border: "panel-borderStrong" },
  "2c3f6d": { border: "panel-borderHover" },
  "151d31": { divide: "panel-divide" },
  "141d33": { divide: "panel-divide" },

  // Roadmap / legacy surfaces (hijacked utilities → rgb var form on /opacity)
  "0a0f1a": { bg: { name: "primary", rgbVar: "bg-primary-rgb" } },
  "0f172a": { bg: { name: "secondary", rgbVar: "bg-secondary-rgb" } },
  "111827": { bg: { name: "secondary", rgbVar: "bg-secondary-rgb" } },
  "1e293b": { bg: { name: "tertiary", rgbVar: "bg-tertiary-rgb" } },
  "0f1d38": { bg: { name: "surface", rgbVar: "surface-rgb" } },
  "17294d": { bg: { name: "surface-elevated", rgbVar: "surface-elevated-rgb" } },
  "0c1830": { bg: { name: "surface-muted", rgbVar: "surface-muted-rgb" } },
  "1e3056": { border: "border" },

  // Slate text scale (hijacked text utilities → rgb var form on /opacity)
  "94a3b8": { text: { name: "secondary", rgbVar: "text-secondary-rgb" }, other: "slate-400" },
  "64748b": { text: { name: "muted", rgbVar: "text-muted-rgb" }, other: "slate-500" },
  "f1f5f9": { text: { name: "primary", rgbVar: "text-primary-rgb" }, other: "slate-100" },

  // Severity (config-backed, opacity-safe, all prefixes)
  "34d399": { all: "severity-green-400" },
  "10b981": { all: "severity-green-500" },
  "059669": { all: "severity-green-600" },
  "6ee7b7": { all: "severity-green-300" },
  "f59e0b": { all: "severity-amber-500" },
  "fbbf24": { all: "severity-amber-400" },
  "fcd34d": { all: "severity-amber-300" },
  "d97706": { all: "severity-amber-600" },
  "ef4444": { all: "severity-red-500" },
  "f87171": { all: "severity-red-400" },
  "fca5a5": { all: "severity-red-300" },
  "dc2626": { all: "severity-red-600" },
  "a855f7": { all: "severity-purple-500" },
  "c084fc": { all: "severity-purple-400" },
  "d8b4fe": { all: "severity-purple-300" },
  "9333ea": { all: "severity-purple-600" },
  "7f1d1d": { all: "severity-critical" },
  "78350f": { all: "severity-warning" },
  "854d0e": { all: "severity-watch" },
  "064e3b": { all: "severity-safe" },
};

/** Brand palette — landing-scoped files map to the canonical scoped vars
 *  (hex-only, no /opacity possible); everything else to the global brand-*
 *  utilities (RGB-channel-backed). */
const BRAND_LANDING = {
  "0b1f3a": "navy",
  "0f2a4f": "navy-2",
  "132f57": "navy-3",
  "2563eb": "blue",
  "5b8df6": "blue-light",
  "f97316": "orange",
  "fdba74": "orange-light",
  "c9d6ec": "text-on-navy",
  "0f1b2d": "text-dark",
  "5b6b84": "text-muted",
  "f8fafc": "gray",
  "e7ecf3": "gray-2",
};

const BRAND_GLOBAL = {
  "0b1f3a": "brand-navy",
  "0f2a4f": "brand-navy2",
  "132f57": "brand-navy3",
  "2563eb": "brand-blue",
  "5b8df6": "brand-blueLight",
  "f97316": "brand-orange",
  "fdba74": "brand-orangeLight",
  "c9d6ec": "brand-textOnNavy",
  "0f1b2d": "brand-textDark",
  "5b6b84": "brand-textMuted",
  "f8fafc": "brand-gray",
  "e7ecf3": "brand-gray2",
};

/** Files under the .landing-page scope (canonical --navy/--blue/--orange vars
 *  are defined there, and the high-contrast override re-maps them). */
const LANDING_SCOPED = [
  "app" + sep + "(public)" + sep + "landing" + sep,
  "components" + sep + "landing" + sep,
  "app" + sep + "sections" + sep,
  "app" + sep + "page.tsx",
  "app" + sep + "(public)" + sep + "access" + sep,
  "app" + sep + "gov" + sep + "login" + sep,
  "app" + sep + "gov" + sep + "signup" + sep,
  "app" + sep + "public" + sep + "setup" + sep + "location" + sep,
  "app" + sep + "public" + sep + "setup" + sep + "family" + sep,
  "app" + sep + "public" + sep + "onboarding" + sep,
  "app" + sep + "public" + sep + "login" + sep,
  "app" + sep + "demo" + sep + "page.tsx",
];

/** Files that LOOK landing-scoped by path but render OUTSIDE the
 *  .landing-page element (their CSS vars aren't in scope) → use brand. */
const NOT_LANDING_SCOPED = ["app" + sep + "(public)" + sep + "landing" + sep + "layout.tsx"];

function isLandingScoped(filePath) {
  const rel = filePath.split(sep).join("/");
  if (NOT_LANDING_SCOPED.some((p) => rel === p.split(sep).join("/"))) return false;
  return LANDING_SCOPED.some((p) => {
    const norm = p.split(sep).join("/");
    return rel === norm || rel.startsWith(norm);
  });
}

/* ---------------------------------------------------------------------------
 * Rule construction
 * ------------------------------------------------------------------------- */

function escapeHex(hex) {
  return `(?:${hex}|${hex.toUpperCase()})`;
}

/** Build rules for the hijacked-style entries: { prefix: { name, rgbVar } }
 *  NOTE: Tailwind opacity syntax is `bg-[#hex]/95` — the slash lives OUTSIDE
 *  the bracket. No-slash matches → plain utility; slash matches → rgb-channel
 *  var form so the /opacity resolves to the roadmap color, not the config
 *  color the utility name collides with. */
function makeHijackRules(entry) {
  const rules = [];
  for (const [hex, spec] of Object.entries(entry)) {
    for (const [prefix, target] of Object.entries(spec)) {
      if (typeof target !== "object" || target === null) continue;
      const { name, rgbVar } = target;
      rules.push({
        re: new RegExp(`(^|[\\s:"'\`(])${prefix}-\\[#${escapeHex(hex)}\\](?!/)`, "gi"),
        replace: (m, lead) => `${lead}${prefix}-${name}`,
        hex,
      });
      rules.push({
        re: new RegExp(`(^|[\\s:"'\`(])${prefix}-\\[#${escapeHex(hex)}\\](?:\\/)([0-9.]+)`, "gi"),
        replace: (m, lead, alpha) => `${lead}${prefix}-[rgb(var(--${rgbVar})/${alpha})]`,
        hex,
      });
    }
  }
  return rules;
}

/** Build rules for plain config-color entries: { prefix: "name" | all } —
 *  these keep the /opacity modifier (RGB-channel-backed utilities). */
function makeColorRules(map, prefixFilter = PREFIXES) {
  const rules = [];
  for (const [hex, spec] of Object.entries(map)) {
    const prefixes = spec.all ? prefixFilter : Object.keys(spec).filter((k) => k !== "other");
    for (const prefix of prefixes) {
      const target = spec.all ?? spec[prefix];
      rules.push({
        re: new RegExp(`(^|[\\s:"'\`(])${prefix}-\\[#${escapeHex(hex)}\\](?:\\/([0-9.]+))?`, "gi"),
        replace: (m, lead, alpha) => `${lead}${prefix}-${target}${alpha ? `/${alpha}` : ""}`,
        hex,
      });
    }
    if (spec.other) {
      for (const prefix of prefixFilter.filter((p) => !spec[p] && p !== "all")) {
        rules.push({
          re: new RegExp(`(^|[\\s:"'\`(])${prefix}-\\[#${escapeHex(hex)}\\](?:\\/([0-9.]+))?`, "gi"),
          replace: (m, lead, alpha) => `${lead}${prefix}-${spec.other}${alpha ? `/${alpha}` : ""}`,
          hex,
        });
      }
    }
  }
  return rules;
}

/** Build rules for var()-reference brand targets (no /opacity allowed —
 *  Tailwind v3 cannot apply an alpha to an arbitrary var() value). */
function makeVarRules(brandMap) {
  const rules = [];
  for (const [hex, name] of Object.entries(brandMap)) {
    for (const prefix of PREFIXES) {
      rules.push({
        re: new RegExp(`(^|[\\s:"'\`(])${prefix}-\\[#${escapeHex(hex)}\\](?!/)`, "gi"),
        replace: (m, lead) => `${lead}${prefix}-[var(--${name})]`,
        hex,
      });
    }
  }
  return rules;
}

/* ---------------------------------------------------------------------------
 * Exact-string rules (radii, shadows)
 * ------------------------------------------------------------------------- */

const EXACT = [
  // Radius → roadmap scale utilities
  ["rounded-[14px]", "rounded-lg"],
  ["rounded-[18px]", "rounded-xl"],
  // Radius → landing display scale vars
  ["rounded-[12px]", "rounded-[var(--radius-xl4)]"],
  ["rounded-[16px]", "rounded-[var(--radius-xl5)]"],
  ["rounded-[20px]", "rounded-[var(--radius-xl6)]"],
  ["rounded-[22px]", "rounded-[var(--radius-xl2)]"],
  ["rounded-[26px]", "rounded-[var(--radius-xl3)]"],
  ["rounded-bl-[4px]", "rounded-bl-chat"],
  ["rounded-br-[4px]", "rounded-br-chat"],
  ["rounded-[4px]", "rounded-chat"],
  ["rounded-[2px]", "rounded-[var(--radius-micro)]"],
  // Floating shadows → consolidated vars
  ["shadow-[0_2px_12px_rgba(0,0,0,0.25)]", "shadow-[var(--shadow-float-sm)]"],
  ["shadow-[0_8px_24px_rgba(0,0,0,0.4)]", "shadow-[var(--shadow-float-md)]"],
  ["shadow-[0_8px_24px_rgba(0,0,0,0.5)]", "shadow-[var(--shadow-float-lg)]"],
  ["shadow-[0_16px_48px_rgba(0,0,0,0.5)]", "shadow-[var(--shadow-float-xl)]"],
  ["shadow-[0_20px_60px_rgba(0,0,0,0.6)]", "shadow-[var(--shadow-float-xxl)]"],
  ["shadow-[0_-12px_48px_rgba(0,0,0,0.6)]", "shadow-[var(--shadow-float-sheet)]"],
].map(([from, to]) => ({ from, to, count: 0 }));

/* ---------------------------------------------------------------------------
 * Walk & apply
 * ------------------------------------------------------------------------- */

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walk(full, out);
    } else if (EXT.some((e) => entry.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

const files = ROOTS.flatMap((r) => walk(r));
const RULE_SETS = {
  landing: [
    ...makeHijackRules(COLOR_MAP),
    ...makeColorRules(COLOR_MAP),
    ...makeVarRules(BRAND_LANDING),
  ],
  global: [
    ...makeHijackRules(COLOR_MAP),
    ...makeColorRules(COLOR_MAP),
    ...makeVarRules(BRAND_GLOBAL),
  ],
};

const summary = {};
let changedFiles = 0;

for (const file of files) {
  const rel = relative(process.cwd(), file);
  let src = readFileSync(file, "utf8");
  const before = src;

  const rules = isLandingScoped(file) ? RULE_SETS.landing : RULE_SETS.global;

  for (const rule of rules) {
    src = src.replace(rule.re, (...args) => {
      const m = args[0];
      const lead = args[1];
      const replaced = rule.replace(...args);
      if (replaced !== m) {
        summary[replaced.slice(lead.length)] = (summary[replaced.slice(lead.length)] ?? 0) + 1;
      }
      return replaced;
    });
  }

  for (const rule of EXACT) {
    if (src.includes(rule.from)) {
      const occurrences = src.split(rule.from).length - 1;
      src = src.split(rule.from).join(rule.to);
      rule.count += occurrences;
      summary[rule.to] = (summary[rule.to] ?? 0) + occurrences;
    }
  }

  if (src !== before) {
    changedFiles++;
    if (!DRY) writeFileSync(file, src);
  }
}

console.log(DRY ? "── DRY RUN (no files written) ──" : "── MIGRATION COMPLETE ──");
console.log(`Files changed: ${changedFiles}`);
console.log("\nTop replacements:");
const sorted = Object.entries(summary).sort((a, b) => b[1] - a[1]);
for (const [to, n] of sorted.slice(0, 45)) {
  console.log(`  ${String(n).padStart(5)}  ${to}`);
}
const total = Object.values(summary).reduce((a, b) => a + b, 0);
console.log(`\nTotal replacements: ${total}`);
if (!DRY) {
  console.log("\nRun `npm run tokens:check` and `npm run lint` to verify.");
}
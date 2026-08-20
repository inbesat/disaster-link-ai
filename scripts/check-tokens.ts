/**
 * Token drift check — asserts that every color var declared in app/globals.css
 * matches the single source of truth in styles/tokens.ts.
 *
 * Usage: npm run tokens:check
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { colors, rgbChannels, radiusRem } from "../styles/tokens";

const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");

/** Flatten a nested token object into a path map: { "background.primary": "#0a0f1a" } */
function flatten(obj: unknown, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "string") {
        out[key] = v;
      } else {
        flatten(v, key, out);
      }
    }
  }
  return out;
}

/** Read a CSS custom property's value from globals.css :root blocks. */
function cssVar(name: string): string | undefined {
  const re = new RegExp(`--${name}:\\s*([^;]+);`);
  const m = css.match(re);
  return m ? m[1].trim() : undefined;
}

const VAR_MAP: Record<string, string> = {
  "bg-primary": "background.primary",
  "bg-secondary": "background.secondary",
  "bg-tertiary": "background.tertiary",
  "accent-primary": "accent.primary",
  "accent-danger": "accent.danger",
  "accent-warning": "accent.warning",
  "accent-success": "accent.success",
  "accent-purple": "accent.purple",
  "text-primary": "text.primary",
  "text-secondary": "text.secondary",
  "text-muted": "text.muted",
  "border-subtle": "border.subtle",
  "border-active": "border.active",
  "severity-critical": "severity.critical",
  "severity-warning": "severity.warning",
  "severity-watch": "severity.watch",
  "severity-safe": "severity.safe",
  "severity-green-300": "severityScale.green.300",
  "severity-green-400": "severityScale.green.400",
  "severity-green-500": "severityScale.green.500",
  "severity-green-600": "severityScale.green.600",
  "severity-amber-300": "severityScale.amber.300",
  "severity-amber-400": "severityScale.amber.400",
  "severity-amber-500": "severityScale.amber.500",
  "severity-amber-600": "severityScale.amber.600",
  "severity-red-300": "severityScale.red.300",
  "severity-red-400": "severityScale.red.400",
  "severity-red-500": "severityScale.red.500",
  "severity-red-600": "severityScale.red.600",
  "severity-purple-300": "severityScale.purple.300",
  "severity-purple-400": "severityScale.purple.400",
  "severity-purple-500": "severityScale.purple.500",
  "severity-purple-600": "severityScale.purple.600",
  surface: "surface.base",
  "surface-elevated": "surface.elevated",
  "surface-muted": "surface.muted",
  border: "borderLegacy.DEFAULT",
  "border-strong": "borderLegacy.strong",
  accent: "accent.sky",
  card: "shadcn.card",
  "card-foreground": "shadcn.cardForeground",
  popover: "shadcn.popover",
  "popover-foreground": "shadcn.popoverForeground",
  primary: "shadcn.primary",
  "primary-foreground": "shadcn.primaryForeground",
  secondary: "shadcn.secondary",
  "secondary-foreground": "shadcn.secondaryForeground",
  muted: "shadcn.muted",
  "muted-foreground": "shadcn.mutedForeground",
  "accent-foreground": "shadcn.accentForeground",
  destructive: "shadcn.destructive",
  "destructive-foreground": "shadcn.destructiveForeground",
  input: "shadcn.input",
  ring: "shadcn.ring",
  panel: "panel.DEFAULT",
  "panel-deep": "panel.deep",
  "panel-darker": "panel.darker",
  "panel-hover": "panel.hover",
  "panel-hover-alt": "panel.hoverAlt",
  "panel-border": "panel.border",
  "panel-border-strong": "panel.borderStrong",
  "panel-border-hover": "panel.borderHover",
  "panel-divide": "panel.divide",
  "panel-chip": "panel.chip",
  "brand-navy": "brand.navy",
  "brand-navy-2": "brand.navy2",
  "brand-navy-3": "brand.navy3",
  "brand-blue": "brand.blue",
  "brand-blue-light": "brand.blueLight",
  "brand-orange": "brand.orange",
  "brand-orange-light": "brand.orangeLight",
  "brand-white": "brand.white",
  "brand-gray": "brand.gray",
  "brand-gray-2": "brand.gray2",
  "brand-text-dark": "brand.textDark",
  "brand-text-muted": "brand.textMuted",
  "brand-text-on-navy": "brand.textOnNavy",
  "bg-primary-rgb": "background.primary",
  "bg-secondary-rgb": "background.secondary",
  "bg-tertiary-rgb": "background.tertiary",
  "accent-primary-rgb": "accent.primary",
  "accent-danger-rgb": "accent.danger",
  "accent-warning-rgb": "accent.warning",
  "accent-success-rgb": "accent.success",
  "accent-purple-rgb": "accent.purple",
  "text-primary-rgb": "text.primary",
  "text-secondary-rgb": "text.secondary",
  "text-muted-rgb": "text.muted",
  "border-subtle-rgb": "border.subtle",
  "border-active-rgb": "border.active",
  "severity-critical-rgb": "severity.critical",
  "severity-warning-rgb": "severity.warning",
  "severity-watch-rgb": "severity.watch",
  "severity-safe-rgb": "severity.safe",
  "severity-green-300-rgb": "severityScale.green.300",
  "severity-green-400-rgb": "severityScale.green.400",
  "severity-green-500-rgb": "severityScale.green.500",
  "severity-green-600-rgb": "severityScale.green.600",
  "severity-amber-300-rgb": "severityScale.amber.300",
  "severity-amber-400-rgb": "severityScale.amber.400",
  "severity-amber-500-rgb": "severityScale.amber.500",
  "severity-amber-600-rgb": "severityScale.amber.600",
  "severity-red-300-rgb": "severityScale.red.300",
  "severity-red-400-rgb": "severityScale.red.400",
  "severity-red-500-rgb": "severityScale.red.500",
  "severity-red-600-rgb": "severityScale.red.600",
  "severity-purple-300-rgb": "severityScale.purple.300",
  "severity-purple-400-rgb": "severityScale.purple.400",
  "severity-purple-500-rgb": "severityScale.purple.500",
  "severity-purple-600-rgb": "severityScale.purple.600",
  "surface-rgb": "surface.base",
  "surface-elevated-rgb": "surface.elevated",
  "surface-muted-rgb": "surface.muted",
  "border-rgb": "borderLegacy.DEFAULT",
  "border-strong-rgb": "borderLegacy.strong",
  "card-rgb": "shadcn.card",
  "card-foreground-rgb": "shadcn.cardForeground",
  "popover-rgb": "shadcn.popover",
  "popover-foreground-rgb": "shadcn.popoverForeground",
  "primary-rgb": "shadcn.primary",
  "primary-foreground-rgb": "shadcn.primaryForeground",
  "secondary-rgb": "shadcn.secondary",
  "secondary-foreground-rgb": "shadcn.secondaryForeground",
  "muted-rgb": "shadcn.muted",
  "muted-foreground-rgb": "shadcn.mutedForeground",
  "accent-foreground-rgb": "shadcn.accentForeground",
  "destructive-rgb": "shadcn.destructive",
  "destructive-foreground-rgb": "shadcn.destructiveForeground",
  "input-rgb": "shadcn.input",
  "ring-rgb": "shadcn.ring",
  "panel-rgb": "panel.DEFAULT",
  "panel-deep-rgb": "panel.deep",
  "panel-darker-rgb": "panel.darker",
  "panel-hover-rgb": "panel.hover",
  "panel-hover-alt-rgb": "panel.hoverAlt",
  "panel-border-rgb": "panel.border",
  "panel-border-strong-rgb": "panel.borderStrong",
  "panel-border-hover-rgb": "panel.borderHover",
  "panel-divide-rgb": "panel.divide",
  "panel-chip-rgb": "panel.chip",
  "brand-navy-rgb": "brand.navy",
  "brand-navy-2-rgb": "brand.navy2",
  "brand-navy-3-rgb": "brand.navy3",
  "brand-blue-rgb": "brand.blue",
  "brand-blue-light-rgb": "brand.blueLight",
  "brand-orange-rgb": "brand.orange",
  "brand-orange-light-rgb": "brand.orangeLight",
  "brand-white-rgb": "brand.white",
  "brand-gray-rgb": "brand.gray",
  "brand-gray-2-rgb": "brand.gray2",
  "brand-text-dark-rgb": "brand.textDark",
  "brand-text-muted-rgb": "brand.textMuted",
  "brand-text-on-navy-rgb": "brand.textOnNavy",
};

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

const hexTokens = flatten(colors);
const rgbTokens = flatten(rgbChannels);

let failures = 0;

for (const [varName, tokenPath] of Object.entries(VAR_MAP)) {
  const expectedHex = hexTokens[tokenPath];
  const expectedRgb = rgbTokens[tokenPath] ?? (expectedHex ? hexToRgb(expectedHex) : undefined);
  const actual = cssVar(varName);
  if (actual === undefined) {
    console.error(`MISSING var --${varName} (expected from tokens.${tokenPath})`);
    failures++;
    continue;
  }
  const isRgbVar = varName.endsWith("-rgb");
  const expected = isRgbVar ? expectedRgb : expectedHex;
  if (expected !== undefined && actual.toLowerCase() !== expected.toLowerCase()) {
    console.error(
      `DRIFT --${varName}: css=${actual} expected=${expected} (tokens.${tokenPath})`,
    );
    failures++;
  }
}

const lightBlocks = css.match(/:root:not\(\.dark\)\s*\{([^}]+)\}/g) ?? [];
const lightCss = lightBlocks.join("\n");
function cssVarLight(name: string): string | undefined {
  const re = new RegExp(`--${name}:\\s*([^;]+);`);
  const m = lightCss.match(re);
  return m ? m[1].trim() : undefined;
}

const lightTokens = flatten(colors.light as unknown as Record<string, unknown>);

const lightChecks: Array<[string, string]> = [
  ["bg-primary", "background.primary"],
  ["bg-secondary", "background.secondary"],
  ["bg-tertiary", "background.tertiary"],
  ["accent-primary", "accent.primary"],
  ["accent-danger", "accent.danger"],
  ["accent-warning", "accent.warning"],
  ["accent-success", "accent.success"],
  ["accent-purple", "accent.purple"],
  ["text-primary", "text.primary"],
  ["text-secondary", "text.secondary"],
  ["text-muted", "text.muted"],
  ["border-subtle", "border.subtle"],
  ["border-active", "border.active"],
  ["severity-critical", "severity.critical"],
  ["severity-warning", "severity.warning"],
  ["severity-watch", "severity.watch"],
  ["severity-safe", "severity.safe"],
];

for (const [varName, tokenPath] of lightChecks) {
  const expected = lightTokens[tokenPath];
  const actual = cssVarLight(varName);
  if (actual === undefined) {
    console.error(`MISSING light var --${varName} (expected from tokens.light.${tokenPath})`);
    failures++;
    continue;
  }
  if (expected !== undefined && actual.toLowerCase() !== expected.toLowerCase()) {
    console.error(`DRIFT light --${varName}: css=${actual} expected=${expected} (tokens.light.${tokenPath})`);
    failures++;
  }
}

for (const [key, expected] of Object.entries(radiusRem)) {
  const actual = cssVar(`radius-${key}`);
  if (actual === undefined) {
    console.error(`MISSING radius var --radius-${key} (expected ${expected})`);
    failures++;
  } else if (actual.toLowerCase() !== expected.toLowerCase()) {
    console.error(`DRIFT --radius-${key}: css=${actual} expected=${expected}`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n${failures} token drift issue(s) found. Fix app/globals.css or styles/tokens.ts.`);
  process.exit(1);
}

console.log("✓ tokens.ts ↔ globals.css are in sync.");
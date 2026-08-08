// TEMP check (Phase 1 final) — compile globals.css through the exact
// PostCSS+Tailwind pipeline and assert the roadmap utilities + severity
// tints (dark + light) exist, and no stale .glow-* classes remain.
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const cwd = process.cwd();
const input = readFileSync(resolve(cwd, "app/globals.css"), "utf8");
const result = await postcss([tailwindcss(resolve(cwd, "tailwind.config.ts"))]).process(input, {
  from: resolve(cwd, "app/globals.css"),
});
const out = result.css;

const checks = [
  ".bg-primary",
  ".bg-secondary",
  ".bg-tertiary",
  ".text-primary",
  ".text-secondary",
  ".text-muted",
  ".border-subtle",
  ".border-active",
  ".glow-blue-soft",
  ".glow-red-soft",
  ".glow-amber-soft",
  ".bg-surface",
  ".rounded-eoc",
  ".eoc-panel",
  // Dark severity tints (base :root)
  "#7f1d1d",
  "#78350f",
  "#854d0e",
  "#064e3b",
  // Light severity tints (:root:not(.dark))
  "#fecaca",
  "#fed7aa",
  "#fef3c7",
  "#d1fae5",
];

let failed = 0;
for (const c of checks) {
  const ok = out.includes(c);
  console.log(`${ok ? "OK " : "MISS"}  ${c}`);
  if (!ok) failed++;
}

const staleGlow = out.includes(".glow-blue{") || out.includes(".glow-blue {") ||
  out.includes(".glow-red{") || out.includes(".glow-red {") ||
  out.includes(".glow-amber{") || out.includes(".glow-amber {");
console.log(staleGlow ? "FAIL  stale .glow-* plain class found" : "OK    no stale .glow-* plain classes");

console.log(failed === 0 && !staleGlow ? "\nCSS COMPILE OK" : "\nCSS CHECKS FAILED");
process.exit(failed === 0 && !staleGlow ? 0 : 1);

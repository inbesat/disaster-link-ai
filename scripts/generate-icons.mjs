#!/usr/bin/env node
// ---------------------------------------------------------------------
// scripts/generate-icons.mjs — Regenerate SafeSphere brand assets.
//
// The canonical mark is the SafeSphere "shield" (components/ui/Logo.tsx).
// This script rasterizes the source SVGs in assets/ and writes every
// derivative the app needs:
//
//   • PWA icons  → public/icons/icon-192.png, icon-512.png (any) and
//                  icon-512-maskable.png (maskable-safe, shield ~60%)
//   • Favicon    → app/favicon.ico (multi-size PNG-in-ICO container)
//
// Android launcher icons are generated separately with:
//   npx capacitor-assets generate --android --pwa
//   (reads assets/icon-only.svg, icon-foreground.svg, icon-background.svg)
//
// Run: node scripts/generate-icons.mjs
// ---------------------------------------------------------------------

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const ICON_ONLY = join(root, "assets", "icon-only.svg");
const ICON_MASKABLE = join(root, "assets", "icon-maskable.svg");
const NAVY = "#0a0f1a";

async function renderToPng(svgPath, size) {
  return sharp(svgPath, { density: 96 }).resize(size, size).png().toBuffer();
}

function buildIco(pngBuffers) {
  // ICO container with embedded PNG images (Vista+). The first 256px
  // entry uses width/height byte 0 per the ICO spec.
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const entries = [];
  let offset = 6 + 16 * count;
  for (const buf of pngBuffers) {
    const entry = Buffer.alloc(16);
    const sizePx = Math.sqrt(buf.length) > 0 ? Math.round(Math.sqrt(buf.readUInt32BE(16))) : 0;
    const dim = sizePx >= 256 ? 0 : sizePx;
    entry.writeUInt8(dim, 0); // width (0 == 256)
    entry.writeUInt8(dim, 1); // height
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += buf.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

async function main() {
  mkdirSync(join(root, "public", "icons"), { recursive: true });

  // PWA "any" icons — full-bleed navy + shield.
  for (const size of [192, 512]) {
    const png = await renderToPng(ICON_ONLY, size);
    writeFileSync(join(root, "public", "icons", `icon-${size}.png`), png);
    console.log(`public/icons/icon-${size}.png`);
  }

  // Maskable icon — navy background + shield at ~60% (inside the 80%
  // safe zone Android crops to a circle).
  for (const size of [192, 512]) {
    const maskable = await renderToPng(ICON_MASKABLE, size);
    writeFileSync(join(root, "public", "icons", `icon-${size}-maskable.png`), maskable);
    console.log(`public/icons/icon-${size}-maskable.png`);
  }

  // Favicon — multi-size ICO.
  const faviconSizes = [16, 32, 48, 64, 128, 256];
  const faviconPngs = [];
  for (const size of faviconSizes) {
    faviconPngs.push(await renderToPng(ICON_ONLY, size));
  }
  writeFileSync(join(root, "app", "favicon.ico"), buildIco(faviconPngs));
  console.log("app/favicon.ico");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
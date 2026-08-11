// scripts/gen-icons.mjs — Phase 13 · Step 1 · PWA icon generator.
//
// Produces public/icons/icon-192.png + icon-512.png (installable manifest
// icons) and icon.svg. Design: dark navy field, orange beacon circle with
// white broadcast arcs — the alert identity of the app. Pure Node (zlib
// deflate + hand-rolled CRC32/PNG chunks), no canvas dependency.
//
// Run: node scripts/gen-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

// ---------------------------------------------------------------------
// Minimal PNG encoder (RGBA, 8-bit, no interlace)
// ---------------------------------------------------------------------
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, pixelFn) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA

  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y, size);
      const o = rowStart + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const idat = deflateSync(raw);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------
// Icon design: navy field + orange beacon + white broadcast arcs.
// ---------------------------------------------------------------------
const NAVY = [10, 15, 26]; // #0a0f1a (theme_color)
const ORANGE = [249, 115, 22]; // #F97316

function pixelFn(x, y, size) {
  const cx = (x + 0.5) / size - 0.5;
  const cy = (y + 0.5) / size - 0.5;
  const dist = Math.hypot(cx, cy) * 2; // 0 at center, 1 at mid-edge
  const angle = Math.atan2(cy, cx);

  // Beacon circle with a lighter core.
  if (dist <= 0.42) {
    const t = dist / 0.42;
    const r = Math.round(ORANGE[0] + (255 - ORANGE[0]) * (1 - t) * 0.3);
    const g = Math.round(ORANGE[1] + (255 - ORANGE[1]) * (1 - t) * 0.35);
    const b = Math.round(ORANGE[2] + (255 - ORANGE[2]) * (1 - t) * 0.45);
    return [r, g, b, 255];
  }

  // Broadcast arcs on the right side of the beacon.
  const arcs = [
    [0.47, 0.51],
    [0.55, 0.59],
    [0.63, 0.67],
  ];
  const onRight = Math.abs(angle) <= 0.6;
  for (const [lo, hi] of arcs) {
    if (onRight && dist >= lo && dist <= hi) return [255, 255, 255, 235];
  }

  return [...NAVY, 255];
}

const outDir = new URL("../public/icons/", import.meta.url);
mkdirSync(outDir, { recursive: true });

writeFileSync(new URL("icon-192.png", outDir), encodePng(192, pixelFn));
writeFileSync(new URL("icon-512.png", outDir), encodePng(512, pixelFn));
writeFileSync(
  new URL("icon.svg", outDir),
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0a0f1a"/>
  <circle cx="256" cy="256" r="150" fill="#F97316"/>
  <circle cx="256" cy="256" r="120" fill="#fdba74"/>
  <path d="M368 256 a112 112 0 0 1 -112 112" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round"/>
  <path d="M392 256 a136 136 0 0 1 -136 136" fill="none" stroke="#ffffff" stroke-width="14" stroke-linecap="round"/>
  <path d="M416 256 a160 160 0 0 1 -160 160" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round"/>
</svg>
`,
);
console.log("Generated public/icons/icon-192.png, icon-512.png, icon.svg");

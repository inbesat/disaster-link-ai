// ---------------------------------------------------------------------
// scripts/generate-demo-audio.ts — Phase 9 · demo alert audio samples.
//
// Synthesises 5 radio-ready EWS alert tones (Hindi + English pairs) into
// /public/demo-audio/ with ZERO dependencies — pure PCM WAV generation
// (44100 Hz · 16-bit · mono). Structure per clip, matching the radio
// compliance convention in lib/tts/beep.ts:
//
//   [0.0–0.5 s] 1000 Hz beep (EWS attention tone)
//   [0.5–4.5 s] two-tone emergency siren (600 Hz ⇄ 900 Hz)
//   [4.5–5.0 s] fade-out
//
// These are placeholder alert tones for the pitch deck / judges' sandbox.
// When TTS provider keys are configured, replace them with real voices
// via /api/tts/generate — the filenames and <audio> usages stay the same.
//
// Run:  npx tsx scripts/generate-demo-audio.ts
// ---------------------------------------------------------------------

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SAMPLE_RATE = 44_100;
const OUTPUT_DIR = join(process.cwd(), "public", "demo-audio");

/** One sample: filename + the language label shown in the demo UI. */
const SAMPLES = [
  { file: "flood_hi.wav", label: "Flood alert — Hindi" },
  { file: "flood_en.wav", label: "Flood alert — English" },
  { file: "cyclone_hi.wav", label: "Cyclone alert — Hindi" },
  { file: "cyclone_en.wav", label: "Cyclone alert — English" },
  { file: "earthquake_hi.wav", label: "Earthquake alert — Hindi" },
] as const;

/** Two-tone siren: alternates low/high frequency every cycleSeconds. */
function sirenSample(
  durationSeconds: number,
  lowHz: number,
  highHz: number,
  cycleSeconds: number,
): Float32Array {
  const n = Math.floor(durationSeconds * SAMPLE_RATE);
  const samples = new Float32Array(n);
  const cycle = Math.floor(cycleSeconds * SAMPLE_RATE);
  for (let i = 0; i < n; i += 1) {
    const phase = i % cycle;
    const freq = phase < cycle / 2 ? lowHz : highHz;
    const t = i / SAMPLE_RATE;
    samples[i] = Math.sin(2 * Math.PI * freq * t) * 0.55;
  }
  return samples;
}

/** Standard 1000 Hz attention beep (mirrors lib/tts/beep.ts). */
function beepSample(durationSeconds: number, freqHz = 1000): Float32Array {
  const n = Math.floor(durationSeconds * SAMPLE_RATE);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.min(1, i / (SAMPLE_RATE * 0.01), (n - i) / (SAMPLE_RATE * 0.02));
    samples[i] = Math.sin(2 * Math.PI * freqHz * t) * 0.7 * Math.max(0, envelope);
  }
  return samples;
}

/** Concatenate clips and apply a global fade-out over the last fadeMs. */
function assemble(clips: Float32Array[], fadeMs: number): Float32Array {
  const total = clips.reduce((sum, c) => sum + c.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const clip of clips) {
    out.set(clip, offset);
    offset += clip.length;
  }
  const fadeSamples = Math.floor((fadeMs / 1000) * SAMPLE_RATE);
  for (let i = 0; i < fadeSamples; i += 1) {
    const idx = total - 1 - i;
    if (idx >= 0) out[idx] *= (fadeSamples - i) / fadeSamples;
  }
  return out;
}

/** Encode a Float32Array (−1..1) as a 16-bit PCM WAV Buffer. */
function wavBuffer(samples: Float32Array): Buffer {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buffer;
}

function buildAlertClip(): Float32Array {
  return assemble(
    [
      beepSample(0.5, 1000), // attention beep
      sirenSample(4.0, 600, 900, 0.5), // two-tone siren
    ],
    600, // fade out over the tail
  );
}

mkdirSync(OUTPUT_DIR, { recursive: true });
for (const sample of SAMPLES) {
  const buffer = wavBuffer(buildAlertClip());
  const path = join(OUTPUT_DIR, sample.file);
  writeFileSync(path, buffer);
  console.log(`✓ ${sample.file.padEnd(22)} ${(buffer.length / 1024).toFixed(1)} KB`);
}
console.log(`\nWrote ${SAMPLES.length} demo alerts to public/demo-audio/`);

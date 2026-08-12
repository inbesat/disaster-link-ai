// ---------------------------------------------------------------------
// lib/tts/beep.ts — Phase 26 · Radio-compliance alert tone.
//
// Synthesizes the standard emergency broadcast beep (1000 Hz, 0.5 s) as a
// mono 16-bit PCM WAV, purely in JS — no external encoder needed. This is
// the tone that precedes every radio alert (EWS compliance). It is
// returned alongside the voiced MP3 so a broadcast middleware or the Voice
// Preview player can prepend it before transmission.
//
// The WAV is hand-built: 44-byte RIFF header + PCM samples. 22 050 Hz is
// plenty for a 1000 Hz tone (Nyquist 11 kHz) and keeps the buffer tiny.
// ---------------------------------------------------------------------

const SAMPLE_RATE = 22_050;
const BITS_PER_SAMPLE = 16;
const CHANNELS = 1;

/**
 * Build a WAV byte buffer for a single-frequency beep.
 *
 * @param frequencyHz  Tone frequency (default 1000 Hz — the EWS alert tone).
 * @param durationSec  Beep length (default 0.5 s).
 */
export function generateBeepWav(
  frequencyHz = 1000,
  durationSec = 0.5,
): Buffer {
  const numSamples = Math.max(1, Math.floor(SAMPLE_RATE * durationSec));
  const dataBytes = numSamples * 2; // 16-bit mono
  const buffer = Buffer.alloc(44 + dataBytes);

  // --- RIFF header -----------------------------------------------------
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8), 28);
  buffer.writeUInt16LE(CHANNELS * (BITS_PER_SAMPLE / 8), 32); // block align
  buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);

  // --- Samples ----------------------------------------------------------
  // Short fade-in (8 ms) and fade-out (60 ms) avoid clicks/pops on the
  // edges — important when the tone is blasted through FM transmitters.
  const fadeInSamples = Math.floor(SAMPLE_RATE * 0.008);
  const fadeOutSamples = Math.floor(SAMPLE_RATE * 0.06);
  const amplitude = 0.6;

  for (let i = 0; i < numSamples; i += 1) {
    const t = i / SAMPLE_RATE;
    let envelope = 1;
    if (i < fadeInSamples) envelope = i / fadeInSamples;
    else if (i > numSamples - fadeOutSamples) {
      envelope = (numSamples - i) / fadeOutSamples;
    }
    const sample = Math.sin(2 * Math.PI * frequencyHz * t) * amplitude * envelope;
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }

  return buffer;
}

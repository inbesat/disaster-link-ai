// ---------------------------------------------------------------------
// lib/tts/languages.ts — Phase 26 · TTS language/voice registry.
//
// Maps each supported Indian language to the best voice on every provider
// so the generator can pick the right voice automatically:
//   • ElevenLabs — multilingual v2 model (Adam/Bella work across scripts)
//   • Azure Neural — hi-IN-MadhurNeural (Hindi male), hi-IN-SwaraNeural
//     (Hindi female), en-IN-NeerjaNeural, bn-IN-TanishaaNeural,
//     ta-IN-ValluvarNeural, te-IN-ShrutiNeural, mr-IN-AarohiNeural,
//     ml-IN-SobhanaNeural
//   • Google Cloud — the matching Hindi/regional Standard/Wavenet voices.
// ---------------------------------------------------------------------

import type { LanguageVoiceMap, TtsLanguage } from "./types";

export const TTS_LANGUAGE_VOICES: LanguageVoiceMap = {
  hi: {
    label: "Hindi",
    elevenlabs: "Adam",
    azure: "hi-IN-MadhurNeural",
    google: "hi-IN-Standard-C",
  },
  en: {
    label: "English (India)",
    elevenlabs: "Adam",
    azure: "en-IN-NeerjaNeural",
    google: "en-IN-Standard-D",
  },
  bn: {
    label: "Bengali",
    elevenlabs: "Bella",
    azure: "bn-IN-TanishaaNeural",
    google: "bn-IN-Standard-A",
  },
  ta: {
    label: "Tamil",
    elevenlabs: "Bella",
    azure: "ta-IN-ValluvarNeural",
    google: "ta-IN-Standard-A",
  },
  te: {
    label: "Telugu",
    elevenlabs: "Adam",
    azure: "te-IN-ShrutiNeural",
    google: "te-IN-Standard-A",
  },
  mr: {
    label: "Marathi",
    elevenlabs: "Adam",
    azure: "mr-IN-AarohiNeural",
    google: "mr-IN-Standard-A",
  },
  ml: {
    label: "Malayalam",
    elevenlabs: "Bella",
    azure: "ml-IN-SobhanaNeural",
    google: "ml-IN-Standard-A",
  },
};

export const TTS_LANGUAGES = Object.keys(TTS_LANGUAGE_VOICES) as TtsLanguage[];

export function isTtsLanguage(value: string): value is TtsLanguage {
  return (TTS_LANGUAGES as string[]).includes(value);
}

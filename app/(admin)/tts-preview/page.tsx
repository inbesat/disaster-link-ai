import type { Metadata } from "next";
import VoicePreview from "@/components/admin/tts/VoicePreview";

export const metadata: Metadata = {
  title: "AI Alert Voice Preview | DRIP Admin",
};

export default function TtsPreviewPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          AI Alert Voice Preview
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          FM Radio Emergency Broadcasting · Phase 2 — synthesize radio-ready
          emergency audio in 7 Indian languages. Voices come from ElevenLabs
          (primary), Azure Neural TTS (fallback) or Google Cloud TTS
          (emergency). Every clip is preceded by the 1000 Hz radio-compliance
          beep and cached for 24 hours.
        </p>
      </div>

      <VoicePreview />
    </div>
  );
}

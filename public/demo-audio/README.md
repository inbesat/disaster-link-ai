# Demo Alert Audio (Phase 9)

Five radio-ready **EWS alert tones** for the pitch deck and judges' sandbox —
synthesised locally with zero dependencies (see `scripts/generate-demo-audio.ts`).

Each clip follows the radio-compliance convention from `lib/tts/beep.ts`:

```
[0.0–0.5 s]  1000 Hz attention beep
[0.5–4.5 s]  two-tone emergency siren (600 Hz ⇄ 900 Hz)
[4.5–5.0 s]  fade-out
```

| File | Label |
| --- | --- |
| `flood_hi.wav` | Flood alert — Hindi |
| `flood_en.wav` | Flood alert — English |
| `cyclone_hi.wav` | Cyclone alert — Hindi |
| `cyclone_en.wav` | Cyclone alert — English |
| `earthquake_hi.wav` | Earthquake alert — Hindi |

## Replacing with real voices

These are placeholder tones (no TTS keys are needed to demo). To swap in
real AI voices once provider keys are configured:

1. POST to `/api/tts/generate` with the alert message + language.
2. Save the returned MP3 under the same filename in this folder.

The `<audio>` elements on `/demo/fm-broadcast` keep working unchanged.

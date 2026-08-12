// ---------------------------------------------------------------------
// lib/broadcast/fm-ivr-fallback.ts — Phase 5 · IVR Voice-Call Fallback
// to FM station control rooms.
//
// When a station's digital channels (CAP API / RDS / FTP / email) fail —
// or the station is AIR, which must always be reached — the dispatcher
// escalates to a phone call. This module:
//
//   1. detectIvrLanguage(state)  → picks the regional language + voice
//      from the station's state (Bihar → Hindi, West Bengal → Bengali…).
//   2. buildIvrTwiml(...)        → the TwiML call flow:
//
//        <Response>
//          <Say voice="Polly.Aditi" language="hi-IN">
//            Namaskar. Yeh SafeSphere se ek aapati ka alert hai.
//          </Say>
//          <Play>https://cdn.safesphere.ai/alerts/flood_patna_001.mp3</Play>
//          <Say voice="Polly.Aditi" language="hi-IN">
//            Kripya turant prasaarit karein. Dhanyavaad.
//          </Say>
//        </Response>
//
//      The <Play> streams the radio-ready MP3 from the Phase 2 TTS
//      pipeline (already voiced in the correct language); when the MP3
//      isn't available the <Say> verb speaks the alert text instead.
//   3. callStationControlRoom(...) → places the call via the Twilio
//      voice client and returns the CallSid for the audit log.
// ---------------------------------------------------------------------

import { placeVoiceCall } from "@/lib/alerts/twilio-client";

/** Languages the IVR framing supports (the MP3 carries the real alert). */
export type IvrLanguage = "hi" | "bn" | "ta" | "te" | "mr" | "ml" | "en";

export interface IvrVoiceConfig {
  /** Twilio <Say> voice attribute — Polly voices for hi/en. */
  voice: string;
  /** Twilio <Say> language attribute (BCP-47). */
  language: string;
  /** Spoken when the call connects. */
  intro: string;
  /** Spoken after the alert — the broadcast directive. */
  outro: string;
}

/**
 * Per-language call framing. For languages without a Polly voice the
 * `language` attribute alone drives Twilio's default voice; the framing
 * lines are short and the actual alert content is the <Play> MP3 (already
 * synthesized in the right language by lib/tts).
 */
export const IVR_LANGUAGES: Record<IvrLanguage, IvrVoiceConfig> = {
  hi: {
    voice: "Polly.Aditi",
    language: "hi-IN",
    intro: "Namaskar. Yeh SafeSphere se ek aapati suchna hai.",
    outro: "Kripya turant prasaarit karein. Dhanyavaad.",
  },
  en: {
    voice: "Polly.Raveena",
    language: "en-IN",
    intro: "Hello. This is an emergency alert from SafeSphere.",
    outro: "Please broadcast immediately. Thank you.",
  },
  bn: {
    voice: "",
    language: "bn-IN",
    intro: "Nomoshkar. SafeSphere theke ek joruri santi barta.",
    outro: "Kripa kore turonto prasaron korun. Dhonyobad.",
  },
  ta: {
    voice: "",
    language: "ta-IN",
    intro: "Vanakkam. SafeSphere nindra oru avasarana echarikkai.",
    outro: "Udanadiye prasaritham seyyungal. Nandri.",
  },
  te: {
    voice: "",
    language: "te-IN",
    intro: "Namaskaram. SafeSphere nunchi oka atyavasara huchcharika.",
    outro: "Ventane prasarinchandi. Dhanyavadalu.",
  },
  mr: {
    voice: "",
    language: "mr-IN",
    intro: "Namaskar. SafeSphere kadun ek aapat suchana.",
    outro: "Krupaya turant prasarit kara. Dhanyavad.",
  },
  ml: {
    voice: "",
    language: "ml-IN",
    intro: "Namaskaram. SafeSphere nil ninnum oru atyavashya munnippu.",
    outro: "Dayavayi urappichu prasarshippikkuka. Nanni.",
  },
};

/** State → language for the call framing (India, lower-cased keys). */
const STATE_LANGUAGES: Record<string, IvrLanguage> = {
  bihar: "hi",
  "uttar pradesh": "hi",
  "madhya pradesh": "hi",
  rajasthan: "hi",
  jharkhand: "hi",
  delhi: "hi",
  haryana: "hi",
  uttarakhand: "hi",
  chhattisgarh: "hi",
  "himachal pradesh": "hi",
  "west bengal": "bn",
  tripura: "bn",
  "tamil nadu": "ta",
  kerala: "ml",
  maharashtra: "mr",
  goa: "mr",
  "andhra pradesh": "te",
  telangana: "te",
  gujarat: "en",
  karnataka: "en",
  assam: "en",
  odisha: "en",
  punjab: "en",
};

/** Normalise a state name / language code into an IvrLanguage. */
export function detectIvrLanguage(stateOrLang: string | null | undefined): IvrLanguage {
  const key = (stateOrLang ?? "").trim().toLowerCase();
  if (!key) return "en";
  if (key in IVR_LANGUAGES) return key as IvrLanguage;
  return STATE_LANGUAGES[key] ?? "en";
}

/** Only http(s) URLs may be embedded in TwiML (blocks protocol injection). */
export function isSafePlayUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Escape text for embedding in the TwiML XML document. */
export function escapeTwiMlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface IvrTwimlInput {
  /** Radio-ready MP3 to stream. When absent/unusable the alert is spoken. */
  audioUrl: string | null;
  /** Alert text spoken when the MP3 can't be streamed. */
  alertText: string;
  language: IvrLanguage;
}

/**
 * Build the TwiML call flow: [regional intro] → [MP3 alert or spoken
 * text] → [broadcast directive]. Matches the EWS radio-compliance
 * convention used by the Phase 2 TTS pipeline.
 */
export function buildIvrTwiml(input: IvrTwimlInput): string {
  const config = IVR_LANGUAGES[input.language];
  const sayAttrs = [
    config.voice ? `voice="${config.voice}"` : "",
    `language="${config.language}"`,
  ]
    .filter(Boolean)
    .join(" ");

  const say = (text: string) => `<Say ${sayAttrs}>${escapeTwiMlText(text)}</Say>`;

  const play = isSafePlayUrl(input.audioUrl)
    ? `<Play>${escapeTwiMlText(input.audioUrl as string)}</Play>`
    : say(
        input.alertText.slice(0, 400) || "Please broadcast the attached emergency alert.",
      );

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<Response>${say(config.intro)}${play}${say(config.outro)}</Response>`
  );
}

export interface IvrCallResult {
  ok: boolean;
  /** Twilio CallSid (when placed) — stored in fm_broadcast_logs.external_ref. */
  callSid: string | null;
  responseCode: number;
  responseBody: string;
  error?: string;
}

/** Absolute status-callback URL when the site origin is configured. */
export function ivrStatusCallbackUrl(): string | undefined {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  return site ? `${site.replace(/\/$/, "")}/api/webhooks/twilio/call-status` : undefined;
}

export interface CallStationOptions {
  /** Station state — drives the regional framing language. */
  state?: string | null;
  /** Absolute call-status callback URL (defaults to the platform webhook). */
  statusCallbackUrl?: string;
}

/**
 * Place the IVR fallback call to a station control room.
 *
 * @param phoneNumber  Station emergency contact (E.164).
 * @param audioUrl     Radio-ready MP3 to stream (<Play>).
 * @param alertText    Alert text used when the MP3 can't be streamed.
 */
export async function callStationControlRoom(
  phoneNumber: string,
  audioUrl: string | null,
  alertText: string,
  options: CallStationOptions = {},
): Promise<IvrCallResult> {
  const language = detectIvrLanguage(options.state);
  const twiml = buildIvrTwiml({ audioUrl, alertText, language });

  const result = await placeVoiceCall({
    to: phoneNumber,
    twiml,
    statusCallbackUrl: options.statusCallbackUrl ?? ivrStatusCallbackUrl(),
  });

  if (!result.ok) {
    return {
      ok: false,
      callSid: null,
      responseCode: 0,
      responseBody: result.error,
      error: result.error,
    };
  }

  return {
    ok: true,
    callSid: result.callSid,
    responseCode: 201,
    responseBody: `IVR call placed to ${phoneNumber} (sid=${result.callSid}).`,
  };
}

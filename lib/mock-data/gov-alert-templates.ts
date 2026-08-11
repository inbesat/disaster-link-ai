// ---------------------------------------------------------------------
// lib/mock-data/gov-alert-templates.ts — Phase 11 · Steps 3–4 ·
// Legal & SOP Template Library + mock multi-lingual translations.
//
// Step 3 — the three hardcoded template bodies officials can drop into
// the composer. Variables use {snake_case} tokens; the composer renders
// them as highlighted chips so officials see exactly what to fill in.
//
// Step 4 — a deterministic mock translation layer. Auto-Translate detects
// which template the message was built from and returns the SAME message
// rendered in Hindi / Bengali / Tamil / Malayalam (real translations, kept
// here as static strings with {variables} substituted from
// ALERT_VARIABLE_SAMPLES at preview time). Message bodies that don't match
// a template return null — the composer then nudges the official to use
// the Template Library.
//
// Pure + SSR-safe, unit-tested.
// ---------------------------------------------------------------------

export type AlertTemplateId = "flood" | "evac" | "all_clear";

export type AlertTemplate = {
  id: AlertTemplateId;
  label: string;
  severity: "watch" | "warning" | "critical";
  /** Body with {snake_case} placeholders. */
  body: string;
};

/** Phase 11 · Step 3 — the three SOP templates (hardcoded per spec). */
export const QUICK_ALERT_TEMPLATES: AlertTemplate[] = [
  {
    id: "flood",
    label: "Flood Warning",
    severity: "warning",
    body: "Flood Warning: River {river_name} crossing danger mark. Residents of {area} prepare.",
  },
  {
    id: "evac",
    label: "Evacuation Order",
    severity: "critical",
    body: "Evacuation Order: Immediate evac required for {area}. Proceed to {shelter_name}.",
  },
  {
    id: "all_clear",
    label: "All Clear",
    severity: "watch",
    body: "All Clear: Waters receding. Safe to return.",
  },
];

/** Sample values the demo substitutes into translations (and previews). */
export const ALERT_VARIABLE_SAMPLES: Record<string, string> = {
  river_name: "Ganga",
  area: "Danapur",
  shelter_name: "Kankarbagh Stadium Relief Camp",
};

/** Human metadata per target language (tab labels + native script). */
export type TranslateLang = "hi" | "bn" | "ta" | "ml";

export const TRANSLATE_LANGS: Array<{
  code: TranslateLang;
  label: string;
  native: string;
}> = [
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
];

/**
 * Phase 11 · Step 4 — pre-translated template bodies (variables left as
 * tokens; substituted at preview time). Real translations, not
 * transliteration, so the tabbed preview reads like a genuine LLM output.
 */
export const TEMPLATE_TRANSLATIONS: Record<
  AlertTemplateId,
  Record<TranslateLang, string>
> = {
  flood: {
    hi: "बाढ़ चेतावनी: {river_name} नदी खतरे के निशान को पार कर रही है। {area} के निवासी तैयार रहें।",
    bn: "বন্যা সতর্কতা: {river_name} নদী বিপদসীমা অতিক্রম করেছে। {area}-এর বাসিন্দারা প্রস্তুত থাকুন।",
    ta: "வெள்ள எச்சரிக்கை: {river_name} ஆற்றில் நீர் ஆபத்து அளவைக் கடந்து ஓடுகிறது. {area} பகுதியினர் தயாராக இருங்கள்.",
    ml: "വെള്ളപ്പൊക്ക മുന്നറിയിപ്പ്: {river_name} നദി അപകടനില കടക്കുന്നു. {area} നിവാസികൾ തയ്യാറാകുക.",
  },
  evac: {
    hi: "निकासी आदेश: {area} से तुरंत निकासी आवश्यक है। {shelter_name} पर पहुंचें।",
    bn: "স্থানান্তর আদেশ: {area} থেকে অবিলম্বে স্থানান্তর প্রয়োজন। {shelter_name} এ যান।",
    ta: "வெளியேற்ற உத்தரவு: {area} பகுதியிலிருந்து உடனடியாக வெளியேற வேண்டும். {shelter_name} செல்லவும்.",
    ml: "ഒഴിപ്പിക്കൽ ഉത്തരവ്: {area} ൽ നിന്ന് ഉടൻ ഒഴിയണം. {shelter_name} ലേക്ക് പോകുക.",
  },
  all_clear: {
    hi: "ऑल क्लियर: पानी घट रहा है। लौटना सुरक्षित है।",
    bn: "অল ক্লিয়ার: জল কমছে। ফিরে আসা নিরাপদ।",
    ta: "எல்லாம் சரி: வெள்ளம் வடிந்து வருகிறது. திரும்பச் செல்வது பாதுகாப்பானது.",
    ml: "എല്ലാം ശാന്തം: വെള്ളം ഇറങ്ങുകയാണ്. തിരികെ പോകുന്നത് സുരക്ഷിതം.",
  },
};

/** Extract the unique {variable} names in a message (for highlighting). */
export function extractTemplateVariables(text: string): string[] {
  const matches = text.match(/\{([a-z_]+)\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.slice(1, -1))));
}

/** Split a message into alternating literal / {variable} segments. */
export function splitByVariables(text: string): string[] {
  return text.split(/(\{[a-z_]+\})/g).filter((part) => part.length > 0);
}

/** Replace {variables} with values (or keep the token when unknown). */
export function substituteVariables(
  text: string,
  values: Record<string, string>,
): string {
  return text.replace(/\{([a-z_]+)\}/g, (match, key: string) => values[key] ?? match);
}

/** Which SOP template a message was built from (null = not a template). */
export function detectTemplateId(message: string): AlertTemplateId | null {
  const text = message.toLowerCase();
  if (text.includes("flood warning")) return "flood";
  if (text.includes("evacuation order")) return "evac";
  if (text.includes("all clear")) return "all_clear";
  return null;
}

/**
 * Mock "LLM translation": detect the template, look up its pre-translated
 * body for the language, substitute sample variables. Returns null when the
 * message doesn't map to a known template.
 */
export function translateMessage(message: string, lang: TranslateLang): string | null {
  const id = detectTemplateId(message);
  if (!id) return null;
  return substituteVariables(TEMPLATE_TRANSLATIONS[id][lang], ALERT_VARIABLE_SAMPLES);
}

/** Translate into every target language; null when the template is unknown. */
export function translateAll(message: string): Record<TranslateLang, string> | null {
  if (!detectTemplateId(message)) return null;
  return {
    hi: translateMessage(message, "hi")!,
    bn: translateMessage(message, "bn")!,
    ta: translateMessage(message, "ta")!,
    ml: translateMessage(message, "ml")!,
  };
}

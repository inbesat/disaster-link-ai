// ---------------------------------------------------------------------
// lib/alerts/template-parser.ts
// Renders an AlertTemplate's message body by replacing {variable} tokens
// with values from the provided data object. Missing / empty variables fall
// back to a safe placeholder so a rendering failure never surfaces to users.
//
// Example:
//   parseAlertTemplate(
//     "⚠️ {risk_level} flood warning for {district} at {predicted_time}.",
//     { risk_level: "Critical", district: "Patna", predicted_time: "today" },
//   );
//   // => "⚠️ Critical flood warning for Patna at today."
// ---------------------------------------------------------------------

export type TemplateVariables = Record<
  string,
  string | number | boolean | null | undefined
>;

export const UNKNOWN_VALUE = "Unknown";

const VARIABLE_PATTERN = /\{(\w+)\}/g;

/**
 * Replaces every `{variable}` token in `template` with the matching value
 * from `data`. Any token missing (or empty) from the data object resolves to
 * `FALLBACK` so the message stays well-formed.
 */
export function parseAlertTemplate(
  template: string,
  data: TemplateVariables = {},
): string {
  if (typeof template !== "string" || template.length === 0) {
    return "";
  }

  return template.replace(VARIABLE_PATTERN, (match, variable: string) => {
    const value = data[variable];
    // Missing / empty values fall back; valid falsy values (false, 0) pass
    // through to keep numeric and boolean payloads intact.
    if (value === null || value === undefined || value === "") {
      return UNKNOWN_VALUE;
    }
    return String(value);
  });
}

/**
 * Extracts the distinct {variable} names in a template. Useful for validating
 * that an AlertTemplate has all required fields before rendering.
 */
export function extractTemplateVariables(template: string): string[] {
  if (typeof template !== "string") return [];
  const matches = template.match(VARIABLE_PATTERN) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(1, -1))));
}

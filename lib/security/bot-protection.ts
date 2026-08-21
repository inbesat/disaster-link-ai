// ---------------------------------------------------------------------
// lib/security/bot-protection.ts — Bot Detection & CAPTCHA Simulation
//
// Prompt 7.3: Bot detection via honeypot fields and registration CAPTCHA.
// ---------------------------------------------------------------------

export interface BotCheckResult {
  isBot: boolean;
  reason?: string;
}

/**
 * Validates form submission against honeypot fields.
 * Honeypot fields (e.g. `website`, `fax_number`, `confirm_email_address`) should
 * be hidden from human users via CSS. If an automated script fills them,
 * `isBot` evaluates to true.
 */
export function validateHoneypot(
  formData: FormData | Record<string, unknown>,
): BotCheckResult {
  const getField = (name: string): string => {
    if (formData instanceof FormData) {
      return String(formData.get(name) ?? "").trim();
    }
    return String(formData[name] ?? "").trim();
  };

  const honeypotFields = [
    "website",
    "fax_number",
    "company_website",
    "confirm_email_address",
  ];

  for (const field of honeypotFields) {
    if (getField(field).length > 0) {
      return {
        isBot: true,
        reason: `Honeypot field '${field}' filled by automated client.`,
      };
    }
  }

  return { isBot: false };
}

/**
 * Simulates or verifies CAPTCHA token (hCaptcha / Cloudflare Turnstile).
 */
export function verifyCaptchaToken(token?: string): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (!token) return false;
  return token.length >= 5;
}

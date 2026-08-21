import { z } from "zod";

/**
 * Server-only environment variables schema.
 * These variables MUST NEVER reach the client bundle.
 */
const serverEnvSchema = z.object({
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // AI & LLM Providers
  OPENAI_API_KEY: z.string().optional(),
  CLAUDE_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_API_KEY_BACKUP: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY_BACKUP: z.string().optional(),
  BLUESMINDS_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  AZURE_TTS_KEY: z.string().optional(),
  GOOGLE_TTS_API_KEY: z.string().optional(),

  // Secrets & Auth
  JWT_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  GETOTP_API_KEY: z.string().optional(),
  OPENWEATHER_API_KEY: z.string().optional(),
  SPAMPATROL_API_KEY: z.string().optional(),

  // Internal/Service Configuration
  ML_SERVICE_URL: z.string().optional(),
  ML_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  FM_BROADCAST_TOKEN: z.string().optional(),
  FM_FTP_HOST: z.string().optional(),
  FM_FTP_PORT: z.string().optional(),
  FM_FTP_USER: z.string().optional(),
  FM_FTP_PASSWORD: z.string().optional(),
  FM_EMAIL_TO: z.string().optional(),
  FM_EMAIL_FROM: z.string().optional(),
  FM_SMTP_HOST: z.string().optional(),
  FM_SMTP_PORT: z.string().optional(),
  FM_SMTP_SECURE: z.string().optional(),
  FM_SMTP_USER: z.string().optional(),
  FM_SMTP_PASS: z.string().optional(),
});

/**
 * Public client-exposed environment variables schema.
 * Safe for client exposure (prefixed with NEXT_PUBLIC_).
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_MAPLIBRE_STYLE_URL: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_WHATSAPP_SOS_NUMBER: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_DEMO_MODE: z.string().optional(),
  NEXT_PUBLIC_QR_LOGO: z.string().optional(),
});

/**
 * Build-time and environment runtime flags.
 */
const buildEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  ANALYZE_BUNDLE: z.string().optional(),
});

/**
 * Parse and validate environment variables.
 */
export function parseEnv() {
  const isServer = typeof window === "undefined";

  const publicEnv = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_MAPLIBRE_STYLE_URL: process.env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_WHATSAPP_SOS_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_SOS_NUMBER,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
    NEXT_PUBLIC_QR_LOGO: process.env.NEXT_PUBLIC_QR_LOGO,
  });

  if (!publicEnv.success) {
    console.error("Invalid public environment variables:", publicEnv.error.format());
    throw new Error("Invalid public environment variables schema.");
  }

  const buildEnv = buildEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    ANALYZE_BUNDLE: process.env.ANALYZE_BUNDLE,
  });

  if (!buildEnv.success) {
    console.error("Invalid build environment variables:", buildEnv.error.format());
    throw new Error("Invalid build environment variables schema.");
  }

  if (!isServer) {
    return {
      ...publicEnv.data,
      ...buildEnv.data,
    };
  }

  const serverEnv = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_API_KEY_BACKUP: process.env.GROQ_API_KEY_BACKUP,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_API_KEY_BACKUP: process.env.OPENROUTER_API_KEY_BACKUP,
    BLUESMINDS_API_KEY: process.env.BLUESMINDS_API_KEY,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    AZURE_TTS_KEY: process.env.AZURE_TTS_KEY,
    GOOGLE_TTS_API_KEY: process.env.GOOGLE_TTS_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
    GETOTP_API_KEY: process.env.GETOTP_API_KEY,
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
    SPAMPATROL_API_KEY: process.env.SPAMPATROL_API_KEY,
    ML_SERVICE_URL: process.env.ML_SERVICE_URL,
    ML_API_KEY: process.env.ML_API_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    FM_BROADCAST_TOKEN: process.env.FM_BROADCAST_TOKEN,
    FM_FTP_HOST: process.env.FM_FTP_HOST,
    FM_FTP_PORT: process.env.FM_FTP_PORT,
    FM_FTP_USER: process.env.FM_FTP_USER,
    FM_FTP_PASSWORD: process.env.FM_FTP_PASSWORD,
    FM_EMAIL_TO: process.env.FM_EMAIL_TO,
    FM_EMAIL_FROM: process.env.FM_EMAIL_FROM,
    FM_SMTP_HOST: process.env.FM_SMTP_HOST,
    FM_SMTP_PORT: process.env.FM_SMTP_PORT,
    FM_SMTP_SECURE: process.env.FM_SMTP_SECURE,
    FM_SMTP_USER: process.env.FM_SMTP_USER,
    FM_SMTP_PASS: process.env.FM_SMTP_PASS,
  });

  if (!serverEnv.success) {
    console.error("Invalid server environment variables:", serverEnv.error.format());
    throw new Error("Invalid server environment variables schema.");
  }

  return {
    ...publicEnv.data,
    ...buildEnv.data,
    ...serverEnv.data,
  };
}

export const env = parseEnv();

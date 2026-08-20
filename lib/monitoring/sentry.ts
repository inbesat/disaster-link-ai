// ---------------------------------------------------------------------
// lib/monitoring/sentry.ts — Error monitoring + performance tracking
//
// Provides a thin wrapper around Sentry for error tracking. When Sentry
// is not configured (no DSN), all operations become no-ops so the app
// keeps running without overhead.
//
// Setup:
//   1. Install: npm install @sentry/nextjs
//   2. Add SENTRY_DSN to .env.local
//   3. Call initSentry() once in instrumentation.ts (or middleware)
// ---------------------------------------------------------------------

let initialized = false;

/**
 * Initialize Sentry. Safe to call multiple times — only initializes once.
 * No-op when SENTRY_DSN is not configured or @sentry/nextjs not installed.
 */
export async function initSentry(): Promise<void> {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  interface SentryEvent {
    user?: {
      email?: string;
      ip_address?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  interface SentryModule {
    init: (options: Record<string, unknown>) => void;
    captureException: (error: unknown, options?: { extra?: Record<string, unknown> }) => void;
    captureMessage: (message: string, level?: string) => void;
    setUser: (user: { id: string; role?: string } | null) => void;
  }

  try {
    // Dynamic import so Sentry is only loaded when configured
    const Sentry = (await import("@sentry/nextjs" as string)) as unknown as SentryModule;
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? "development",
      release: process.env.NEXT_PUBLIC_SITE_URL ?? "dev",
      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      // Don't capture personally identifiable information
      beforeSend(event: SentryEvent) {
        // Scrub any user email from the event
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        return event;
      },
      // Ignore common non-actionful errors
      ignoreErrors: [
        /ResizeObserver loop/,
        /Non-Error promise rejection/,
        /Loading chunk/,
        /Failed to fetch/,
      ],
    });
    initialized = true;
    console.log("[sentry] initialized");
  } catch (error: unknown) {
    console.warn("[sentry] failed to initialize (install @sentry/nextjs to enable):", error);
  }
}

interface SentryModule {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: unknown, options?: { extra?: Record<string, unknown> }) => void;
  captureMessage: (message: string, level?: string) => void;
  setUser: (user: { id: string; role?: string } | null) => void;
}

/**
 * Capture an exception. No-op when Sentry is not configured.
 */
export async function captureException(error: unknown, context?: Record<string, unknown>): Promise<void> {
  if (!isSentryEnabled()) return;
  try {
    const Sentry = (await import("@sentry/nextjs" as string)) as unknown as SentryModule;
    Sentry.captureException(error, { extra: context });
  } catch {
    // Silent — monitoring should never break the app
  }
}

/**
 * Capture a message. No-op when Sentry is not configured.
 */
export async function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): Promise<void> {
  if (!isSentryEnabled()) return;
  try {
    const Sentry = (await import("@sentry/nextjs" as string)) as unknown as SentryModule;
    Sentry.captureMessage(message, level);
  } catch {
    // Silent
  }
}

/**
 * Set the current user context. No-op when Sentry is not configured.
 */
export async function setUserContext(userId: string | null, role?: string): Promise<void> {
  if (!isSentryEnabled()) return;
  try {
    const Sentry = (await import("@sentry/nextjs" as string)) as unknown as SentryModule;
    Sentry.setUser(userId ? { id: userId, role } : null);
  } catch {
    // Silent
  }
}

function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN);
}

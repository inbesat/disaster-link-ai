// ---------------------------------------------------------------------
// lib/monitoring/sentry.ts — Error monitoring + PII Scrubbing
//
// Provides a thin wrapper around Sentry for error tracking and alerting.
// When Sentry is not configured (no DSN), all operations become no-ops
// or safe fallbacks so the app keeps running without overhead.
//
// Setup:
//   1. Install: npm install @sentry/nextjs
//   2. Add SENTRY_DSN to .env.local
//   3. Call initSentry() once in instrumentation.ts (or middleware)
// ---------------------------------------------------------------------

let initialized = false;

export interface ErrorTagContext {
  role?: string;
  district?: string;
  page?: string;
  action?: string;
  [key: string]: unknown;
}

/**
 * Scrubs sensitive PII, passwords, tokens, full phone numbers, and exact GPS coordinates
 * from objects before sending to Sentry or logging.
 */
export function sanitizeContext<T>(data: T): T {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeContext(item)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();

    // Sensitive field keys to redact completely or scrub
    if (
      lowerKey.includes("password") ||
      lowerKey.includes("token") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("auth") ||
      lowerKey.includes("cookie") ||
      lowerKey.includes("credit") ||
      lowerKey.includes("ssn")
    ) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    // Phone numbers
    if (lowerKey.includes("phone") || lowerKey.includes("mobile")) {
      sanitized[key] = typeof value === "string" ? value.replace(/\d(?=\d{4})/g, "*") : "[REDACTED_PHONE]";
      continue;
    }

    // Email address scrubbing
    if (lowerKey.includes("email")) {
      sanitized[key] = "[REDACTED_EMAIL]";
      continue;
    }

    // Exact GPS coordinates scrubbing or rounding to low precision (~11km approx)
    if (lowerKey === "lat" || lowerKey === "latitude") {
      sanitized[key] = typeof value === "number" ? Math.round(value * 10) / 10 : "[APPROX_LAT]";
      continue;
    }
    if (lowerKey === "lng" || lowerKey === "longitude") {
      sanitized[key] = typeof value === "number" ? Math.round(value * 10) / 10 : "[APPROX_LNG]";
      continue;
    }
    if (lowerKey.includes("coordinate") || lowerKey === "exact_location" || lowerKey === "position") {
      sanitized[key] = "[APPROX_LOCATION_ONLY]";
      continue;
    }

    // Recurse for sub-objects
    if (value && typeof value === "object") {
      sanitized[key] = sanitizeContext(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

interface SentryEvent {
  user?: {
    id?: string;
    email?: string;
    ip_address?: string;
    [key: string]: unknown;
  };
  extra?: Record<string, unknown>;
  tags?: Record<string, string>;
  [key: string]: unknown;
}

interface SentryScope {
  setTag: (key: string, value: string) => void;
  setExtra: (key: string, value: unknown) => void;
  setTags: (tags: Record<string, string>) => void;
  setExtras: (extras: Record<string, unknown>) => void;
}

interface SentryModule {
  init: (options: Record<string, unknown>) => void;
  captureException: (
    error: unknown,
    options?: { extra?: Record<string, unknown>; tags?: Record<string, string> } | ((scope: SentryScope) => SentryScope)
  ) => void;
  captureMessage: (message: string, level?: string) => void;
  setUser: (user: { id: string; role?: string; district?: string } | null) => void;
  withScope: (callback: (scope: SentryScope) => void) => void;
}

/**
 * Initialize Sentry. Safe to call multiple times — only initializes once.
 * No-op when SENTRY_DSN is not configured or @sentry/nextjs not installed.
 */
export async function initSentry(): Promise<void> {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    // @ts-expect-error optional dependency
    const Sentry = (await import(/* webpackIgnore: true */ "@sentry/nextjs")) as unknown as SentryModule;
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? "development",
      release: process.env.NEXT_PUBLIC_SITE_URL ?? "dev",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      beforeSend(event: SentryEvent) {
        // Scrub user PII from event
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        if (event.extra) {
          event.extra = sanitizeContext(event.extra);
        }
        return event;
      },
      ignoreErrors: [
        /ResizeObserver loop/,
        /Non-Error promise rejection/,
        /Loading chunk/,
        /Failed to fetch/,
      ],
    });
    initialized = true;
    console.log("[sentry] initialized with PII scrubbing");
  } catch (error: unknown) {
    console.warn("[sentry] failed to initialize (install @sentry/nextjs to enable):", error);
  }
}

/**
 * Capture an exception with contextual tags and sanitized extras.
 */
export async function captureException(error: unknown, context?: ErrorTagContext): Promise<void> {
  if (!isSentryEnabled()) return;
  try {
    // @ts-expect-error optional dependency
    const Sentry = (await import(/* webpackIgnore: true */ "@sentry/nextjs")) as unknown as SentryModule;
    const sanitizedExtra = sanitizeContext(context ?? {});

    const tags: Record<string, string> = {};
    if (context?.role) tags.role = String(context.role);
    if (context?.district) tags.district = String(context.district);
    if (context?.page) tags.page = String(context.page);
    if (context?.action) tags.action = String(context.action);

    Sentry.captureException(error, {
      extra: sanitizedExtra,
      tags,
    });
  } catch {
    // Silent — monitoring should never break the app
  }
}

/**
 * Capture map specific error.
 */
export async function captureMapError(error: unknown, context?: { page?: string; action?: string; district?: string }): Promise<void> {
  return captureException(error, {
    category: "map_failure",
    page: context?.page ?? "map",
    action: context?.action ?? "render_map",
    district: context?.district,
  });
}

/**
 * Capture AI specific error.
 */
export async function captureAIError(error: unknown, context?: { page?: string; action?: string; model?: string }): Promise<void> {
  return captureException(error, {
    category: "ai_failure",
    page: context?.page ?? "ai_chat",
    action: context?.action ?? "generate_plan",
    model: context?.model,
  });
}

/**
 * Capture API error.
 */
export async function captureAPIError(error: unknown, context?: { route?: string; method?: string; statusCode?: number; role?: string }): Promise<void> {
  return captureException(error, {
    category: "api_failure",
    page: context?.route ?? "api",
    action: `${context?.method ?? "GET"} ${context?.route ?? ""}`,
    statusCode: context?.statusCode,
    role: context?.role,
  });
}

/**
 * Capture a message with optional severity level.
 */
export async function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): Promise<void> {
  if (!isSentryEnabled()) return;
  try {
    // @ts-expect-error optional dependency
    const Sentry = (await import(/* webpackIgnore: true */ "@sentry/nextjs")) as unknown as SentryModule;
    Sentry.captureMessage(message, level);
  } catch {
    // Silent
  }
}

/**
 * Set the current user context (no PII stored).
 */
export async function setUserContext(userId: string | null, role?: string, district?: string): Promise<void> {
  if (!isSentryEnabled()) return;
  try {
    // @ts-expect-error optional dependency
    const Sentry = (await import(/* webpackIgnore: true */ "@sentry/nextjs")) as unknown as SentryModule;
    Sentry.setUser(userId ? { id: userId, role, district } : null);
  } catch {
    // Silent
  }
}

function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN);
}

// ---------------------------------------------------------------------
// lib/analytics/tracker.ts — Analytics Event Tracking
//
// Provides trackEvent and trackPageView for client-side analytics.
// Supports multiple providers: PostHog, Google Analytics, Vercel Analytics.
// Falls back to console.log in development if no provider configured.
// ---------------------------------------------------------------------

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
const VERCEL_ANALYTICS_ID = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID || "";

// Server-side flag to avoid sending during SSR
let isBrowser = false;
if (typeof window !== "undefined") {
  isBrowser = true;
}

/**
 * Track a custom event with properties.
 * @param eventName - Name of the event (e.g., "button_click", "form_submit")
 * @param properties - Additional properties to send with the event
 */
export function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {}
): void {
  const payload = {
    event: eventName,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      url: isBrowser ? window.location.href : "",
      userAgent: isBrowser ? navigator.userAgent : "",
    },
  };

  // PostHog
  if (POSTHOG_KEY && isBrowser) {
    try {
      if (typeof window.posthog !== "undefined") {
        window.posthog.capture(eventName, payload.properties);
      }
    } catch {
      // Silently fail
    }
  }

  // Google Analytics (gtag)
  if (GA_MEASUREMENT_ID && isBrowser && typeof window.gtag === "function") {
    try {
      window.gtag("event", eventName, payload.properties);
    } catch {
      // Silently fail
    }
  }

  // Vercel Analytics
  if (VERCEL_ANALYTICS_ID && isBrowser && typeof window.va === "function") {
    try {
      window.va("track", eventName, payload.properties);
    } catch {
      // Silently fail
    }
  }

  // Development fallback
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics] trackEvent:", JSON.stringify(payload, null, 2));
  }
}

/**
 * Track a page view.
 * @param url - The URL path (e.g., "/dashboard", "/settings/billing")
 * @param title - Optional page title
 */
export function trackPageView(url: string, title?: string): void {
  const properties: Record<string, unknown> = {
    path: url,
    title: title || document?.title || "",
    referrer: isBrowser ? document.referrer : "",
  };

  // PostHog
  if (POSTHOG_KEY && isBrowser) {
    try {
      if (typeof window.posthog !== "undefined") {
        window.posthog.capture("$pageview", properties);
      }
    } catch {
      // Silently fail
    }
  }

  // Google Analytics
  if (GA_MEASUREMENT_ID && isBrowser && typeof window.gtag === "function") {
    try {
      window.gtag("config", GA_MEASUREMENT_ID, {
        page_path: url,
        page_title: title,
      });
    } catch {
      // Silently fail
    }
  }

  // Vercel Analytics
  if (VERCEL_ANALYTICS_ID && isBrowser && typeof window.va === "function") {
    try {
      window.va("pageview", url);
    } catch {
      // Silently fail
    }
  }

  // Development fallback
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics] trackPageView:", JSON.stringify({ event: "pageview", properties }, null, 2));
  }
}

/**
 * Identify a user for analytics (PostHog, etc.)
 * @param userId - Unique user identifier
 * @param traits - User traits (email, name, role, etc.)
 */
export function identifyUser(
  userId: string,
  traits: Record<string, unknown> = {}
): void {
  if (POSTHOG_KEY && isBrowser && typeof window.posthog !== "undefined") {
    try {
      window.posthog.identify(userId, traits);
    } catch {
      // Silently fail
    }
  }

  if (GA_MEASUREMENT_ID && isBrowser && typeof window.gtag === "function") {
    try {
      window.gtag("set", { user_id: userId, ...traits });
    } catch {
      // Silently fail
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics] identifyUser:", { userId, traits });
  }
}

/**
 * Reset user identity (on logout)
 */
export function resetUser(): void {
  if (POSTHOG_KEY && isBrowser && typeof window.posthog !== "undefined") {
    try {
      window.posthog.reset();
    } catch {
      // Silently fail
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics] resetUser");
  }
}

// Keep existing function for backward compatibility
export async function logFeatureUsage(
  featureName: string,
  role: string,
  district: string,
): Promise<void> {
  // Respect 'Do Not Track' (DNT) browser settings & consent
  if (typeof window !== "undefined") {
    const dnt = navigator.doNotTrack === "1" || (window as unknown as { doNotTrack?: string }).doNotTrack === "1";
    const consent = localStorage.getItem("safesphere_cookie_consent");
    if (dnt || consent === "declined") {
      // Analytics tracking bypassed due to DNT or declined consent
      return;
    }
  }

  // Mock for the hackathon — console only, no DB writes.
  console.log(
    `${role.toUpperCase()} user in ${district} triggered ${featureName.toUpperCase()}`,
  );
}

export function getAnalyticsSummary(): string {
  return "Citizens used SOS 340 times. Gov used AI Planner 42 times.";
}
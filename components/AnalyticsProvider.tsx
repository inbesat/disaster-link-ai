"use client";

import { Suspense, useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics/tracker";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url =
      pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    trackPageView(url);
  }, [pathname, searchParams]);

  return null;
}

function AnalyticsScripts() {
  const scripts: React.ReactNode[] = [];

  if (GA_MEASUREMENT_ID) {
    scripts.push(
      <Script
        key="ga-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />,
      <Script
        id="google-analytics"
        key="ga-config"
        strategy="afterInteractive"
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    );
  }

  if (POSTHOG_KEY) {
    scripts.push(
      <Script
        key="posthog-script"
        src={`${POSTHOG_HOST}/static/array.js`}
        strategy="afterInteractive"
      />,
      <Script
        id="posthog-init"
        key="posthog-config"
        strategy="afterInteractive"
      >
        {`
          window.posthog = window.posthog || [];
          window.posthog.init('${POSTHOG_KEY}', {
            api_host: '${POSTHOG_HOST}',
            autocapture: true,
            capture_pageview: false,
            capture_pageleave: true,
          });
        `}
      </Script>
    );
  }

  return <>{scripts}</>;
}

export default function AnalyticsProvider() {
  return (
    <Suspense fallback={null}>
      <AnalyticsScripts />
      <AnalyticsTracker />
    </Suspense>
  );
}

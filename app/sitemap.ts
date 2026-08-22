// app/sitemap.ts — Next.js 13+ Sitemap Generation
// Auto-generates sitemap.xml for all public routes.

import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://safesphere.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Public routes that should be indexed
  const publicRoutes = [
    "",
    "/privacy",
    "/terms",
    "/login",
    "/signup",
    "/public/landing",
    "/public/sos",
    "/public/report",
    "/public/access",
    "/public/trust",
    "/public/onboarding",
    "/public/setup/location",
    "/public/setup/family",
    "/public/dashboard",
    "/public/map",
    "/public/alerts",
    "/public/ai",
    "/public/donations",
    "/public/settings",
    "/public/settings/alerts",
    "/public/settings/sos-history",
  ];

  // Government routes (indexable but with noindex in production if needed)
  const govRoutes = [
    "/gov/login",
    "/gov/signup",
    "/gov/dashboard",
    "/gov/overview",
    "/gov/map",
    "/gov/alerts",
    "/gov/resources",
    "/gov/ai-planner",
  ];

  const allRoutes = [...publicRoutes, ...govRoutes];

  return allRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route.includes("/settings") ? 0.5 : 0.7,
  }));
}
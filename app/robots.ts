// app/robots.ts — Next.js 13+ Robots.txt Generation
// Controls crawler access for search engines.

import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://safesphere.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/privacy",
          "/terms",
          "/login",
          "/signup",
          "/public/",
          "/gov/",
        ],
        disallow: [
          "/api/",
          "/_next/",
          "/static/",
          "/admin/",
          "/command-center/",
          "/dashboard/",
          "/inventory/",
          "/field/",
          "/settings/",
          "/profile-setup",
          "/auth/",
          "/family/",
          "/lite/",
          "/demo/",
          "/download/",
          "/debug/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/privacy",
          "/terms",
          "/login",
          "/signup",
          "/public/",
          "/gov/",
        ],
        disallow: [
          "/api/",
          "/_next/",
          "/static/",
          "/admin/",
          "/command-center/",
          "/dashboard/",
          "/inventory/",
          "/field/",
          "/settings/",
          "/profile-setup",
          "/auth/",
          "/family/",
          "/lite/",
          "/demo/",
          "/download/",
          "/debug/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
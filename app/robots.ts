import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/app/_lib/auth/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    host: siteUrl.origin,
    rules: {
      allow: "/",
      disallow: ["/admin", "/auth", "/search"],
      userAgent: "*",
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}

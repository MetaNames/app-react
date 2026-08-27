import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // `/profile` renders nothing without a connected wallet, and `/api`
      // serves JSON — crawling either spends budget that belongs on the
      // domain pages the sitemap lists. The renew and transfer routes are
      // owner-only actions, not content.
      disallow: ["/api/", "/profile", "/domain/*/renew", "/domain/*/transfer"],
    },
    sitemap: `${config.websiteUrl}sitemap.xml`,
  };
}

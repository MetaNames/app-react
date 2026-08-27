import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { getServerSdk } from "@/lib/sdk";

/**
 * Domains are minted continuously, so a sitemap frozen at build time goes
 * stale the moment anyone registers a name. Revalidating hourly keeps new
 * domains discoverable without a redeploy.
 */
export const revalidate = 3600;

/**
 * Google caps a single sitemap at 50,000 URLs. Staying well under it keeps
 * this a single file (no `generateSitemaps` split) while covering far more
 * names than the contract currently holds.
 */
const MAX_DOMAIN_URLS = 20_000;

function url(path: string): string {
  // `websiteUrl` is configured with a trailing slash; joining naively would
  // produce a double slash, which search engines treat as a distinct URL.
  return new URL(path, config.websiteUrl).toString();
}

/**
 * Every registered domain has a public page worth indexing — that is the
 * whole point of a public name service — but until now only the home page
 * was listed, so no domain page was discoverable except by direct link.
 */
async function domainEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const domains = await getServerSdk().domainRepository.getAll();
    return domains
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, MAX_DOMAIN_URLS)
      .map((domain) => ({
        url: url(`/domain/${domain.name}`),
        lastModified: domain.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
  } catch (error) {
    // A sitemap missing its domain entries still serves the static routes; a
    // sitemap that throws serves nothing at all. Degrade rather than fail.
    console.error(error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: config.websiteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: url("/tld"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  return [...staticEntries, ...(await domainEntries())];
}

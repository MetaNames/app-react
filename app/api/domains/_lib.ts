import type { MetaNamesSdk } from "@metanames/sdk";

/**
 * The projection legacy's `/api/domains/recent` and `/api/domains/stats`
 * return for each domain — name + creation date only, not the full `Domain`
 * shape (app-legacy/src/lib/server/index.ts `DomainProjection`).
 */
export interface DomainProjection {
  name: string;
  createdAt: Date;
}

/**
 * Mirrors legacy's `getRecentDomains`: fetches every domain, sorts newest
 * first, and projects down to `{name, createdAt}`. A `getAll()` failure is
 * swallowed to an empty list (logged, not reported) rather than thrown —
 * that is intentional and matches legacy's own `.catch`, so callers built on
 * top of this (both `/recent` and `/stats`) degrade to "no recent domains"
 * instead of a 500 when only this read fails.
 */
export async function getRecentDomains(
  sdk: MetaNamesSdk,
  count = 12,
): Promise<DomainProjection[]> {
  try {
    const domains = await sdk.domainRepository.getAll();
    return domains
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, count)
      .map((domain) => ({ name: domain.name, createdAt: domain.createdAt }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * Ported from app-legacy/src/lib/filter.ts.
 *
 * Trims and lowercases both the query and the candidate name before
 * matching, so a whitespace-only search returns every domain (rather than
 * filtering out everything, as a raw `.includes()` on the untrimmed query
 * would) and matching is case-insensitive.
 */
export const filterDomainsByName = <T extends { name: string }>(
  domains: T[],
  search: string,
) => {
  const query = search.trim().toLowerCase();
  if (query === "") return domains;

  return domains.filter((domain) =>
    domain.name.trim().toLowerCase().includes(query),
  );
};

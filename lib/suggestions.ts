import { validateDomainName } from "@/lib/domain-validator";

/**
 * A search that comes back "Registered" is a dead end: the name is gone and the
 * only thing the page offers is a link to someone else's domain. These are the
 * variations a person types next anyway — prefixes, suffixes, and a couple of
 * numeric forms — generated once so the app can check them and offer the ones
 * that are actually free.
 */
const PREFIXES = ["my", "the", "get"];
const SUFFIXES = ["hq", "dao", "app", "xyz"];
const NUMBERS = ["1", "01", "2026"];

/**
 * Candidates are produced in a deliberate order — suffixes read best, then
 * numbers, then prefixes — so that taking the first N availabilities yields the
 * most natural-looking names rather than an arbitrary slice.
 */
export function suggestNames(name: string, limit = 12): string[] {
  const base = name
    .replace(/\.mpc$/, "")
    .trim()
    .toLowerCase();
  if (!base) return [];

  const candidates = [
    ...SUFFIXES.map((s) => `${base}${s}`),
    ...NUMBERS.map((n) => `${base}${n}`),
    ...PREFIXES.map((p) => `${p}${base}`),
    ...SUFFIXES.map((s) => `${base}-${s}`),
  ];

  const seen = new Set<string>([base]);
  const out: string[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    // A suggestion the app would refuse to register is worse than no
    // suggestion, and appending to a near-maximum-length name overflows the
    // SDK's 32-character cap easily.
    if (!validateDomainName(candidate).valid) continue;
    out.push(candidate);
    if (out.length >= limit) break;
  }
  return out;
}

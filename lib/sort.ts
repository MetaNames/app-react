/**
 * Ported from app-legacy/src/lib/sort.ts.
 *
 * Legacy's SMUI data table only ever exposes two real directions
 * ("ascending"/"descending") but its types also allow "none"/"other" for
 * columns that haven't been explicitly sorted yet. Legacy deliberately
 * treats those the same as "descending" (see sort.test.ts) — there is no
 * "unsorted" state once the table has data. We preserve that quirk here so
 * a caller adapting this into TanStack Table's sortingFn can reproduce it
 * (e.g. by disabling sort removal so the column can never return to a true
 * unsorted state, and defaulting an ambiguous state to descending).
 */
export type SortDirection = "ascending" | "descending" | "none" | "other";

export const compareByKey =
  <T>(key: keyof T, direction: SortDirection) =>
  (a: T, b: T) => {
    const sign = direction === "ascending" ? 1 : -1;
    const [aVal, bVal] = [a[key], b[key]];

    if (typeof aVal === "string" && typeof bVal === "string")
      return sign * aVal.localeCompare(bVal);

    return sign * (Number(aVal) - Number(bVal));
  };

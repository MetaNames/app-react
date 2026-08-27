import { describe, it, expect } from "vitest";
import { suggestNames } from "../suggestions";
import { validateDomainName } from "../domain-validator";

describe("suggestNames", () => {
  it("returns nothing for an empty name", () => {
    expect(suggestNames("")).toEqual([]);
    expect(suggestNames("   ")).toEqual([]);
  });

  it("builds variations around the searched name", () => {
    const suggestions = suggestNames("alice");
    expect(suggestions).toContain("alicehq");
    expect(suggestions).toContain("myalice");
    expect(suggestions).toContain("alice2026");
  });

  it("strips the TLD before building variations", () => {
    expect(suggestNames("alice.mpc")).toContain("alicehq");
    expect(suggestNames("alice.mpc").every((s) => !s.includes(".mpc"))).toBe(
      true,
    );
  });

  it("never suggests the name that was searched for", () => {
    expect(suggestNames("alice")).not.toContain("alice");
  });

  it("returns no duplicates", () => {
    const suggestions = suggestNames("alice");
    expect(new Set(suggestions).size).toBe(suggestions.length);
  });

  it("respects the limit", () => {
    expect(suggestNames("alice", 3)).toHaveLength(3);
  });

  // Offering a name the register page would then reject is worse than
  // offering nothing.
  it("only suggests names that pass validation", () => {
    for (const base of ["alice", "a", "a".repeat(24), "x-y"]) {
      for (const suggestion of suggestNames(base)) {
        expect(validateDomainName(suggestion).valid).toBe(true);
      }
    }
  });

  // ".mpc" counts toward the SDK's 32-character cap, so a long base leaves
  // room for only the shortest affixes — and possibly none at all.
  it("drops variations that would overflow the length cap", () => {
    expect(suggestNames("a".repeat(28))).toEqual([]);
  });

  it("normalizes case so suggestions are registrable as typed", () => {
    expect(suggestNames("ALICE")).toContain("alicehq");
  });
});

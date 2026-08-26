import { describe, it, expect } from "vitest";
import { RecordClassEnum } from "@metanames/sdk";
import { RECORD_CLASS_MAP } from "../constants";

/**
 * Regression guard for the data-corruption bug where RECORD_CLASS_MAP hardcoded
 * numeric values that did not match the SDK's on-chain RecordClassEnum (e.g. Avatar
 * was sent as 7, which is actually Price on-chain). Each assertion below is anchored
 * to the SDK enum member itself, not to a copied-down literal, so any future drift
 * between the two fails here instead of corrupting on-chain writes.
 */
describe("RECORD_CLASS_MAP", () => {
  it.each(Object.keys(RECORD_CLASS_MAP))(
    "%s value matches the SDK's RecordClassEnum member",
    (name) => {
      expect(RECORD_CLASS_MAP[name].value).toBe(
        RecordClassEnum[name as keyof typeof RecordClassEnum],
      );
    },
  );

  it("offers exactly the classes app-legacy offers (social + profile lists)", () => {
    expect(Object.keys(RECORD_CLASS_MAP).sort()).toEqual(
      ["Bio", "Discord", "Email", "Price", "Twitter", "Uri", "Wallet"].sort(),
    );
  });

  it("does not offer fabricated classes absent from the SDK enum", () => {
    for (const fabricated of ["AAAA", "Signature", "Text", "Address"]) {
      expect(RECORD_CLASS_MAP[fabricated]).toBeUndefined();
    }
  });

  it("does not have two classes colliding on the same numeric value", () => {
    const values = Object.values(RECORD_CLASS_MAP).map((c) => c.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

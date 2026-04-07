import { describe, it, expect } from "vitest";
import { validateAddress, validatePrivateKey, shortenAddress } from "../wallet";

describe("validateAddress", () => {
  it("accepts valid 42-character alphanumeric address", () => {
    expect(validateAddress("0x0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c4d5")).toBe(
      true,
    );
  });

  it("rejects address with less than 42 characters", () => {
    expect(validateAddress("0x0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c4")).toBe(
      false,
    );
  });

  it("rejects address with more than 42 characters", () => {
    expect(
      validateAddress("0x0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c4d5e6"),
    ).toBe(false);
  });

  it("rejects address with exactly 41 characters", () => {
    expect(validateAddress("0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c4d")).toBe(
      false,
    );
  });

  it("rejects address with special characters", () => {
    expect(validateAddress("0x0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c!")).toBe(
      false,
    );
  });

  it("rejects address with spaces", () => {
    expect(validateAddress("0x0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2 3c4d5")).toBe(
      false,
    );
  });

  it("rejects empty string", () => {
    expect(validateAddress("")).toBe(false);
  });

  it("accepts address starting with 0x", () => {
    expect(validateAddress("0x0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c4d5")).toBe(
      true,
    );
  });

  it("accepts address without 0x prefix if 42 chars", () => {
    expect(validateAddress("0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c4d5e6")).toBe(
      true,
    );
  });
});

describe("validatePrivateKey", () => {
  it("accepts valid 64-character hex string", () => {
    expect(
      validatePrivateKey(
        "df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c27928c",
      ),
    ).toBe(true);
  });

  it("accepts uppercase hex characters", () => {
    expect(
      validatePrivateKey(
        "DF4642EF258F9AEF2ADB6C148590208B20387FB067F2C0907D6C85697C27928C",
      ),
    ).toBe(true);
  });

  it("accepts mixed case hex characters", () => {
    expect(
      validatePrivateKey(
        "df4642eF258f9aEf2adb6C148590208b20387fB067f2c0907d6c85697c27928C",
      ),
    ).toBe(true);
  });

  it("rejects private key with less than 64 characters", () => {
    expect(
      validatePrivateKey(
        "df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c2792",
      ),
    ).toBe(false);
  });

  it("rejects private key with more than 64 characters", () => {
    expect(
      validatePrivateKey(
        "df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c27928c00",
      ),
    ).toBe(false);
  });

  it("rejects private key with exactly 63 characters", () => {
    expect(
      validatePrivateKey(
        "df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c2792",
      ),
    ).toBe(false);
  });

  it("rejects private key with non-hex characters", () => {
    expect(
      validatePrivateKey(
        "df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c27928g",
      ),
    ).toBe(false);
  });

  it("rejects private key with spaces", () => {
    expect(
      validatePrivateKey(
        "df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c27928 ",
      ),
    ).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validatePrivateKey("")).toBe(false);
  });

  it("rejects single character", () => {
    expect(validatePrivateKey("d")).toBe(false);
  });
});

describe("shortenAddress", () => {
  it("shortens address with first 4 and last 4 characters", () => {
    expect(shortenAddress("0x0333a0b93e9c30e2d6a3c0b3c6d5e4f1a2b3c4d5")).toBe(
      "0x03...c4d5",
    );
  });

  it("returns original address if less than 8 characters", () => {
    expect(shortenAddress("0x033")).toBe("0x033");
  });

  it("handles undefined string input", () => {
    expect(shortenAddress("undefined")).toBe("unde...ined");
  });

  it("handles null string input", () => {
    expect(shortenAddress("null")).toBe("null");
  });

  it("returns address with exactly 8 characters shortened to first4...last4", () => {
    expect(shortenAddress("12345678")).toBe("1234...5678");
  });
});

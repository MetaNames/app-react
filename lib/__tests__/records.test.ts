import { describe, it, expect } from "vitest";
import { validateRecordValue, isUrlRecord } from "../records";

describe("validateRecordValue", () => {
  describe("required field validation", () => {
    it("returns error for empty string", () => {
      expect(validateRecordValue("Bio", "")).toBe("Value is required");
    });

    it("returns error for whitespace-only string", () => {
      expect(validateRecordValue("Bio", "   ")).toBe("Value is required");
    });
  });

  describe("max length validation (64 chars)", () => {
    it("returns error for value exceeding 64 characters", () => {
      const longValue = "a".repeat(65);
      expect(validateRecordValue("Bio", longValue)).toBe("Max 64 characters");
    });

    it("accepts exactly 64 characters", () => {
      const maxValue = "a".repeat(64);
      expect(validateRecordValue("Bio", maxValue)).toBeNull();
    });
  });

  describe("Bio type", () => {
    it("accepts valid bio text", () => {
      expect(validateRecordValue("Bio", "Software developer")).toBeNull();
    });

    it("accepts 64 char bio", () => {
      expect(validateRecordValue("Bio", "a".repeat(64))).toBeNull();
    });
  });

  describe("Email type", () => {
    it("accepts valid email", () => {
      expect(validateRecordValue("Email", "test@example.com")).toBeNull();
    });

    it("returns error for invalid email format", () => {
      expect(validateRecordValue("Email", "notanemail")).toBe(
        "Must be a valid email",
      );
    });

    it("returns error for email without @", () => {
      expect(validateRecordValue("Email", "testexample.com")).toBe(
        "Must be a valid email",
      );
    });

    it("returns error for email without domain", () => {
      expect(validateRecordValue("Email", "test@")).toBe(
        "Must be a valid email",
      );
    });
  });

  describe("Uri type", () => {
    it("accepts valid URL", () => {
      expect(validateRecordValue("Uri", "https://example.com")).toBeNull();
    });

    it("accepts URL with path", () => {
      expect(validateRecordValue("Uri", "https://example.com/path")).toBeNull();
    });

    it("returns error for invalid URL", () => {
      expect(validateRecordValue("Uri", "not a url")).toBe(
        "Must be a valid URL",
      );
    });

    it("returns error for URL without protocol", () => {
      expect(validateRecordValue("Uri", "example.com")).toBe(
        "Must be a valid URL",
      );
    });
  });

  describe("Wallet type", () => {
    it("accepts valid wallet text", () => {
      expect(validateRecordValue("Wallet", "0x1234567890abcdef")).toBeNull();
    });

    it("accepts any text (current behavior - no blockchain address format validation)", () => {
      // Note: Per spec section 6, Wallet should validate "Blockchain address" format.
      // Currently, the implementation accepts any text. This is a future improvement opportunity.
      expect(validateRecordValue("Wallet", "any text value")).toBeNull();
      expect(
        validateRecordValue(
          "Wallet",
          "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        ),
      ).toBeNull();
    });
  });

  describe("Price type", () => {
    it("accepts valid number", () => {
      expect(validateRecordValue("Price", "100")).toBeNull();
    });

    it("accepts decimal number", () => {
      expect(validateRecordValue("Price", "99.99")).toBeNull();
    });

    it('rejects "$" prefix (implementation checks isNaN which rejects "$")', () => {
      // Note: Per spec section 6, Price should validate "Number + $" format.
      // The implementation uses isNaN(Number(value)) which rejects "$" prefix.
      // This is a GAP: spec says "Number + $" but implementation only accepts numbers.
      expect(validateRecordValue("Price", "$100")).toBe("Must be a number");
    });

    it('rejects "$" suffix', () => {
      // GAP: Same as above - spec says "Number + $" but implementation rejects "$" suffix.
      expect(validateRecordValue("Price", "100$")).toBe("Must be a number");
    });

    it('rejects "$" prefix with decimal', () => {
      expect(validateRecordValue("Price", "$99.99")).toBe("Must be a number");
    });

    it("returns error for non-numeric value", () => {
      expect(validateRecordValue("Price", "abc")).toBe("Must be a number");
    });
  });

  describe("Avatar type", () => {
    it("accepts valid URL", () => {
      expect(
        validateRecordValue("Avatar", "https://example.com/avatar.png"),
      ).toBeNull();
    });

    it("returns error for invalid URL", () => {
      expect(validateRecordValue("Avatar", "not-a-url")).toBe(
        "Must be a valid URL",
      );
    });
  });

  describe("Main type", () => {
    it("accepts valid text", () => {
      expect(validateRecordValue("Main", "Main page content")).toBeNull();
    });
  });

  describe("Twitter type", () => {
    it("accepts valid twitter handle", () => {
      expect(validateRecordValue("Twitter", "@username")).toBeNull();
    });
  });

  describe("Discord type", () => {
    it("accepts valid discord username", () => {
      expect(validateRecordValue("Discord", "user#1234")).toBeNull();
    });

    it("accepts discord username without discriminator", () => {
      expect(validateRecordValue("Discord", "username")).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("trims whitespace before validation", () => {
      expect(validateRecordValue("Bio", "  hello  ")).toBeNull();
    });

    it("accepts exactly 64 character string for Bio", () => {
      expect(validateRecordValue("Bio", "a".repeat(64))).toBeNull();
    });

    it("rejects 65 character string for Bio", () => {
      expect(validateRecordValue("Bio", "a".repeat(65))).toBe(
        "Max 64 characters",
      );
    });

    it("handles very long input gracefully", () => {
      const longInput = "a".repeat(1000);
      expect(validateRecordValue("Bio", longInput)).toBe("Max 64 characters");
    });
  });

  describe("Email validation edge cases", () => {
    it("accepts email with numbers", () => {
      expect(validateRecordValue("Email", "user123@example.com")).toBeNull();
    });

    it("accepts email with subdomain", () => {
      expect(validateRecordValue("Email", "user@mail.example.com")).toBeNull();
    });

    it("rejects email with spaces", () => {
      expect(validateRecordValue("Email", "user @example.com")).toBe(
        "Must be a valid email",
      );
    });

    it("rejects email with multiple @", () => {
      expect(validateRecordValue("Email", "user@@example.com")).toBe(
        "Must be a valid email",
      );
    });

    it("rejects email starting with @", () => {
      expect(validateRecordValue("Email", "@example.com")).toBe(
        "Must be a valid email",
      );
    });
  });

  describe("URL validation edge cases", () => {
    it("accepts http URL", () => {
      expect(validateRecordValue("Uri", "http://example.com")).toBeNull();
    });

    it("accepts URL with query params", () => {
      expect(
        validateRecordValue("Uri", "https://example.com/path?query=value"),
      ).toBeNull();
    });

    it("accepts URL with fragment", () => {
      expect(
        validateRecordValue("Uri", "https://example.com/path#section"),
      ).toBeNull();
    });

    it("accepts localhost URL", () => {
      expect(validateRecordValue("Uri", "http://localhost:3000")).toBeNull();
    });

    it("accepts IP address URL", () => {
      expect(validateRecordValue("Uri", "http://127.0.0.1:3000")).toBeNull();
    });

    it("rejects URL with missing protocol", () => {
      expect(validateRecordValue("Uri", "example.com")).toBe(
        "Must be a valid URL",
      );
    });

    it("rejects URL with only path", () => {
      expect(validateRecordValue("Uri", "/path/to/resource")).toBe(
        "Must be a valid URL",
      );
    });
  });

  describe("Price validation edge cases", () => {
    it("accepts zero", () => {
      expect(validateRecordValue("Price", "0")).toBeNull();
    });

    it("accepts negative number", () => {
      expect(validateRecordValue("Price", "-10")).toBeNull();
    });

    it("accepts decimal starting with dot", () => {
      expect(validateRecordValue("Price", ".5")).toBeNull();
    });

    it("accepts scientific notation", () => {
      expect(validateRecordValue("Price", "1e2")).toBeNull();
    });

    it("rejects empty string", () => {
      expect(validateRecordValue("Price", "")).toBe("Value is required");
    });

    it("rejects multiple decimal points", () => {
      expect(validateRecordValue("Price", "10.5.5")).toBe("Must be a number");
    });
  });
});

describe("isUrlRecord", () => {
  it("returns true for Uri", () => {
    expect(isUrlRecord("Uri")).toBe(true);
  });

  it("returns true for Avatar", () => {
    expect(isUrlRecord("Avatar")).toBe(true);
  });

  it("returns false for Bio", () => {
    expect(isUrlRecord("Bio")).toBe(false);
  });

  it("returns false for Email", () => {
    expect(isUrlRecord("Email")).toBe(false);
  });

  it("returns false for Wallet", () => {
    expect(isUrlRecord("Wallet")).toBe(false);
  });

  it("returns false for Price", () => {
    expect(isUrlRecord("Price")).toBe(false);
  });

  it("returns false for Main", () => {
    expect(isUrlRecord("Main")).toBe(false);
  });

  it("returns false for Twitter", () => {
    expect(isUrlRecord("Twitter")).toBe(false);
  });

  it("returns false for Discord", () => {
    expect(isUrlRecord("Discord")).toBe(false);
  });
});

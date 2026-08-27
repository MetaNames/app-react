import { describe, it, expect, vi } from "vitest";
import {
  validateRecordValue,
  createRecordRepository,
  recordLink,
} from "../records";

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
    // The old hand-rolled check accepted any non-empty text (see the removed
    // "future improvement opportunity" note this test used to carry). Now
    // that value validation is delegated to the SDK's getRecordValidator
    // (matching app-legacy), a wallet value must actually look like a
    // Partisia blockchain address (42 hex characters).
    it("accepts a valid-looking wallet address", () => {
      expect(
        validateRecordValue(
          "Wallet",
          "00d1f3d2b0e0c3a4b5c6d7e8f900112233445566aa",
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

  describe("Twitter type", () => {
    it("accepts valid twitter handle", () => {
      expect(validateRecordValue("Twitter", "@username")).toBeNull();
    });
  });

  describe("Discord type", () => {
    // Discord dropped username#discriminator years ago; the SDK's validator
    // (adopted here, replacing the old hand-rolled no-op check) enforces the
    // modern lowercase-alphanumeric-with-dots-and-underscores format.
    it("accepts a modern discord username", () => {
      expect(validateRecordValue("Discord", "username")).toBeNull();
    });

    it("rejects a legacy username#discriminator value", () => {
      expect(validateRecordValue("Discord", "user#1234")).toBe(
        "Invalid Discord username format",
      );
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

    it("rejects negative number (SDK's PriceRecordValidator enforces minPrice 0)", () => {
      expect(validateRecordValue("Price", "-10")).toBe("Must be a number");
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

describe("createRecordRepository", () => {
  function sdkWith(domain: unknown) {
    return {
      domainRepository: { find: vi.fn().mockResolvedValue(domain) },
    } as unknown as Parameters<typeof createRecordRepository>[0];
  }

  it("derives the record repository from the domain the chain returns", async () => {
    const repository = { getRecords: vi.fn() };
    const getRecordRepository = vi.fn().mockReturnValue(repository);
    const sdk = sdkWith({ getRecordRepository });

    await expect(createRecordRepository(sdk, "alice.mpc")).resolves.toBe(
      repository,
    );
    expect(getRecordRepository).toHaveBeenCalledWith(sdk);
  });

  // An unregistered name is not an error condition — the caller renders the
  // register flow instead — so this must resolve null rather than throw.
  it("returns null when the domain does not exist", async () => {
    await expect(
      createRecordRepository(sdkWith(null), "nobody.mpc"),
    ).resolves.toBeNull();
  });
});

describe("recordLink", () => {
  it("keeps a URL that already carries a scheme", () => {
    expect(recordLink("Uri", "https://example.com/path")).toBe(
      "https://example.com/path",
    );
  });

  // Without a scheme the browser resolves the href against this site, so
  // `example.com` would link to /domain/name.mpc/example.com.
  it("treats a schemeless URL as a website", () => {
    expect(recordLink("Uri", "example.com")).toBe("https://example.com/");
  });

  it.each(["javascript:alert(1)", "data:text/html,<script>", "file:///etc"])(
    "refuses to link %s",
    (value) => {
      expect(recordLink("Uri", value)).toBeNull();
    },
  );

  it("links an email to a mail client", () => {
    expect(recordLink("Email", "someone@example.com")).toBe(
      "mailto:someone@example.com",
    );
  });

  it("leaves a value that is not an address unlinked", () => {
    expect(recordLink("Email", "not an email")).toBeNull();
  });

  it("links a Twitter handle whether or not it carries the @", () => {
    expect(recordLink("Twitter", "@metanames_")).toBe(
      "https://x.com/metanames_",
    );
    expect(recordLink("Twitter", "metanames_")).toBe(
      "https://x.com/metanames_",
    );
  });

  it("leaves anything longer than a handle unlinked", () => {
    expect(recordLink("Twitter", "a".repeat(16))).toBeNull();
    expect(recordLink("Twitter", "two words")).toBeNull();
  });

  it("links an account address to its explorer page", () => {
    const address = `00${"a".repeat(40)}`;
    expect(recordLink("Wallet", address)).toContain(`/accounts/${address}`);
  });

  it("links a contract address to the contract page", () => {
    const address = `01${"b".repeat(40)}`;
    expect(recordLink("Wallet", address)).toContain(`/contracts/${address}`);
  });

  it("leaves a wallet value that is not an address unlinked", () => {
    expect(recordLink("Wallet", "my wallet")).toBeNull();
    expect(recordLink("Wallet", "00abc")).toBeNull();
  });

  it.each(["Bio", "Price", "Discord"] as const)(
    "gives %s nowhere to go",
    (type) => {
      expect(recordLink(type, "anything")).toBeNull();
    },
  );

  it("ignores surrounding whitespace, and an empty value", () => {
    expect(recordLink("Email", "  a@b.com  ")).toBe("mailto:a@b.com");
    expect(recordLink("Uri", "   ")).toBeNull();
  });
});

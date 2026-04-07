import { describe, it, expect } from "vitest";
import { cn, formatDate, truncateAddress } from "../utils";

describe("cn", () => {
  it("merges class names with tailwind-merge", () => {
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });

  it("handles clsx-style inputs", () => {
    const result = cn("text-red-500", false && "bg-blue-500", "text-lg");
    expect(result).toBe("text-red-500 text-lg");
  });

  it("returns empty string for empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles array inputs", () => {
    const result = cn(["px-2", "py-1"]);
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
  });

  it("handles object inputs", () => {
    const result = cn({ "text-red": true, "text-blue": false });
    expect(result).toContain("text-red");
    expect(result).not.toContain("text-blue");
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const date = new Date("2024-01-15");
    expect(formatDate(date)).toBe("Jan 15, 2024");
  });

  it("formats a date string", () => {
    expect(formatDate("2024-06-20")).toBe("Jun 20, 2024");
  });

  it("formats ISO date string", () => {
    expect(formatDate("2024-12-25T10:30:00Z")).toContain("2024");
  });

  it("returns 'Never' for null", () => {
    expect(formatDate(null)).toBe("Never");
  });

  it("returns 'Never' for undefined", () => {
    expect(formatDate(undefined)).toBe("Never");
  });
});

describe("truncateAddress", () => {
  it("truncates a long address", () => {
    const address = "0x123456789abcdef123456789abcdef12345678";
    const result = truncateAddress(address);
    expect(result).toBe("0x12...5678");
  });

  it("truncates with custom char count", () => {
    const address = "0x123456789abcdef123456789abcdef12345678";
    const result = truncateAddress(address, 6);
    expect(result).toBe("0x1234...345678");
  });

  it("returns address unchanged if too short", () => {
    const address = "0x1234";
    const result = truncateAddress(address);
    expect(result).toBe("0x1234");
  });

  it("returns empty string for empty address", () => {
    expect(truncateAddress("")).toBe("");
  });

  it("handles address at exact boundary", () => {
    const address = "0x1234567"; // length 9, chars=4, 4*2+3=11, 9 <= 11
    const result = truncateAddress(address);
    expect(result).toBe("0x1234567");
  });
});

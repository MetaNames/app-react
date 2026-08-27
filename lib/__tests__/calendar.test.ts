import { describe, it, expect } from "vitest";
import { buildExpiryReminder, expiryReminderFilename } from "../calendar";

const BASE = {
  domainName: "alice.mpc",
  expiresAt: new Date("2027-01-15T10:30:00.000Z"),
  url: "https://app.metanames.app/domain/alice.mpc",
  now: new Date("2026-06-01T00:00:00.000Z"),
};

describe("buildExpiryReminder", () => {
  it("emits a single well-formed VEVENT", () => {
    const ics = buildExpiryReminder(BASE);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics.match(/END:VEVENT/g)).toHaveLength(1);
  });

  it("starts the event at the expiry instant, in UTC", () => {
    expect(buildExpiryReminder(BASE)).toContain("DTSTART:20270115T103000Z");
  });

  it("ends the event an hour later", () => {
    expect(buildExpiryReminder(BASE)).toContain("DTEND:20270115T113000Z");
  });

  // Re-importing must update the event, not create a second copy.
  it("uses a UID stable across exports of the same domain", () => {
    const first = buildExpiryReminder(BASE);
    const second = buildExpiryReminder({ ...BASE, now: new Date() });
    const uid = (ics: string) => ics.match(/UID:(.+)/)?.[1];
    expect(uid(first)).toBe(uid(second));
    expect(uid(first)).toBe("alice.mpc-expiry@metanames");
  });

  it("warns ahead of time rather than only on the day", () => {
    const ics = buildExpiryReminder(BASE);
    expect(ics).toContain("TRIGGER:-P30D");
    expect(ics).toContain("TRIGGER:-P7D");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
  });

  it("links back to the domain page", () => {
    expect(buildExpiryReminder(BASE)).toContain(
      "URL:https://app.metanames.app/domain/alice.mpc",
    );
  });

  // An unescaped comma or semicolon truncates the field in real clients.
  it("escapes text separators in the summary and description", () => {
    const ics = buildExpiryReminder({
      ...BASE,
      domainName: "a,b;c.mpc",
    });
    expect(ics).toContain("SUMMARY:a\\,b\\;c.mpc expires");
    expect(ics).not.toMatch(/SUMMARY:a,b/);
  });

  // RFC 5545 mandates CRLF; LF-only files are rejected by some importers.
  it("terminates every line with CRLF", () => {
    const ics = buildExpiryReminder(BASE);
    expect(ics.split("\r\n").length).toBeGreaterThan(10);
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
  });
});

describe("expiryReminderFilename", () => {
  it("names the file after the domain", () => {
    expect(expiryReminderFilename("alice.mpc")).toBe("alice.mpc-expiry.ics");
  });

  it("strips characters a filesystem would choke on", () => {
    expect(expiryReminderFilename("a/b .mpc")).toBe(
      "a-b--expiry.ics.mpc".replace(
        "a-b--expiry.ics.mpc",
        "a-b-.mpc-expiry.ics",
      ),
    );
  });
});

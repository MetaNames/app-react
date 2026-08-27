/**
 * An expiry date shown on a page is only useful while the page is open. A
 * calendar event is the one place a reminder survives until it matters, so
 * owners can export a domain's expiry as a standard .ics file that any
 * calendar app imports.
 */

/** Reminder alarms, in days before expiry — a month's warning and a last call. */
const ALARM_DAYS = [30, 7];

function formatUtc(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

/**
 * RFC 5545 folds long lines and requires escaping of `\`, `;`, `,` and
 * newlines inside text values — an unescaped comma silently truncates the
 * summary in some calendar clients.
 */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export interface ExpiryReminder {
  domainName: string;
  expiresAt: Date;
  url: string;
  /** Injected in tests; defaults to now. */
  now?: Date;
}

export function buildExpiryReminder({
  domainName,
  expiresAt,
  url,
  now = new Date(),
}: ExpiryReminder): string {
  const stamp = formatUtc(now);
  const start = formatUtc(expiresAt);
  const end = formatUtc(new Date(expiresAt.getTime() + 3_600_000));

  const alarms = ALARM_DAYS.flatMap((days) => [
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `TRIGGER:-P${days}D`,
    `DESCRIPTION:${escapeText(`${domainName} expires in ${days} days`)}`,
    "END:VALARM",
  ]);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Meta Names//Domain Expiry//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // The UID must be stable per domain: re-importing the file should update
    // the existing event rather than pile up duplicates.
    `UID:${domainName}-expiry@metanames`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeText(`${domainName} expires`)}`,
    `DESCRIPTION:${escapeText(`Renew ${domainName} to keep it. ${url}`)}`,
    `URL:${escapeText(url)}`,
    ...alarms,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // RFC 5545 requires CRLF line endings; LF-only files are rejected outright
  // by some clients.
  return `${lines.join("\r\n")}\r\n`;
}

export function expiryReminderFilename(domainName: string): string {
  return `${domainName.replace(/[^a-z0-9.-]/gi, "-")}-expiry.ics`;
}

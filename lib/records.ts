import type { RecordClass, RecordRepository } from "./types";
import { explorerAddressUrl } from "./url";
import { RECORD_CLASS_MAP } from "./constants";
import { getRecordValidator, type MetaNamesSdk } from "@metanames/sdk";

/**
 * Friendly, short error messages shown in the UI. The SDK's own validator
 * messages (e.g. "Invalid email format") are still used as the source of
 * truth for pass/fail, but we keep the app's existing copy for the cases
 * that already had a dedicated message.
 */
function friendlyMessage(type: RecordClass, sdkErrors: string[]): string {
  if (type === "Uri") return "Must be a valid URL";
  if (type === "Email") return "Must be a valid email";
  if (type === "Price") return "Must be a number";
  return sdkErrors[0] ?? "Invalid value";
}

export function validateRecordValue(
  type: RecordClass,
  value: string,
): string | null {
  if (!value?.trim()) return "Value is required";

  const classInfo = RECORD_CLASS_MAP[type];
  if (!classInfo) return `Unsupported record type: ${type}`;

  if (value.length > 64) return "Max 64 characters";

  const validator = getRecordValidator(classInfo.value);
  const valid = validator.validate(
    { class: classInfo.value, data: value },
    { raiseError: false },
  );
  if (!valid) {
    return friendlyMessage(type, validator.getErrors());
  }
  return null;
}

/**
 * Only these two schemes reach an href we build. A record is 64 characters of
 * whatever its owner typed, so a value beginning `javascript:` or `data:`
 * would otherwise become a link that runs it — anyone visiting the domain page
 * being the target. Anything without a scheme is treated as a bare host and
 * gets `https://`, which is what someone typing `example.com` means.
 */
const SAFE_URL_SCHEMES = ["http:", "https:"];

/** A handle, with or without the leading @, and nothing else. */
const TWITTER_HANDLE = /^@?[A-Za-z0-9_]{1,15}$/;

function webUrl(value: string): string | null {
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)
    ? value
    : `https://${value}`;
  try {
    const url = new URL(candidate);
    return SAFE_URL_SCHEMES.includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Where a record value points, or null when it points nowhere.
 *
 * A record is only useful once you can act on it, and until now every class
 * but Uri rendered as text: an email you had to retype, a handle you had to
 * search for, an address you had to paste into the explorer yourself. The
 * value is still shown verbatim — this only decides what clicking it does.
 */
export function recordLink(type: RecordClass, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  switch (type) {
    case "Uri":
      return webUrl(trimmed);
    case "Email":
      // The chain accepts anything the SDK validator passed, but a value with
      // a space or no @ is not an address and must not become a mailto link.
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
        ? `mailto:${trimmed}`
        : null;
    case "Twitter":
      return TWITTER_HANDLE.test(trimmed)
        ? `https://x.com/${trimmed.replace(/^@/, "")}`
        : null;
    case "Wallet":
      // Explorer links are built from the address bytes, so only a value that
      // looks like one gets a link rather than a 404.
      return /^[0-9a-fA-F]{42}$/.test(trimmed)
        ? explorerAddressUrl(trimmed.toLowerCase())
        : null;
    // Bio, Price and Discord have nowhere to go: a Discord tag is not
    // addressable by URL, and the other two are plain data.
    default:
      return null;
  }
}

/**
 * Fetch the SDK Domain object and derive its RecordRepository.
 * This is the correct pattern: find the domain first, then call getRecordRepository.
 */
export async function createRecordRepository(
  sdk: MetaNamesSdk,
  domainName: string,
): Promise<RecordRepository | null> {
  const sdkDomain = await sdk.domainRepository.find(domainName);
  if (!sdkDomain) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (sdkDomain as any).getRecordRepository(sdk) as RecordRepository;
}

import { toUnicode } from "tr46";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Pure-ASCII labels keep the original strict rule (lowercase letters, digits,
// hyphens only) so existing behaviour — rejecting uppercase, underscores,
// spaces, etc. — is unchanged for the ASCII case.
const ASCII_LABEL = /^[a-z0-9-]+$/;
const HAS_NON_ASCII = /[^\x00-\x7f]/;

// Mirrors `DomainValidator.rules.maxLength` in @metanames/sdk.
const SDK_MAX_DOMAIN_LENGTH = 32;

// Legacy (SDK's `DomainValidator.normalize`) supports internationalized
// domain labels by running them through tr46's `toUnicode` with
// `useSTD3ASCIIRules`, which also decodes punycode (`xn--`) labels back to
// Unicode and rejects characters disallowed under IDNA's STD3 rules (spaces,
// underscores, most punctuation). We only take this path for labels that
// contain a non-ASCII character (or are punycode), so plain ASCII input keeps
// its existing, stricter validation untouched.
function isValidUnicodeLabel(part: string): boolean {
  if (!HAS_NON_ASCII.test(part) && !part.startsWith("xn--")) return false;
  const { domain, error } = toUnicode(part, { useSTD3ASCIIRules: true });
  return !error && domain.length > 0;
}

export function validateDomainName(name: string): ValidationResult {
  if (name.startsWith("."))
    return { valid: false, error: "Domain cannot start with a dot" };
  let clean = name;
  while (clean.endsWith(".mpc")) clean = clean.slice(0, -4);
  if (clean.includes(".."))
    return { valid: false, error: "Cannot contain consecutive dots" };
  // The SDK's own `DomainValidator` (which legacy uses directly, and which
  // `analyze()`/`find()` run on every lookup) caps the WHOLE name at 32
  // characters *including* the ".mpc" suffix — it checks `name.length` before
  // stripping the TLD. Capping each label at 32 instead let names through that
  // the SDK then threw on, surfacing as a 500 from /check and a bounce to the
  // home page rather than an actionable "too long" message.
  const fullName = `${clean}.mpc`;
  if (fullName.length > SDK_MAX_DOMAIN_LENGTH)
    return {
      valid: false,
      error: `Domain name must be at most ${SDK_MAX_DOMAIN_LENGTH - ".mpc".length} characters`,
    };
  const parts = clean.split(".");
  for (const part of parts) {
    if (part.length < 1)
      return {
        valid: false,
        error: "Domain name must be at least 1 character",
      };
    if (part.startsWith("-") || part.endsWith("-"))
      return { valid: false, error: "Cannot start or end with a hyphen" };
    if (!ASCII_LABEL.test(part) && !isValidUnicodeLabel(part))
      return {
        valid: false,
        error: "Only lowercase letters, numbers, and hyphens allowed",
      };
  }
  return { valid: true };
}
export function normalizeDomain(name: string): string {
  return name.endsWith(".mpc") ? name : `${name}.mpc`;
}
export function parseSubdomain(name: string): {
  isSubdomain: boolean;
  parent: string | null;
} {
  const clean = name.endsWith(".mpc") ? name.slice(0, -4) : name;
  const parts = clean.split(".");
  if (parts.length === 1) return { isSubdomain: false, parent: null };
  return { isSubdomain: true, parent: `${parts.slice(1).join(".")}.mpc` };
}

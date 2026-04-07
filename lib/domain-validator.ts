export interface ValidationResult {
  valid: boolean;
  error?: string;
}
export function validateDomainName(name: string): ValidationResult {
  if (name.startsWith("."))
    return { valid: false, error: "Domain cannot start with a dot" };
  let clean = name;
  while (clean.endsWith(".mpc")) clean = clean.slice(0, -4);
  if (clean.includes(".."))
    return { valid: false, error: "Cannot contain consecutive dots" };
  const parts = clean.split(".");
  for (const part of parts) {
    if (part.length < 1)
      return {
        valid: false,
        error: "Domain name must be at least 1 character",
      };
    if (part.length > 32)
      return {
        valid: false,
        error: "Domain name must be at most 32 characters",
      };
    if (part.startsWith("-") || part.endsWith("-"))
      return { valid: false, error: "Cannot start or end with a hyphen" };
    if (/[^a-z0-9-]/.test(part))
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

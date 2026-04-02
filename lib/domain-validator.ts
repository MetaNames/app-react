export interface ValidationResult { valid: boolean; error?: string; }
export function validateDomainName(name: string): ValidationResult {
  const clean = name.replace(/\.mpc$/, '');
  const parts = clean.split('.');
  for (const part of parts) {
    if (part.length < 3) return { valid: false, error: 'Domain name must be at least 3 characters' };
    if (part.length > 32) return { valid: false, error: 'Domain name must be at most 32 characters' };
    if (part.startsWith('-') || part.endsWith('-')) return { valid: false, error: 'Cannot start or end with a hyphen' };
    if (/[^a-z0-9-]/.test(part)) return { valid: false, error: 'Only lowercase letters, numbers, and hyphens allowed' };
  }
  if (clean.includes('..')) return { valid: false, error: 'Cannot contain consecutive dots' };
  return { valid: true };
}
export function normalizeDomain(name: string): string { return name.endsWith('.mpc') ? name : `${name}.mpc`; }
export function parseSubdomain(name: string): { isSubdomain: boolean; parent: string | null } {
  const clean = name.replace(/\.mpc$/, '');
  const parts = clean.split('.');
  if (parts.length === 1) return { isSubdomain: false, parent: null };
  return { isSubdomain: true, parent: `${parts.slice(1).join('.')}.mpc` };
}

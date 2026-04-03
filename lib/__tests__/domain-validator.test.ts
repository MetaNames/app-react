import { describe, it, expect } from 'vitest';
import { validateDomainName, normalizeDomain, parseSubdomain } from '../domain-validator';

describe('validateDomainName', () => {
  describe('minimum 3 characters', () => {
    it('rejects single character', () => {
      const result = validateDomainName('a');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Domain name must be at least 3 characters');
    });

    it('rejects two characters', () => {
      const result = validateDomainName('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Domain name must be at least 3 characters');
    });

    it('accepts three characters', () => {
      const result = validateDomainName('abc');
      expect(result.valid).toBe(true);
    });
  });

  describe('maximum 32 characters', () => {
    it('accepts 32 characters', () => {
      const result = validateDomainName('abcdefghijklmnopqrstuvwxyz123456');
      expect(result.valid).toBe(true);
    });

    it('rejects 33 characters', () => {
      const result = validateDomainName('abcdefghijklmnopqrstuvwxyz1234567');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Domain name must be at most 32 characters');
    });
  });

  describe('no leading hyphen', () => {
    it('rejects domain starting with hyphen', () => {
      const result = validateDomainName('-start');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot start or end with a hyphen');
    });

    it('accepts domain without leading hyphen', () => {
      const result = validateDomainName('start');
      expect(result.valid).toBe(true);
    });
  });

  describe('no trailing hyphen', () => {
    it('rejects domain ending with hyphen', () => {
      const result = validateDomainName('end-');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot start or end with a hyphen');
    });

    it('accepts domain without trailing hyphen', () => {
      const result = validateDomainName('end');
      expect(result.valid).toBe(true);
    });
  });

  describe('no spaces or special characters', () => {
    it('rejects spaces', () => {
      const result = validateDomainName('test name');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only lowercase letters, numbers, and hyphens allowed');
    });

    it('rejects special characters', () => {
      const result = validateDomainName('test!@#');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only lowercase letters, numbers, and hyphens allowed');
    });

    it('rejects uppercase letters', () => {
      const result = validateDomainName('Test');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only lowercase letters, numbers, and hyphens allowed');
    });

    it('accepts lowercase letters only', () => {
      const result = validateDomainName('test');
      expect(result.valid).toBe(true);
    });

    it('accepts letters and numbers', () => {
      const result = validateDomainName('test123');
      expect(result.valid).toBe(true);
    });

    it('accepts hyphens in middle', () => {
      const result = validateDomainName('test-domain');
      expect(result.valid).toBe(true);
    });
  });

  describe('no double dots', () => {
    it('rejects double dots - but min char check catches it first since split produces empty part', () => {
      const result = validateDomainName('te..st.mpc');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Domain name must be at least 3 characters');
    });

    it('rejects leading dot', () => {
      const result = validateDomainName('.test');
      expect(result.valid).toBe(false);
    });

    it('accepts single dot', () => {
      const result = validateDomainName('sub.test');
      expect(result.valid).toBe(true);
    });
  });

  describe('with .mpc TLD', () => {
    it('strips .mpc suffix before validation', () => {
      const result = validateDomainName('test.mpc');
      expect(result.valid).toBe(true);
    });

    it('validates subdomain without .mpc', () => {
      const result = validateDomainName('sub.test');
      expect(result.valid).toBe(true);
    });
  });
});

describe('normalizeDomain', () => {
  it('adds .mpc suffix if not present', () => {
    expect(normalizeDomain('test')).toBe('test.mpc');
  });

  it('keeps .mpc suffix if already present', () => {
    expect(normalizeDomain('test.mpc')).toBe('test.mpc');
  });

  it('handles empty string edge case', () => {
    expect(normalizeDomain('')).toBe('.mpc');
  });
});

describe('parseSubdomain', () => {
  it('identifies regular domain as not subdomain', () => {
    const result = parseSubdomain('test.mpc');
    expect(result.isSubdomain).toBe(false);
    expect(result.parent).toBeNull();
  });

  it('identifies subdomain correctly', () => {
    const result = parseSubdomain('sub.test.mpc');
    expect(result.isSubdomain).toBe(true);
    expect(result.parent).toBe('test.mpc');
  });

  it('handles deeply nested subdomains', () => {
    const result = parseSubdomain('deep.nested.test.mpc');
    expect(result.isSubdomain).toBe(true);
    expect(result.parent).toBe('nested.test.mpc');
  });

  it('handles domain without .mpc suffix', () => {
    const result = parseSubdomain('sub.test');
    expect(result.isSubdomain).toBe(true);
    expect(result.parent).toBe('test.mpc');
  });

  it('handles empty string edge case', () => {
    const result = parseSubdomain('');
    expect(result.isSubdomain).toBe(false);
    expect(result.parent).toBeNull();
  });

  it('handles double .mpc suffix edge case', () => {
    const result = parseSubdomain('test.mpc.mpc');
    expect(result.isSubdomain).toBe(true);
    expect(result.parent).toBe('mpc.mpc');
  });
});

describe('validateDomainName edge cases', () => {
  it('accepts domain with numbers only', () => {
    const result = validateDomainName('12345');
    expect(result.valid).toBe(true);
  });

  it('accepts domain with single hyphen', () => {
    const result = validateDomainName('a-b');
    expect(result.valid).toBe(true);
  });

  it('accepts domain starting and ending with numbers', () => {
    const result = validateDomainName('123abc456');
    expect(result.valid).toBe(true);
  });

  it('accepts minimum valid domain (3 chars)', () => {
    const result = validateDomainName('abc');
    expect(result.valid).toBe(true);
  });

  it('rejects single character domain', () => {
    const result = validateDomainName('a');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Domain name must be at least 3 characters');
  });

  it('rejects two character domain', () => {
    const result = validateDomainName('ab');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Domain name must be at least 3 characters');
  });

  it('rejects underscore character', () => {
    const result = validateDomainName('test_name');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Only lowercase letters, numbers, and hyphens allowed');
  });

  it('rejects space character', () => {
    const result = validateDomainName('test name');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Only lowercase letters, numbers, and hyphens allowed');
  });

  it('rejects tab character', () => {
    const result = validateDomainName('test\tname');
    expect(result.valid).toBe(false);
  });

  it('rejects newline character', () => {
    const result = validateDomainName('test\nname');
    expect(result.valid).toBe(false);
  });

  it('rejects unicode characters', () => {
    const result = validateDomainName('test\u00A0name');
    expect(result.valid).toBe(false);
  });

  it('rejects uppercase characters', () => {
    const result = validateDomainName('TEST');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Only lowercase letters, numbers, and hyphens allowed');
  });

  it('rejects mixed case', () => {
    const result = validateDomainName('Test');
    expect(result.valid).toBe(false);
  });

  it('rejects domain with hyphen at start', () => {
    const result = validateDomainName('-test');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Cannot start or end with a hyphen');
  });

  it('rejects domain with hyphen at end', () => {
    const result = validateDomainName('test-');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Cannot start or end with a hyphen');
  });

  it('rejects domain starting with hyphen and .mpc', () => {
    const result = validateDomainName('-test.mpc');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Cannot start or end with a hyphen');
  });

  it('rejects domain ending with hyphen and .mpc', () => {
    const result = validateDomainName('test-.mpc');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Cannot start or end with a hyphen');
  });

  it('accepts maximum valid domain (32 chars)', () => {
    const result = validateDomainName('abcdefghijklmnopqrstuvwxyz123456');
    expect(result.valid).toBe(true);
  });

  it('rejects 33 character domain', () => {
    const result = validateDomainName('abcdefghijklmnopqrstuvwxyz1234567');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Domain name must be at most 32 characters');
  });

  it('handles empty string edge case', () => {
    const result = validateDomainName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Domain name must be at least 3 characters');
  });

  it('handles only dots', () => {
    const result = validateDomainName('...');
    expect(result.valid).toBe(false);
  });

  it('handles only hyphens', () => {
    const result = validateDomainName('---');
    expect(result.valid).toBe(false);
  });

  it('rejects consecutive dots in domain', () => {
    const result = validateDomainName('te..st');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Domain name must be at least 3 characters');
  });

  it('rejects domain with empty part due to consecutive dots', () => {
    const result = validateDomainName('a..b');
    expect(result.valid).toBe(false);
  });

  it('rejects domain with leading dot', () => {
    const result = validateDomainName('.test');
    expect(result.valid).toBe(false);
  });

  it('rejects leading dot', () => {
    const result = validateDomainName('.test');
    expect(result.valid).toBe(false);
  });

  it('accepts subdomain (two parts)', () => {
    const result = validateDomainName('sub.test');
    expect(result.valid).toBe(true);
  });

  it('accepts deeply nested subdomain', () => {
    const result = validateDomainName('deep.nested.test');
    expect(result.valid).toBe(true);
  });

  it('validates subdomain without .mpc suffix', () => {
    const result = validateDomainName('sub.test');
    expect(result.valid).toBe(true);
  });

  it('validates domain with .mpc suffix', () => {
    const result = validateDomainName('test.mpc');
    expect(result.valid).toBe(true);
  });

  it('validates subdomain with .mpc suffix', () => {
    const result = validateDomainName('sub.test.mpc');
    expect(result.valid).toBe(true);
  });

  it('treats sub.test.mpc.mpc as subdomain', () => {
    const result = validateDomainName('sub.test.mpc.mpc');
    expect(result.valid).toBe(true);
  });
});

describe('normalizeDomain edge cases', () => {
  it('adds .mpc to domain without suffix', () => {
    expect(normalizeDomain('mydomain')).toBe('mydomain.mpc');
  });

  it('keeps existing .mpc suffix', () => {
    expect(normalizeDomain('mydomain.mpc')).toBe('mydomain.mpc');
  });

  it('handles uppercase input by not modifying', () => {
    expect(normalizeDomain('MyDomain')).toBe('MyDomain.mpc');
  });

  it('handles subdomain without .mpc', () => {
    expect(normalizeDomain('sub.test')).toBe('sub.test.mpc');
  });

  it('handles subdomain with .mpc', () => {
    expect(normalizeDomain('sub.test.mpc')).toBe('sub.test.mpc');
  });

  it('handles deeply nested subdomain', () => {
    expect(normalizeDomain('deep.nested.test')).toBe('deep.nested.test.mpc');
  });

  it('handles empty string edge case', () => {
    expect(normalizeDomain('')).toBe('.mpc');
  });

  it('handles single character', () => {
    expect(normalizeDomain('a')).toBe('a.mpc');
  });

  it('handles double .mpc', () => {
    expect(normalizeDomain('test.mpc.mpc')).toBe('test.mpc.mpc');
  });

  it('preserves numbers in domain', () => {
    expect(normalizeDomain('domain123')).toBe('domain123.mpc');
  });

  it('preserves hyphens in domain', () => {
    expect(normalizeDomain('my-domain')).toBe('my-domain.mpc');
  });
});

describe('parseSubdomain edge cases', () => {
  it('identifies regular domain correctly', () => {
    const result = parseSubdomain('test');
    expect(result.isSubdomain).toBe(false);
    expect(result.parent).toBeNull();
  });

  it('identifies regular domain with .mpc suffix correctly', () => {
    const result = parseSubdomain('test.mpc');
    expect(result.isSubdomain).toBe(false);
    expect(result.parent).toBeNull();
  });

  it('identifies single-level subdomain', () => {
    const result = parseSubdomain('sub.test.mpc');
    expect(result.isSubdomain).toBe(true);
    expect(result.parent).toBe('test.mpc');
  });

  it('identifies deeply nested subdomain', () => {
    const result = parseSubdomain('deep.nested.test.mpc');
    expect(result.isSubdomain).toBe(true);
    expect(result.parent).toBe('nested.test.mpc');
  });

  it('handles subdomain without .mpc suffix', () => {
    const result = parseSubdomain('sub.test');
    expect(result.isSubdomain).toBe(true);
    expect(result.parent).toBe('test.mpc');
  });

  it('handles deeply nested subdomain without .mpc', () => {
    const result = parseSubdomain('deep.nested.test');
    expect(result.isSubdomain).toBe(true);
    expect(result.parent).toBe('nested.test.mpc');
  });

  it('handles empty string', () => {
    const result = parseSubdomain('');
    expect(result.isSubdomain).toBe(false);
    expect(result.parent).toBeNull();
  });

  it('handles single character', () => {
    const result = parseSubdomain('a');
    expect(result.isSubdomain).toBe(false);
    expect(result.parent).toBeNull();
  });

  it('handles double .mpc suffix edge case', () => {
    const result = parseSubdomain('test.mpc.mpc');
    expect(result.isSubdomain).toBe(true);
    expect(result.parent).toBe('mpc.mpc');
  });

  it('handles triple nested .mpc', () => {
    const result = parseSubdomain('a.b.c.mpc');
    expect(result.isSubdomain).toBe(true);
    expect(result.parent).toBe('b.c.mpc');
  });

  it('handles numbers in subdomain', () => {
    const result = parseSubdomain('sub123.test456.mpc');
    expect(result.isSubdomain).toBe(true);
    expect(result.parent).toBe('test456.mpc');
  });

  it('handles hyphens in subdomain', () => {
    const result = parseSubdomain('my-sub.test-domain.mpc');
    expect(result.isSubdomain).toBe(true);
    expect(result.parent).toBe('test-domain.mpc');
  });
});
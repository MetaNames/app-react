import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { vi } from 'vitest';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('default environment (test)', () => {
    it('defaults to test environment when NEXT_PUBLIC_ENV is not set', async () => {
      delete process.env.NEXT_PUBLIC_ENV;
      const { config } = await import('../config');
      expect(config.environment).toBe('test');
      expect(config.isTestnet).toBe(true);
    });

    it('returns testnet browser URL', async () => {
      delete process.env.NEXT_PUBLIC_ENV;
      const { config } = await import('../config');
      expect(config.browserUrl).toBe('https://browser.testnet.partisiablockchain.com');
    });

    it('returns testnet chainId', async () => {
      delete process.env.NEXT_PUBLIC_ENV;
      const { config } = await import('../config');
      expect(config.chainId).toBe('Partisia Blockchain Testnet');
    });

    it('returns testnet sdkEnvironment', async () => {
      delete process.env.NEXT_PUBLIC_ENV;
      const { config } = await import('../config');
      expect(config.sdkEnvironment).toBe('testnet');
    });

    it('returns testnet tldMigrationProposalContractAddress', async () => {
      delete process.env.NEXT_PUBLIC_ENV;
      const { config } = await import('../config');
      expect(config.tldMigrationProposalContractAddress).toBe('03e8b7d9c2a0b3c4f8e7a6d5c4b3a2e1f0d9c8b7a6');
    });
  });

  describe('prod environment', () => {
    it('detects prod environment', async () => {
      process.env.NEXT_PUBLIC_ENV = 'prod';
      const { config } = await import('../config');
      expect(config.environment).toBe('prod');
      expect(config.isTestnet).toBe(false);
    });

    it('returns prod browser URL', async () => {
      process.env.NEXT_PUBLIC_ENV = 'prod';
      const { config } = await import('../config');
      expect(config.browserUrl).toBe('https://browser.partisiablockchain.com');
    });

    it('returns prod chainId', async () => {
      process.env.NEXT_PUBLIC_ENV = 'prod';
      const { config } = await import('../config');
      expect(config.chainId).toBe('Partisia Blockchain');
    });

    it('returns mainnet sdkEnvironment', async () => {
      process.env.NEXT_PUBLIC_ENV = 'prod';
      const { config } = await import('../config');
      expect(config.sdkEnvironment).toBe('mainnet');
    });

    it('returns prod tldMigrationProposalContractAddress', async () => {
      process.env.NEXT_PUBLIC_ENV = 'prod';
      const { config } = await import('../config');
      expect(config.tldMigrationProposalContractAddress).toBe('04b3b6b2d5b0a46a0c7c09c8a03c47b17c4c6a97b0');
    });
  });

  describe('static values', () => {
    it('has correct landingUrl default', async () => {
      const { config } = await import('../config');
      expect(config.landingUrl).toBe('https://metanames.app');
    });

    it('has correct websiteUrl default', async () => {
      const { config } = await import('../config');
      expect(config.websiteUrl).toBe('https://app.metanames.app');
    });
  });

  describe('contractDisabled', () => {
    it('defaults to false when env var is not set', async () => {
      delete process.env.NEXT_PUBLIC_CONTRACT_DISABLED;
      const { config } = await import('../config');
      expect(config.contractDisabled).toBe(false);
    });

    it('is true when NEXT_PUBLIC_CONTRACT_DISABLED=true', async () => {
      process.env.NEXT_PUBLIC_CONTRACT_DISABLED = 'true';
      const { config } = await import('../config');
      expect(config.contractDisabled).toBe(true);
    });

    it('is false when NEXT_PUBLIC_CONTRACT_DISABLED=false', async () => {
      process.env.NEXT_PUBLIC_CONTRACT_DISABLED = 'false';
      const { config } = await import('../config');
      expect(config.contractDisabled).toBe(false);
    });
  });
});
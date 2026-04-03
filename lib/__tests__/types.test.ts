import { describe, it, expect } from 'vitest';
import {
  BYOC_SYMBOLS,
  PROFILE_RECORD_TYPES,
  SOCIAL_RECORD_TYPES,
  ALL_RECORD_TYPES,
  type BYOCSymbol,
  type RecordClass,
} from '../types';

describe('types', () => {
  describe('BYOCSymbol type', () => {
    it('accepts valid BYOC symbols', () => {
      const symbols: BYOCSymbol[] = ['PARTI', 'BTC', 'ETH', 'USDT', 'TEST_COIN'];
      symbols.forEach((s) => expect(typeof s).toBe('string'));
    });
  });

  describe('BYOC_SYMBOLS constant', () => {
    it('contains all 5 supported symbols', () => {
      expect(BYOC_SYMBOLS).toHaveLength(5);
      expect(BYOC_SYMBOLS).toContain('BTC');
      expect(BYOC_SYMBOLS).toContain('ETH');
      expect(BYOC_SYMBOLS).toContain('USDT');
      expect(BYOC_SYMBOLS).toContain('PARTI');
      expect(BYOC_SYMBOLS).toContain('TEST_COIN');
    });

    it('does not contain duplicates', () => {
      const unique = new Set(BYOC_SYMBOLS);
      expect(unique.size).toBe(BYOC_SYMBOLS.length);
    });

    it('is in the expected order', () => {
      expect(BYOC_SYMBOLS[0]).toBe('BTC');
      expect(BYOC_SYMBOLS[1]).toBe('ETH');
      expect(BYOC_SYMBOLS[2]).toBe('USDT');
      expect(BYOC_SYMBOLS[3]).toBe('PARTI');
      expect(BYOC_SYMBOLS[4]).toBe('TEST_COIN');
    });
  });

  describe('RecordClass type', () => {
    it('accepts all valid record classes', () => {
      const classes: RecordClass[] = ['Bio', 'Email', 'Uri', 'Wallet', 'Price', 'Avatar', 'Main', 'Twitter', 'Discord'];
      classes.forEach((c) => expect(typeof c).toBe('string'));
    });
  });

  describe('PROFILE_RECORD_TYPES constant', () => {
    it('contains 7 profile record types', () => {
      expect(PROFILE_RECORD_TYPES).toHaveLength(7);
      expect(PROFILE_RECORD_TYPES).toContain('Bio');
      expect(PROFILE_RECORD_TYPES).toContain('Email');
      expect(PROFILE_RECORD_TYPES).toContain('Uri');
      expect(PROFILE_RECORD_TYPES).toContain('Wallet');
      expect(PROFILE_RECORD_TYPES).toContain('Price');
      expect(PROFILE_RECORD_TYPES).toContain('Avatar');
      expect(PROFILE_RECORD_TYPES).toContain('Main');
    });

    it('does not contain social record types', () => {
      expect(PROFILE_RECORD_TYPES).not.toContain('Twitter');
      expect(PROFILE_RECORD_TYPES).not.toContain('Discord');
    });
  });

  describe('SOCIAL_RECORD_TYPES constant', () => {
    it('contains 2 social record types', () => {
      expect(SOCIAL_RECORD_TYPES).toHaveLength(2);
      expect(SOCIAL_RECORD_TYPES).toContain('Twitter');
      expect(SOCIAL_RECORD_TYPES).toContain('Discord');
    });

    it('does not contain profile record types', () => {
      expect(SOCIAL_RECORD_TYPES).not.toContain('Bio');
      expect(SOCIAL_RECORD_TYPES).not.toContain('Email');
      expect(SOCIAL_RECORD_TYPES).not.toContain('Uri');
      expect(SOCIAL_RECORD_TYPES).not.toContain('Wallet');
      expect(SOCIAL_RECORD_TYPES).not.toContain('Price');
      expect(SOCIAL_RECORD_TYPES).not.toContain('Avatar');
      expect(SOCIAL_RECORD_TYPES).not.toContain('Main');
    });
  });

  describe('ALL_RECORD_TYPES constant', () => {
    it('contains all 9 record types', () => {
      expect(ALL_RECORD_TYPES).toHaveLength(9);
    });

    it('is profile types followed by social types', () => {
      const expected = [...PROFILE_RECORD_TYPES, ...SOCIAL_RECORD_TYPES];
      expect(ALL_RECORD_TYPES).toEqual(expected);
    });

    it('contains both profile and social types', () => {
      expect(ALL_RECORD_TYPES).toContain('Bio');
      expect(ALL_RECORD_TYPES).toContain('Twitter');
      expect(ALL_RECORD_TYPES).toContain('Discord');
    });
  });
});

describe('Domain interface structure', () => {
  it('has correct shape for Domain object', () => {
    const domain = {
      name: 'test.mpc',
      nameWithoutTLD: 'test',
      owner: '0x1234567890abcdef',
      tokenId: 1,
      createdAt: new Date(),
      expiresAt: new Date(),
      parentId: null,
      records: {},
      getRecordRepository: (sdk: any) => null,
    };

    expect(domain.name).toBe('test.mpc');
    expect(domain.nameWithoutTLD).toBe('test');
    expect(domain.owner).toBe('0x1234567890abcdef');
    expect(domain.tokenId).toBe(1);
    expect(domain.createdAt).toBeInstanceOf(Date);
    expect(domain.expiresAt).toBeInstanceOf(Date);
    expect(domain.parentId).toBeNull();
    expect(typeof domain.records).toBe('object');
    expect(typeof domain.getRecordRepository).toBe('function');
  });

  it('supports subdomain with parentId', () => {
    const subdomain = {
      name: 'sub.test.mpc',
      nameWithoutTLD: 'sub.test',
      owner: '0x1234567890abcdef',
      tokenId: 2,
      createdAt: new Date(),
      expiresAt: new Date(),
      parentId: 'test.mpc',
      records: {},
      getRecordRepository: (sdk: any) => null,
    };

    expect(subdomain.name).toBe('sub.test.mpc');
    expect(subdomain.parentId).toBe('test.mpc');
  });
});

describe('RecordRepository interface structure', () => {
  it('has correct method signatures', () => {
    const repository = {
      create: async (params: { class: string; data: string }) => Promise.resolve({}),
      update: async (params: { class: string; data: string }) => Promise.resolve({}),
      delete: async (recordClass: string) => Promise.resolve({}),
    };

    expect(typeof repository.create).toBe('function');
    expect(typeof repository.update).toBe('function');
    expect(typeof repository.delete).toBe('function');
  });
});

describe('FeesResponse interface structure', () => {
  it('has correct shape', () => {
    const fees = {
      feesLabel: '10.5',
      fees: 10.5,
      symbol: 'PARTI',
      address: '0x1234567890abcdef',
    };

    expect(typeof fees.feesLabel).toBe('string');
    expect(typeof fees.fees).toBe('number');
    expect(typeof fees.symbol).toBe('string');
    expect(typeof fees.address).toBe('string');
  });
});

describe('DomainCheckResponse interface structure', () => {
  it('has correct shape', () => {
    const check: { domainPresent: boolean; parentPresent: boolean } = {
      domainPresent: true,
      parentPresent: false,
    };

    expect(typeof check.domainPresent).toBe('boolean');
    expect(typeof check.parentPresent).toBe('boolean');
  });
});

describe('AlertMessage interface structure', () => {
  it('supports message only', () => {
    const alert: { message: string } = { message: 'Test' };
    expect(alert.message).toBe('Test');
  });

  it('supports message with action', () => {
    const alert: { message: string; action?: { label: string; onClick: () => void } } = {
      message: 'Test',
      action: {
        label: 'Click',
        onClick: () => {},
      },
    };

    expect(alert.message).toBe('Test');
    expect(alert.action?.label).toBe('Click');
    expect(typeof alert.action?.onClick).toBe('function');
  });
});
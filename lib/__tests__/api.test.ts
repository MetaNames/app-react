import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('lib/api', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe('fetchDomain', () => {
    it('calls fetch with correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ domain: { name: 'test.mpc' } }),
      });

      const { fetchDomain } = await import('../api');
      await fetchDomain('test.mpc');

      expect(mockFetch).toHaveBeenCalledWith('/api/domains/test.mpc');
    });

    it('returns domain when found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ domain: { name: 'test.mpc', owner: '0x1234' } }),
      });

      const { fetchDomain } = await import('../api');
      const result = await fetchDomain('test.mpc');

      expect(result).toEqual({ name: 'test.mpc', owner: '0x1234' });
    });

    it('returns null when domain not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ domain: null }),
      });

      const { fetchDomain } = await import('../api');
      const result = await fetchDomain('notfound.mpc');

      expect(result).toBeNull();
    });

    it('returns null when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      const { fetchDomain } = await import('../api');
      const result = await fetchDomain('test.mpc');

      expect(result).toBeNull();
    });

    it('encodes domain name in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ domain: null }),
      });

      const { fetchDomain } = await import('../api');
      await fetchDomain('test domain');

      expect(mockFetch).toHaveBeenCalledWith('/api/domains/test%20domain');
    });
  });

  describe('checkDomain', () => {
    it('calls fetch with correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ domainPresent: false, parentPresent: false }),
      });

      const { checkDomain } = await import('../api');
      await checkDomain('sub.test.mpc');

      expect(mockFetch).toHaveBeenCalledWith('/api/domains/sub.test.mpc/check');
    });

    it('returns domainPresent and parentPresent when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ domainPresent: true, parentPresent: true }),
      });

      const { checkDomain } = await import('../api');
      const result = await checkDomain('sub.test.mpc');

      expect(result).toEqual({ domainPresent: true, parentPresent: true });
    });

    it('returns false values when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      const { checkDomain } = await import('../api');
      const result = await checkDomain('test.mpc');

      expect(result).toEqual({ domainPresent: false, parentPresent: false });
    });
  });

  describe('fetchRegistrationFees', () => {
    it('calls fetch with correct URL for PARTI coin', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ feesLabel: '10.5', fees: 10.5, symbol: 'PARTI', address: '0x1234' }),
      });

      const { fetchRegistrationFees } = await import('../api');
      await fetchRegistrationFees('test.mpc', 'PARTI');

      expect(mockFetch).toHaveBeenCalledWith('/api/register/test.mpc/fees/PARTI');
    });

    it('calls fetch with correct URL for BTC coin', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ feesLabel: '0.0001', fees: 0.0001, symbol: 'BTC', address: '0x1234' }),
      });

      const { fetchRegistrationFees } = await import('../api');
      await fetchRegistrationFees('mydomain.mpc', 'BTC');

      expect(mockFetch).toHaveBeenCalledWith('/api/register/mydomain.mpc/fees/BTC');
    });

    it('returns fees response when successful', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ feesLabel: '10.5', fees: 10.5, symbol: 'PARTI', address: '0x1234' }),
      });

      const { fetchRegistrationFees } = await import('../api');
      const result = await fetchRegistrationFees('test.mpc', 'PARTI');

      expect(result).toEqual({ feesLabel: '10.5', fees: 10.5, symbol: 'PARTI', address: '0x1234' });
    });

    it('returns null when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      const { fetchRegistrationFees } = await import('../api');
      const result = await fetchRegistrationFees('test.mpc', 'ETH');

      expect(result).toBeNull();
    });

    it('handles all supported BYOC symbols', async () => {
      const symbols: ('PARTI' | 'BTC' | 'ETH' | 'USDT' | 'TEST_COIN')[] = ['PARTI', 'BTC', 'ETH', 'USDT', 'TEST_COIN'];

      for (const symbol of symbols) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ feesLabel: '1', fees: 1, symbol, address: '0x1234' }),
        });

        const { fetchRegistrationFees } = await import('../api');
        const result = await fetchRegistrationFees('test.mpc', symbol);

        expect(mockFetch).toHaveBeenCalledWith(`/api/register/test.mpc/fees/${symbol}`);
        expect(result?.symbol).toBe(symbol);
        mockFetch.mockReset();
      }
    });
  });
});
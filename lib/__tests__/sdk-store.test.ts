import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSdkStore } from '../stores/sdk-store';

describe('sdk-store', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have initial selectedCoin as TEST_COIN', () => {
    const { result } = renderHook(() => useSdkStore());
    expect(result.current.selectedCoin).toBe('TEST_COIN');
  });

  it('should have metaNamesSdk as null initially', () => {
    const { result } = renderHook(() => useSdkStore());
    expect(result.current.metaNamesSdk).toBeNull();
  });

  it('should set selectedCoin to BTC', () => {
    const { result } = renderHook(() => useSdkStore());
    act(() => {
      result.current.setSelectedCoin('BTC');
    });
    expect(result.current.selectedCoin).toBe('BTC');
  });

  it('should set selectedCoin to PARTI', () => {
    const { result } = renderHook(() => useSdkStore());
    act(() => {
      result.current.setSelectedCoin('PARTI');
    });
    expect(result.current.selectedCoin).toBe('PARTI');
  });

  it('should set selectedCoin to ETH', () => {
    const { result } = renderHook(() => useSdkStore());
    act(() => {
      result.current.setSelectedCoin('ETH');
    });
    expect(result.current.selectedCoin).toBe('ETH');
  });

  it('should set selectedCoin to USDT', () => {
    const { result } = renderHook(() => useSdkStore());
    act(() => {
      result.current.setSelectedCoin('USDT');
    });
    expect(result.current.selectedCoin).toBe('USDT');
  });

  it('should set selectedCoin and then change it', () => {
    const { result } = renderHook(() => useSdkStore());
    act(() => {
      result.current.setSelectedCoin('BTC');
    });
    expect(result.current.selectedCoin).toBe('BTC');
    act(() => {
      result.current.setSelectedCoin('TEST_COIN');
    });
    expect(result.current.selectedCoin).toBe('TEST_COIN');
  });

  it('should set metaNamesSdk', () => {
    const { result } = renderHook(() => useSdkStore());
    const mockSdk = { name: 'mocked-sdk' };
    act(() => {
      result.current.setMetaNamesSdk(mockSdk as any);
    });
    expect(result.current.metaNamesSdk).toBe(mockSdk);
  });

  it('should set metaNamesSdk and then update it', () => {
    const { result } = renderHook(() => useSdkStore());
    const mockSdk1 = { name: 'mocked-sdk-1' };
    const mockSdk2 = { name: 'mocked-sdk-2' };
    act(() => {
      result.current.setMetaNamesSdk(mockSdk1 as any);
    });
    expect(result.current.metaNamesSdk).toBe(mockSdk1);
    act(() => {
      result.current.setMetaNamesSdk(mockSdk2 as any);
    });
    expect(result.current.metaNamesSdk).toBe(mockSdk2);
  });
});
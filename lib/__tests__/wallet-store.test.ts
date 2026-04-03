import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWalletStore } from '../stores/wallet-store';

describe('wallet-store', () => {
  it('should have correct initial state', () => {
    const { result } = renderHook(() => useWalletStore());
    expect(result.current.address).toBeUndefined();
    expect(result.current.alertMessage).toBeUndefined();
    expect(result.current.alertTransaction).toBeUndefined();
    expect(result.current.refresh).toBe(false);
  });

  it('should set address', () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => {
      result.current.setAddress('0x1234567890abcdef');
    });
    expect(result.current.address).toBe('0x1234567890abcdef');
  });

  it('should clear address when set to undefined', () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => {
      result.current.setAddress('0x1234567890abcdef');
    });
    act(() => {
      result.current.setAddress(undefined);
    });
    expect(result.current.address).toBeUndefined();
  });

  it('should set alertMessage as string', () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => {
      result.current.setAlertMessage('Test alert');
    });
    expect(result.current.alertMessage).toBe('Test alert');
  });

  it('should set alertMessage as AlertMessage object', () => {
    const { result } = renderHook(() => useWalletStore());
    const alertWithAction = {
      message: 'Test alert',
      action: { label: 'Click me', onClick: vi.fn() },
    };
    act(() => {
      result.current.setAlertMessage(alertWithAction);
    });
    expect(result.current.alertMessage).toEqual(alertWithAction);
  });

  it('should clear alertMessage when set to undefined', () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => {
      result.current.setAlertMessage('Test alert');
    });
    act(() => {
      result.current.setAlertMessage(undefined);
    });
    expect(result.current.alertMessage).toBeUndefined();
  });

  it('should set alertTransaction', () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => {
      result.current.setAlertTransaction('txhash123');
    });
    expect(result.current.alertTransaction).toBe('txhash123');
  });

  it('should clear alertTransaction when set to undefined', () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => {
      result.current.setAlertTransaction('txhash123');
    });
    act(() => {
      result.current.setAlertTransaction(undefined);
    });
    expect(result.current.alertTransaction).toBeUndefined();
  });

  it('should set refresh', () => {
    const { result } = renderHook(() => useWalletStore());
    expect(result.current.refresh).toBe(false);
    act(() => {
      result.current.setRefresh(true);
    });
    expect(result.current.refresh).toBe(true);
  });

  it('should toggle refresh state', () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => {
      result.current.setRefresh(true);
    });
    expect(result.current.refresh).toBe(true);
    act(() => {
      result.current.setRefresh(false);
    });
    expect(result.current.refresh).toBe(false);
  });
});
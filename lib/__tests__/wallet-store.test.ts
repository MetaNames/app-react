import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWalletStore } from "../stores/wallet-store";

describe("wallet-store", () => {
  it("should have correct initial state", () => {
    const { result } = renderHook(() => useWalletStore());
    expect(result.current.address).toBeUndefined();
    expect(result.current.alertMessage).toBeUndefined();
    expect(result.current.lastRefreshed).toBeNull();
  });

  it("should set address", () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => {
      result.current.setAddress("0x1234567890abcdef");
    });
    expect(result.current.address).toBe("0x1234567890abcdef");
  });

  it("should clear address when set to undefined", () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => {
      result.current.setAddress("0x1234567890abcdef");
    });
    act(() => {
      result.current.setAddress(undefined);
    });
    expect(result.current.address).toBeUndefined();
  });

  it("should set alertMessage as AlertMessage object", () => {
    const { result } = renderHook(() => useWalletStore());
    const alertWithAction = {
      message: "Test alert",
      action: { label: "Click me", onClick: vi.fn() },
    };
    act(() => {
      result.current.setAlertMessage(alertWithAction);
    });
    expect(result.current.alertMessage).toEqual(alertWithAction);
  });

  it("should clear alertMessage when set to undefined", () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => {
      result.current.setAlertMessage({
        message: "Test alert",
        action: { label: "Click me", onClick: vi.fn() },
      });
    });
    act(() => {
      result.current.setAlertMessage(undefined);
    });
    expect(result.current.alertMessage).toBeUndefined();
  });

  it("should trigger refresh with timestamp", () => {
    const { result } = renderHook(() => useWalletStore());
    expect(result.current.lastRefreshed).toBeNull();
    const beforeRefresh = Date.now();
    act(() => {
      result.current.triggerRefresh();
    });
    expect(result.current.lastRefreshed).toBeGreaterThanOrEqual(beforeRefresh);
  });
});

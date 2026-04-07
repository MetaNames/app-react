import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSdkStore } from "../stores/sdk-store";

describe("sdk-store", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have initial selectedCoin as ETH", () => {
    const { result } = renderHook(() => useSdkStore());
    expect(result.current.selectedCoin).toBe("ETH");
  });

  it("should have metaNamesSdk as null initially", () => {
    const { result } = renderHook(() => useSdkStore());
    expect(result.current.metaNamesSdk).toBeNull();
  });

  it("should set selectedCoin to ETH_GOERLI", () => {
    const { result } = renderHook(() => useSdkStore());
    act(() => {
      result.current.setSelectedCoin("ETH_GOERLI");
    });
    expect(result.current.selectedCoin).toBe("ETH_GOERLI");
  });

  it("should set selectedCoin to TEST_COIN", () => {
    const { result } = renderHook(() => useSdkStore());
    act(() => {
      result.current.setSelectedCoin("TEST_COIN");
    });
    expect(result.current.selectedCoin).toBe("TEST_COIN");
  });

  it("should set selectedCoin to ETH_GOERLI", () => {
    const { result } = renderHook(() => useSdkStore());
    act(() => {
      result.current.setSelectedCoin("ETH_GOERLI");
    });
    expect(result.current.selectedCoin).toBe("ETH_GOERLI");
  });

  it("should set selectedCoin and then change it", () => {
    const { result } = renderHook(() => useSdkStore());
    act(() => {
      result.current.setSelectedCoin("ETH_GOERLI");
    });
    expect(result.current.selectedCoin).toBe("ETH_GOERLI");
    act(() => {
      result.current.setSelectedCoin("TEST_COIN");
    });
    expect(result.current.selectedCoin).toBe("TEST_COIN");
  });

  it("should set metaNamesSdk", () => {
    const { result } = renderHook(() => useSdkStore());
    const mockSdk = { name: "mocked-sdk" };
    act(() => {
      result.current.setMetaNamesSdk(
        mockSdk as unknown as Parameters<
          typeof result.current.setMetaNamesSdk
        >[0],
      );
    });
    expect(result.current.metaNamesSdk).toBe(mockSdk);
  });

  it("should set metaNamesSdk and then update it", () => {
    const { result } = renderHook(() => useSdkStore());
    const mockSdk1 = { name: "mocked-sdk-1" };
    const mockSdk2 = { name: "mocked-sdk-2" };
    act(() => {
      result.current.setMetaNamesSdk(
        mockSdk1 as unknown as Parameters<
          typeof result.current.setMetaNamesSdk
        >[0],
      );
    });
    expect(result.current.metaNamesSdk).toBe(mockSdk1);
    act(() => {
      result.current.setMetaNamesSdk(
        mockSdk2 as unknown as Parameters<
          typeof result.current.setMetaNamesSdk
        >[0],
      );
    });
    expect(result.current.metaNamesSdk).toBe(mockSdk2);
  });
});

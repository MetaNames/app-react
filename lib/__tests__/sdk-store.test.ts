import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { MetaNamesSdk } from "@metanames/sdk";
import {
  useSdkStore,
  selectSelectedCoin,
  selectAvailableCoins,
} from "../stores/sdk-store";

function sdkWithByoc(symbols: string[]): MetaNamesSdk {
  return {
    config: { byoc: symbols.map((symbol) => ({ symbol })) },
  } as unknown as MetaNamesSdk;
}

describe("sdk-store", () => {
  // The store is a module-level singleton — without a reset, state set by one
  // test (e.g. metaNamesSdk/coin selection) leaks into the next.
  beforeEach(() => {
    useSdkStore.setState({ metaNamesSdk: null, _selectedCoin: undefined });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have initial selectedCoin as ETH", () => {
    const { result } = renderHook(() => useSdkStore());
    expect(selectSelectedCoin(result.current)).toBe("ETH");
  });

  // Matches legacy's `stores/sdk.ts`: `byocs.find((byoc) => byoc.symbol ===
  // 'ETH') ?? byocs[0]` — ETH wins even when it is not first in the list.
  it("defaults to ETH when it is available but not first in the coin list", () => {
    const { result } = renderHook(() => useSdkStore());
    act(() => {
      result.current.setMetaNamesSdk(sdkWithByoc(["MATIC", "ETH", "SOL"]));
    });
    expect(selectAvailableCoins(result.current)).toEqual([
      "MATIC",
      "ETH",
      "SOL",
    ]);
    expect(selectSelectedCoin(result.current)).toBe("ETH");
  });

  it("falls back to the first available coin when ETH is not in the list", () => {
    const { result } = renderHook(() => useSdkStore());
    act(() => {
      result.current.setMetaNamesSdk(sdkWithByoc(["MATIC", "SOL"]));
    });
    expect(selectSelectedCoin(result.current)).toBe("MATIC");
  });

  it("keeps an explicitly selected coin even when ETH is available", () => {
    const { result } = renderHook(() => useSdkStore());
    act(() => {
      result.current.setMetaNamesSdk(sdkWithByoc(["ETH", "MATIC"]));
      result.current.setSelectedCoin("MATIC");
    });
    expect(selectSelectedCoin(result.current)).toBe("MATIC");
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
    expect(selectSelectedCoin(result.current)).toBe("ETH_GOERLI");
  });

  it("should set selectedCoin to TEST_COIN", () => {
    const { result } = renderHook(() => useSdkStore());
    act(() => {
      result.current.setSelectedCoin("TEST_COIN");
    });
    expect(selectSelectedCoin(result.current)).toBe("TEST_COIN");
  });

  it("should set selectedCoin and then change it", () => {
    const { result } = renderHook(() => useSdkStore());
    act(() => {
      result.current.setSelectedCoin("ETH_GOERLI");
    });
    expect(selectSelectedCoin(result.current)).toBe("ETH_GOERLI");
    act(() => {
      result.current.setSelectedCoin("TEST_COIN");
    });
    expect(selectSelectedCoin(result.current)).toBe("TEST_COIN");
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

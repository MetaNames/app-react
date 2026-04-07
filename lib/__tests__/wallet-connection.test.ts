import { describe, it, expect, vi, beforeEach } from "vitest";
import { connectDevPrivateKey, disconnectWallet } from "../wallet";
import type { MetaNamesSdk } from "@metanames/sdk";

vi.mock("partisia-blockchain-applications-crypto", async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  const mockFn = (key: string) => `parsed_address_from_${key.slice(0, 8)}`;
  // Avoid spread operator as it can preserve references to the actual module
  const mock: Record<string, unknown> = {};
  for (const k of Object.keys(actual)) {
    mock[k] = actual[k];
  }
  mock.default = undefined;
  mock.partisiaCrypto = {
    wallet: {
      privateKeyToAccountAddress: mockFn,
    },
  };
  return mock;
});

describe("connectDevPrivateKey", () => {
  let mockSdk: Partial<MetaNamesSdk>;

  beforeEach(() => {
    mockSdk = {
      setSigningStrategy: vi.fn(),
    };
  });

  it("imports private key and returns address", async () => {
    const privateKey =
      "df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c27928c";
    const address = await connectDevPrivateKey(
      mockSdk as MetaNamesSdk,
      privateKey,
    );

    expect(address).toBe("parsed_address_from_df4642ef");
  });

  it("calls setSigningStrategy with privateKey strategy", async () => {
    const privateKey =
      "df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c27928c";
    await connectDevPrivateKey(mockSdk as MetaNamesSdk, privateKey);

    expect(mockSdk.setSigningStrategy).toHaveBeenCalledWith(
      "privateKey",
      privateKey,
    );
  });
});

describe("disconnectWallet", () => {
  it("calls resetSigningStrategy on sdk", () => {
    const mockSdk = {
      resetSigningStrategy: vi.fn(),
    };

    disconnectWallet(mockSdk as unknown as MetaNamesSdk);

    expect(mockSdk.resetSigningStrategy).toHaveBeenCalledTimes(1);
  });
});

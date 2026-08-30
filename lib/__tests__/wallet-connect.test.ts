import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { MetaNamesSdk } from "@metanames/sdk";

const partisiaConnect = vi.fn();
const partisiaConnection: { account?: { address?: string } } | null = {
  account: { address: "partisia-address" },
};

vi.mock("partisia-blockchain-applications-sdk", () => ({
  default: class {
    connection = partisiaConnection;
    connect = partisiaConnect;
  },
}));

const transportCreate = vi.fn();
vi.mock("@ledgerhq/hw-transport-webusb", () => ({
  default: { create: (...args: unknown[]) => transportCreate(...args) },
}));

const ledgerGetAddress = vi.fn();
vi.mock("@metanames/sdk/transactions/ledger", () => ({
  PartisiaLedgerClient: class {
    constructor(public transport: unknown) {}
    getAddress = ledgerGetAddress;
  },
}));

const privateKeyToAccountAddress = vi.fn();
vi.mock("partisia-blockchain-applications-crypto", () => ({
  default: {
    partisiaCrypto: {
      wallet: {
        privateKeyToAccountAddress: (key: string) =>
          privateKeyToAccountAddress(key),
      },
    },
  },
}));

import {
  connectMetaMask,
  connectPartisiaWallet,
  connectLedger,
  connectDevPrivateKey,
  disconnectWallet,
} from "../wallet";

function mockSdk() {
  return {
    setSigningStrategy: vi.fn(),
    resetSigningStrategy: vi.fn(),
  } as unknown as MetaNamesSdk & {
    setSigningStrategy: ReturnType<typeof vi.fn>;
    resetSigningStrategy: ReturnType<typeof vi.fn>;
  };
}

/** Install (or remove) the injected provider the connector reads. */
function setEthereum(
  value: {
    isMetaMask?: boolean;
    request?: unknown;
    providers?: unknown[];
  } | null,
) {
  const w = window as unknown as Record<string, unknown>;
  if (value === null) {
    delete w.ethereum;
    return;
  }
  w.ethereum = value;
}

describe("connectMetaMask", () => {
  afterEach(() => setEthereum(null));

  it("requests the snap, returns the address, and installs the strategy", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ address: "mm-address" });
    setEthereum({ isMetaMask: true, request });
    const sdk = mockSdk();

    await expect(connectMetaMask(sdk)).resolves.toBe("mm-address");
    expect(request).toHaveBeenNthCalledWith(1, {
      method: "wallet_requestSnaps",
      params: { "npm:@partisiablockchain/snap": {} },
    });
    expect(sdk.setSigningStrategy).toHaveBeenCalledWith(
      "MetaMask",
      expect.anything(),
    );
  });

  it("refuses when no MetaMask provider is present", async () => {
    setEthereum(null);
    const sdk = mockSdk();

    await expect(connectMetaMask(sdk)).rejects.toThrow("MetaMask not found");
    expect(sdk.setSigningStrategy).not.toHaveBeenCalled();
  });

  // Extensions inject on `window.ethereum`, never on `window` itself: a
  // connector reading the flag off the window finds nothing in a real browser.
  it("refuses when the flag is on the window instead of the provider", async () => {
    setEthereum(null);
    const w = window as unknown as Record<string, unknown>;
    w.isMetaMask = true;
    w.request = vi.fn();
    const sdk = mockSdk();

    await expect(connectMetaMask(sdk)).rejects.toThrow("MetaMask not found");

    delete w.isMetaMask;
    delete w.request;
  });

  // Several wallets installed at once: the last one to load owns
  // `window.ethereum` and lists the others under `providers`.
  it("finds MetaMask among several injected providers", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce("mm-address");
    setEthereum({
      isMetaMask: false,
      request: vi.fn(),
      providers: [
        { isMetaMask: false, request: vi.fn() },
        { isMetaMask: true, request },
      ],
    });
    const sdk = mockSdk();

    await expect(connectMetaMask(sdk)).resolves.toBe("mm-address");
  });

  // The snap answers with the address itself; older builds wrapped it.
  it("accepts the address as a bare string", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce("bare-address");
    setEthereum({ isMetaMask: true, request });
    const sdk = mockSdk();

    await expect(connectMetaMask(sdk)).resolves.toBe("bare-address");
  });

  // A snap that resolves without an address must not leave the app "connected"
  // to an account it cannot name.
  it("refuses when the snap returns no address", async () => {
    setEthereum({ isMetaMask: true, request: vi.fn().mockResolvedValue({}) });
    const sdk = mockSdk();

    await expect(connectMetaMask(sdk)).rejects.toThrow(
      "No address from MetaMask",
    );
    expect(sdk.setSigningStrategy).not.toHaveBeenCalled();
  });
});

describe("connectPartisiaWallet", () => {
  beforeEach(() => {
    partisiaConnect.mockReset().mockResolvedValue(undefined);
    partisiaConnection.account = { address: "partisia-address" };
  });

  it("connects with the sign permission and returns the account address", async () => {
    const sdk = mockSdk();

    await expect(connectPartisiaWallet(sdk)).resolves.toBe("partisia-address");
    expect(partisiaConnect).toHaveBeenCalledWith(
      expect.objectContaining({ permissions: ["sign"], dappName: "MetaNames" }),
    );
    expect(sdk.setSigningStrategy).toHaveBeenCalledWith(
      "partisiaSdk",
      expect.anything(),
    );
  });

  it("refuses when the wallet connects without exposing an account", async () => {
    partisiaConnection.account = undefined;
    const sdk = mockSdk();

    await expect(connectPartisiaWallet(sdk)).rejects.toThrow(
      "No address from Partisia Wallet",
    );
    expect(sdk.setSigningStrategy).not.toHaveBeenCalled();
  });
});

describe("connectLedger", () => {
  beforeEach(() => {
    transportCreate.mockReset().mockResolvedValue({ close: vi.fn() });
    ledgerGetAddress.mockReset().mockResolvedValue("ledger-address");
  });

  it("opens a WebUSB transport and signs through it", async () => {
    const sdk = mockSdk();

    await expect(connectLedger(sdk)).resolves.toBe("ledger-address");
    expect(transportCreate).toHaveBeenCalled();
    expect(sdk.setSigningStrategy).toHaveBeenCalledWith(
      "Ledger",
      expect.anything(),
    );
  });

  it("refuses when the device reports no address", async () => {
    ledgerGetAddress.mockResolvedValue("");
    const sdk = mockSdk();

    await expect(connectLedger(sdk)).rejects.toThrow("No address from Ledger");
    expect(sdk.setSigningStrategy).not.toHaveBeenCalled();
  });
});

describe("connectDevPrivateKey", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    privateKeyToAccountAddress.mockReset().mockReturnValue("dev-address");
  });

  afterEach(() => {
    vi.stubEnv("NODE_ENV", originalEnv ?? "test");
  });

  it("derives the address from the key and installs the strategy", async () => {
    const sdk = mockSdk();

    await expect(connectDevPrivateKey(sdk, "deadbeef")).resolves.toBe(
      "dev-address",
    );
    expect(privateKeyToAccountAddress).toHaveBeenCalledWith("deadbeef");
    expect(sdk.setSigningStrategy).toHaveBeenCalledWith(
      "privateKey",
      "deadbeef",
    );
  });

  // A raw private key in the browser is a development affordance only; shipping
  // it to production would hand every user a footgun.
  it("refuses outright in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const sdk = mockSdk();

    await expect(connectDevPrivateKey(sdk, "deadbeef")).rejects.toThrow(
      "only available in development mode",
    );
    expect(sdk.setSigningStrategy).not.toHaveBeenCalled();
  });
});

describe("disconnectWallet", () => {
  it("clears the signing strategy so later writes cannot be signed", () => {
    const sdk = mockSdk();
    disconnectWallet(sdk);
    expect(sdk.resetSigningStrategy).toHaveBeenCalled();
  });
});

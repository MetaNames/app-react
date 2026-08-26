import { describe, it, expect, vi } from "vitest";
import {
  explorerTransactionUrl,
  explorerAddressUrl,
  bridgeUrl,
  shortLinkUrl,
} from "../url";

vi.mock("../config", () => ({
  config: {
    browserUrl: "https://browser.testnet.partisiablockchain.com",
    isTestnet: true,
  },
}));

describe("explorerTransactionUrl", () => {
  it("returns transaction URL with correct path", () => {
    expect(explorerTransactionUrl("abc123")).toBe(
      "https://browser.testnet.partisiablockchain.com/transactions/abc123",
    );
  });

  it("handles long transaction hashes", () => {
    const txHash = "3f8e7a6d5c4b3a2e1f0d9c8b7a6e5d4c3b2a1";
    expect(explorerTransactionUrl(txHash)).toBe(
      `https://browser.testnet.partisiablockchain.com/transactions/${txHash}`,
    );
  });
});

describe("explorerAddressUrl", () => {
  it("returns account URL for addresses starting with 00", () => {
    const address = "00" + "b".repeat(62);
    expect(explorerAddressUrl(address)).toBe(
      `https://browser.testnet.partisiablockchain.com/accounts/${address}/assets`,
    );
  });

  it("returns contract URL for addresses not starting with 00", () => {
    const address = "01" + "c".repeat(62);
    expect(explorerAddressUrl(address)).toBe(
      `https://browser.testnet.partisiablockchain.com/contracts/${address}`,
    );
  });

  it("treats 01-prefixed addresses as contracts", () => {
    expect(explorerAddressUrl("01abc123")).toBe(
      "https://browser.testnet.partisiablockchain.com/contracts/01abc123",
    );
  });

  it("treats 02-prefixed addresses as contracts", () => {
    expect(explorerAddressUrl("02xyz789")).toBe(
      "https://browser.testnet.partisiablockchain.com/contracts/02xyz789",
    );
  });
});

describe("bridgeUrl", () => {
  it("returns bridge URL", () => {
    expect(bridgeUrl()).toBe(
      "https://browser.testnet.partisiablockchain.com/bridge",
    );
  });
});

describe("shortLinkUrl", () => {
  it("returns short link URL with name", () => {
    expect(shortLinkUrl("myname")).toBe("https://metanam.es/myname");
  });

  it("handles names with special characters", () => {
    expect(shortLinkUrl("my-name_123")).toBe("https://metanam.es/my-name_123");
  });

  it("handles names with spaces encoded", () => {
    expect(shortLinkUrl("my%20name")).toBe("https://metanam.es/my%20name");
  });
});

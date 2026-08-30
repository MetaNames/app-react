import type { MetaNamesSdk } from "@metanames/sdk";
import type { MetaMaskSdk } from "@metanames/sdk/interface";
import type { PermissionTypes } from "partisia-blockchain-applications-sdk/lib/sdk-listeners";
import { config } from "./config";

interface EthereumProvider extends MetaMaskSdk {
  isMetaMask?: boolean;
  /** Set when several wallet extensions are installed side by side. */
  providers?: EthereumProvider[];
}

/**
 * The MetaMask provider, or nothing when it is not installed.
 *
 * Extensions inject themselves on `window.ethereum`, not on `window`. When more
 * than one is installed they share that slot: whichever loaded last owns it and
 * the rest are listed under `providers`, so the flag has to be checked on each
 * entry rather than on the slot itself.
 */
function metaMaskProvider(): EthereumProvider | undefined {
  const injected = (window as { ethereum?: EthereumProvider }).ethereum;
  if (!injected) return undefined;
  if (injected.providers?.length)
    return injected.providers.find((provider) => provider.isMetaMask);

  return injected.isMetaMask ? injected : undefined;
}

export async function connectMetaMask(sdk: MetaNamesSdk): Promise<string> {
  const eth = metaMaskProvider();
  if (!eth) throw new Error("MetaMask not found");
  await eth.request({
    method: "wallet_requestSnaps",
    params: { "npm:@partisiablockchain/snap": {} },
  });
  // The snap answers `get_address` with the address itself. Older builds
  // wrapped it in an object, so both shapes are read.
  const res = (await eth.request({
    method: "wallet_invokeSnap",
    params: {
      snapId: "npm:@partisiablockchain/snap",
      request: { method: "get_address" },
    },
  })) as string | { address?: string } | undefined;
  const address = typeof res === "string" ? res : res?.address;
  if (!address) throw new Error("No address from MetaMask");
  sdk.setSigningStrategy("MetaMask", eth);
  return address;
}
export async function connectPartisiaWallet(
  sdk: MetaNamesSdk,
): Promise<string> {
  const PartisiaSdk = (await import("partisia-blockchain-applications-sdk"))
    .default;
  const client = new PartisiaSdk();
  await client.connect({
    chainId: config.chainId,
    permissions: ["sign"] as PermissionTypes[],
    dappName: "MetaNames",
  });
  const address = client.connection?.account?.address;
  if (!address) throw new Error("No address from Partisia Wallet");
  sdk.setSigningStrategy("partisiaSdk", client);
  return address;
}
export async function connectLedger(sdk: MetaNamesSdk): Promise<string> {
  const { default: TransportWebUSB } =
    await import("@ledgerhq/hw-transport-webusb");
  const { PartisiaLedgerClient } =
    await import("@metanames/sdk/transactions/ledger");
  const transport = await TransportWebUSB.create();
  const client = new PartisiaLedgerClient(transport);
  const address = await client.getAddress();
  if (!address) throw new Error("No address from Ledger");
  sdk.setSigningStrategy("Ledger", transport);
  return address;
}
export async function connectDevPrivateKey(
  sdk: MetaNamesSdk,
  privateKey: string,
): Promise<string> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("This method is only available in development mode");
  }
  const mod = await import("partisia-blockchain-applications-crypto");
  const partisiaCrypto = mod.default?.partisiaCrypto ?? mod.partisiaCrypto;
  const address = partisiaCrypto.wallet.privateKeyToAccountAddress(privateKey);
  sdk.setSigningStrategy("privateKey", privateKey);
  return address;
}
export function disconnectWallet(sdk: MetaNamesSdk) {
  sdk.resetSigningStrategy();
}
export const shortenAddress = (a: string) =>
  a?.length >= 8 ? `${a.slice(0, 4)}...${a.slice(-4)}` : a;
export const validatePrivateKey = (k: string) => /^[0-9a-fA-F]{64}$/.test(k);
export const validateAddress = (a: string) => /^[a-zA-Z0-9]{42}$/.test(a);

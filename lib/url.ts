import { config } from "./config";

// Partisia Blockchain addresses are typed by their first hex byte: `00` identifies a
// plain account address (anything else — including TLD registry contracts and
// contract-owned subdomains — routes as a system/contract address). Detecting this
// from the address itself (rather than trusting a caller-supplied "is this a TLD"
// flag) is what legacy does, and it's the only way to get correct links for
// non-TLD domains whose owner happens to be a contract.
const ACCOUNT_ADDRESS_HEX_PREFIX = "00";

export const explorerTransactionUrl = (tx: string) =>
  `${config.browserUrl}/transactions/${tx}`;

export const explorerAddressUrl = (address: string) =>
  address.startsWith(ACCOUNT_ADDRESS_HEX_PREFIX)
    ? `${config.browserUrl}/accounts/${address}/assets`
    : `${config.browserUrl}/contracts/${address}`;

export const bridgeUrl = () => `${config.browserUrl}/bridge`;

export const shortLinkUrl = (name: string) => `https://metanam.es/${name}`;

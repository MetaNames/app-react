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

// `_isContract` is accepted (but ignored) purely so existing call sites that still
// pass a second argument keep compiling; the explorer link is always derived from
// the address prefix now.
export const explorerAddressUrl = (address: string, _isContract?: boolean) =>
  address.startsWith(ACCOUNT_ADDRESS_HEX_PREFIX)
    ? `${config.browserUrl}/accounts/${address}/assets`
    : `${config.browserUrl}/contracts/${address}`;

export const bridgeUrl = () => `${config.browserUrl}/bridge`;

export const shortLinkUrl = (name: string) => `https://metanam.es/${name}`;

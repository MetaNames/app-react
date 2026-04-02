import { config } from './config';
export const explorerTransactionUrl = (tx: string) => `${config.browserUrl}/transactions/${tx}`;
export const explorerAddressUrl = (addr: string, isContract = false) =>
  isContract ? `${config.browserUrl}/contracts/${addr}` : `${config.browserUrl}/accounts/${addr}/assets`;
export const bridgeUrl = () => `${config.browserUrl}/bridge`;
export const shortLinkUrl = (name: string) => `https://metanam.es/${name}`;

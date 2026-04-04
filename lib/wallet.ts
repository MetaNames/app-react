import type { MetaNamesSdk } from '@metanames/sdk';
import { config } from './config';
export async function connectMetaMask(sdk: MetaNamesSdk): Promise<string> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error('MetaMask not found');
  await eth.request({ method: 'wallet_requestSnaps', params: { 'npm:@partisiablockchain/snap': {} } });
  const res = await eth.request({ method: 'wallet_invokeSnap', params: { snapId: 'npm:@partisiablockchain/snap', request: { method: 'get_address' } } });
  if (!res?.address) throw new Error('No address from MetaMask');
  sdk.setSigningStrategy('MetaMask', eth);
  return res.address;
}
export async function connectPartisiaWallet(sdk: MetaNamesSdk): Promise<string> {
  const PartisiaSdk = (await import('partisia-blockchain-applications-sdk')).default;
  const client = new PartisiaSdk();
  await client.connect({ chainId: config.chainId, permissions: ['sign'] as any, dappName: 'MetaNames' });
  const address = (client as any).connection?.account?.address;
  if (!address) throw new Error('No address from Partisia Wallet');
  sdk.setSigningStrategy('partisiaSdk', client);
  return address;
}
export async function connectLedger(sdk: MetaNamesSdk): Promise<string> {
  const { default: TransportWebUSB } = await import('@ledgerhq/hw-transport-webusb');
  const { PartisiaLedgerClient } = await import('@metanames/sdk/dist/transactions/ledger');
  const transport = await TransportWebUSB.create();
  const client = new PartisiaLedgerClient(transport);
  const address = await client.getAddress();
  if (!address) throw new Error('No address from Ledger');
  sdk.setSigningStrategy('Ledger', transport);
  return address;
}
export async function connectDevPrivateKey(sdk: MetaNamesSdk, privateKey: string): Promise<string> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This method is only available in development mode');
  }
  const mod = await import('partisia-blockchain-applications-crypto') as any;
  const partiisiaCrypto = mod.default?.partisiaCrypto || mod.partisiaCrypto;
  const address = partiisiaCrypto.wallet.privateKeyToAccountAddress(privateKey);
  sdk.setSigningStrategy('privateKey', privateKey);
  return address;
}
export function disconnectWallet(sdk: MetaNamesSdk) { sdk.resetSigningStrategy(); }
export const shortenAddress = (a: string) => a?.length >= 8 ? `${a.slice(0,4)}...${a.slice(-4)}` : a;
export const validatePrivateKey = (k: string) => /^[0-9a-fA-F]{64}$/.test(k);
export const validateAddress = (a: string) => /^[a-zA-Z0-9]{42}$/.test(a);

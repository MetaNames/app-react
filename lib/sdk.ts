import { MetaNamesSdk, Enviroment } from '@metanames/sdk';
import { config } from './config';
export function metaNamesSdkFactory(): MetaNamesSdk {
  return new MetaNamesSdk(config.isTestnet ? Enviroment.testnet : Enviroment.mainnet);
}
export function getServerSdk(): MetaNamesSdk {
  const env =
    process.env.NEXT_PUBLIC_ENV === 'prod' ? Enviroment.mainnet : Enviroment.testnet;
  const sdk = new MetaNamesSdk(env);
  const key = process.env.TESTNET_PRIVATE_KEY;
  if (key) try { sdk.setSigningStrategy('privateKey', key); } catch {}
  return sdk;
}
export async function getAccountBalance(sdk: MetaNamesSdk, address: string, coin: string): Promise<number> {
  try { const b = await (sdk as any).accountRepository?.getBalance?.(address, coin); return typeof b === 'number' ? b : 0; } catch { return 0; }
}

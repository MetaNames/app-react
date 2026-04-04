import { MetaNamesSdk, Enviroment } from '@metanames/sdk';
import { config } from './config';
export function metaNamesSdkFactory(): MetaNamesSdk {
  return new MetaNamesSdk(config.isTestnet ? Enviroment.testnet : Enviroment.mainnet);
}
export function getServerSdk(): MetaNamesSdk {
  const env =
    process.env.NEXT_PUBLIC_ENV === 'prod' ? Enviroment.mainnet : Enviroment.testnet;
  const sdk = new MetaNamesSdk(env);
  return sdk;
}
export async function getAccountBalance(sdk: MetaNamesSdk, address: string, coin: string): Promise<number> {
  // @ts-expect-error - accountRepository.getBalance is not typed in SDK
  try { const b = await sdk.accountRepository?.getBalance?.(address, coin); return typeof b === 'number' ? b : 0; } catch { return 0; }
}

import { MetaNamesSdk, Enviroment } from "@metanames/sdk";
import { config } from "./config";
export function metaNamesSdkFactory(): MetaNamesSdk {
  return new MetaNamesSdk(
    config.isTestnet ? Enviroment.testnet : Enviroment.mainnet,
  );
}
export function getServerSdk(): MetaNamesSdk {
  const env =
    process.env.NEXT_PUBLIC_ENV === "prod"
      ? Enviroment.mainnet
      : Enviroment.testnet;
  const sdk = new MetaNamesSdk(env);
  return sdk;
}

export interface AccountData {
  displayCoins: Array<{
    symbol: string;
    balance: string;
    conversionRate: string;
    balanceAsGas: string;
  }>;
  mpc20Balances: Array<{
    contract: string;
    symbol: string;
    balance: string;
  }>;
}

export const getAccountBalance = async (
  address: string,
): Promise<AccountData> => {
  const response = await fetch("/api/account/balance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });

  const data = await response.json();
  if (!data.data?.account) {
    throw new Error(data.error || "Failed to fetch account balance");
  }
  return data.data.account as AccountData;
};

export const getAccountBalanceForCoin = async (
  address: string,
  coin: string,
): Promise<number> => {
  const account = await getAccountBalance(address);
  const accountCoin = account.displayCoins.find((c) => c.symbol === coin);
  return accountCoin ? parseFloat(accountCoin.balance) : 0;
};

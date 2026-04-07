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
  const body = {
    query: `query AccountSingleQuery($address: BLOCKCHAIN_ADDRESS!) {
      account(address: $address) {
        ...Coins_Account
      }
    }
    fragment Byoc_Account on Account {
      displayCoins {
        symbol
        balance
        conversionRate
        balanceAsGas
      }
      id
    }
    fragment Coins_Account on Account {
      ...Byoc_Account
      ...NonBridgeableCoins_Account
    }
    fragment NonBridgeableCoins_Account on Account {
      mpc20Balances {
        contract
        symbol
        balance
      }
    }`,
    variables: { address },
  };

  const headers = { "Content-Type": "application/json" };
  const response = await fetch(config.browserUrl, {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });

  const data = await response.json();
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

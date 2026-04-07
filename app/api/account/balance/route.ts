import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
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

    const browserUrl =
      process.env.NEXT_PUBLIC_ENV === "prod"
        ? "https://backend.browser.partisiablockchain.com"
        : "https://backend.browser.testnet.partisiablockchain.com";

    const response = await fetch(`${browserUrl}/graphql/query`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error(
        "Browser API error:",
        response.status,
        await response.text(),
      );
      return NextResponse.json({ error: "Browser API error" }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

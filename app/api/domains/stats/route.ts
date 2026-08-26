import { NextResponse } from "next/server";
import { getServerSdk } from "@/lib/sdk";
import { handleError } from "@/lib/server-error";
import { getRecentDomains } from "../_lib";

// Mirrors legacy's getStats() (app-legacy/src/lib/server/index.ts): dedicated
// count()/getOwners() SDK reads run concurrently with the recent-domains
// projection, rather than deriving both from a full getAll() scan. Unlike
// getRecentDomains (which swallows its own getAll() failure), count()/
// getOwners() failures are left to propagate to handleError so a genuine
// backend outage surfaces as a 500 instead of a 200 with zeroed-out stats.
export async function GET() {
  return handleError(async () => {
    const sdk = getServerSdk();

    const [domainCount, ownerCount, recentDomains] = await Promise.all([
      sdk.domainRepository.count(),
      sdk.domainRepository.getOwners().then((owners) => owners.length),
      getRecentDomains(sdk),
    ]);

    return NextResponse.json(
      { domainCount, ownerCount, recentDomains },
      { headers: { "Cache-Control": "max-age=600" } },
    );
  });
}

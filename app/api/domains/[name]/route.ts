import { NextRequest, NextResponse } from "next/server";
import { getServerSdk } from "@/lib/sdk";
import { handleError } from "@/lib/server-error";

// Mirrors legacy's /api/domains/[name] (app-legacy/src/routes/api/domains/[name]/+server.ts):
// the name is passed straight to domainRepository.find with no ".mpc"
// auto-append. Every caller (lib/domain-validator.ts's normalizeDomain)
// already appends ".mpc" before hitting this route, so removing the
// route-level append changes nothing for real requests.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  return handleError(async () => {
    const domain = await getServerSdk().domainRepository.find(name);

    return NextResponse.json({
      domain: domain ? JSON.parse(JSON.stringify(domain)) : null,
    });
  });
}

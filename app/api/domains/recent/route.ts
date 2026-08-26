import { NextResponse } from "next/server";
import { getServerSdk } from "@/lib/sdk";
import { handleError } from "@/lib/server-error";
import { getRecentDomains } from "../_lib";

// Mirrors legacy's /api/domains/recent (app-legacy/src/routes/api/domains/recent/+server.ts):
// {name, createdAt} projection, count of 12 (not 10), and a private
// `max-age=600` cache header (not a shared `s-maxage`).
export async function GET() {
  return handleError(async () => {
    const recentDomains = await getRecentDomains(getServerSdk());

    return NextResponse.json(recentDomains, {
      headers: { "Cache-Control": "max-age=600, public" },
    });
  });
}

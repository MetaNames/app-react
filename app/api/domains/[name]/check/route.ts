import { NextRequest, NextResponse } from "next/server";
import { getServerSdk } from "@/lib/sdk";
import { handleError } from "@/lib/server-error";
import { validateDomainName } from "@/lib/domain-validator";

// Mirrors legacy's /api/domains/[name]/check
// (app-legacy/src/routes/api/domains/[name]/check/+server.ts):
// - No ".mpc" auto-append (see sibling route.ts for why that's safe).
// - Parent resolution comes from the SDK's analyze(), not a hand-rolled
//   split on ".".
// - The parent is only looked up when the domain itself was NOT found, and
//   only when the parent segment isn't the TLD itself — skipping needless
//   lookups and avoiding a false "parent present" for a bare TLD.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  // `analyze()` runs the SDK's DomainValidator, which *throws* on a name that
  // breaks its rules (notably the 32-char cap including ".mpc"). Rejecting
  // those up front keeps a malformed request a client error instead of an
  // unhandled 500 that the register page can only report as "failed to check".
  const validation = validateDomainName(name);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  return handleError(async () => {
    const sdk = getServerSdk();
    const analyzed = sdk.domainRepository.analyze(name);
    const domain = await sdk.domainRepository.find(name);
    const parentDomainName = analyzed.parentId;
    const tld = analyzed.tld;

    let parentDomain = null;
    if (!domain && parentDomainName && parentDomainName !== tld) {
      parentDomain = await sdk.domainRepository.find(parentDomainName);
    }

    return NextResponse.json({
      domainPresent: !!domain,
      parentPresent: !!parentDomain,
    });
  });
}

import type { BYOCSymbol, DomainCheckResponse, FeesResponse } from './types';
export async function fetchDomain(name: string) {
  const res = await fetch(`/api/domains/${encodeURIComponent(name)}`);
  if (!res.ok) return null;
  return (await res.json()).domain ?? null;
}
export async function checkDomain(name: string): Promise<DomainCheckResponse> {
  const res = await fetch(`/api/domains/${encodeURIComponent(name)}/check`);
  if (!res.ok) return { domainPresent: false, parentPresent: false };
  return res.json();
}
export async function fetchRegistrationFees(name: string, coin: BYOCSymbol): Promise<FeesResponse | null> {
  const res = await fetch(`/api/register/${encodeURIComponent(name)}/fees/${coin}`);
  if (!res.ok) return null;
  return res.json();
}

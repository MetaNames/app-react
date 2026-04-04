import type { BYOCSymbol, Domain, DomainCheckResponse, FeesResponse } from './types';
export async function fetchDomain(name: string): Promise<{ data: Domain | null; error: string | null }> {
  try {
    const res = await fetch(`/api/domains/${encodeURIComponent(name)}`);
    if (!res.ok) return { data: null, error: `HTTP error ${res.status}` };
    const json = await res.json();
    return { data: json.domain ?? null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to fetch domain' };
  }
}
export async function checkDomain(name: string): Promise<{ data: DomainCheckResponse | null; error: string | null }> {
  try {
    const res = await fetch(`/api/domains/${encodeURIComponent(name)}/check`);
    if (!res.ok) return { data: null, error: `HTTP error ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to check domain' };
  }
}
export async function fetchRegistrationFees(name: string, coin: BYOCSymbol): Promise<{ data: FeesResponse | null; error: string | null }> {
  try {
    const res = await fetch(`/api/register/${encodeURIComponent(name)}/fees/${coin}`);
    if (!res.ok) return { data: null, error: `HTTP error ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to fetch fees' };
  }
}

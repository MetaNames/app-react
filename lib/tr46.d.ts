// Minimal ambient types for the `tr46` package (it ships no types and no
// @types package exists). Only `toUnicode` — the one member
// `lib/domain-validator.ts` uses — is declared, so the declaration cannot
// drift from an API we never call.
declare module "tr46" {
  export interface TR46Options {
    checkHyphens?: boolean;
    checkBidi?: boolean;
    checkJoiners?: boolean;
    useSTD3ASCIIRules?: boolean;
    processingOption?: "transitional" | "nontransitional";
    verifyDNSLength?: boolean;
  }

  export function toUnicode(
    domainName: string,
    options?: TR46Options,
  ): { domain: string; error: boolean };
}

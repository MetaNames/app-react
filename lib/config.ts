import { optionalEnv } from "./env";

type Environment = "test" | "prod";

// Anything that is not explicitly "test" selects mainnet, so a blank or literally
// "undefined" NEXT_PUBLIC_ENV must not fall through to it: `||` only guards against
// falsy values that happen to include "", but a platform that stringifies a missing
// var to "undefined" would still select prod. `optionalEnv` guards both.
const environment: Environment =
  optionalEnv(process.env.NEXT_PUBLIC_ENV, "test") === "test" ? "test" : "prod";

// One row per environment so Sentry's trace sample rate is picked in a single lookup.
const SENTRY_TRACES_SAMPLE_RATE: Record<Environment, number> = {
  test: 1.0,
  prod: 0.1,
};

export const config = {
  environment,
  landingUrl: optionalEnv(
    process.env.NEXT_PUBLIC_LANDING_URL,
    "https://metanames.app",
  ),
  websiteUrl: optionalEnv(
    process.env.NEXT_PUBLIC_WEBSITE_URL,
    "https://app.metanames.app/",
  ),
  contractDisabled:
    optionalEnv(process.env.NEXT_PUBLIC_CONTRACT_DISABLED, "false") === "true",
  // Centralized here (mirroring legacy's config.ts) so callers never read
  // NEXT_PUBLIC_SENTRY_DSN/SENTRY_DSN directly. No DSN is hardcoded: an unset
  // value falls back to an empty string, which callers treat as "Sentry disabled".
  sentryDsn: optionalEnv(
    process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN,
    "",
  ),
  get sentryTracesSampleRate() {
    return SENTRY_TRACES_SAMPLE_RATE[this.environment];
  },
  get isTestnet() {
    return this.environment === "test";
  },
  get browserUrl() {
    return this.isTestnet
      ? "https://browser.testnet.partisiablockchain.com"
      : "https://browser.partisiablockchain.com";
  },
  get chainId() {
    return this.isTestnet
      ? "Partisia Blockchain Testnet"
      : "Partisia Blockchain";
  },
  get sdkEnvironment() {
    return this.isTestnet ? "testnet" : "mainnet";
  },
  get tldMigrationProposalContractAddress() {
    return this.isTestnet
      ? "03e8b7d9c2a0b3c4f8e7a6d5c4b3a2e1f0d9c8b7a6"
      : "04b3b6b2d5b0a46a0c7c09c8a03c47b17c4c6a97b0";
  },
};

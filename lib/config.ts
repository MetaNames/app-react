export const config = {
  environment: (process.env.NEXT_PUBLIC_ENV || "test") as "test" | "prod",
  landingUrl: process.env.NEXT_PUBLIC_LANDING_URL || "https://metanames.app",
  websiteUrl:
    process.env.NEXT_PUBLIC_WEBSITE_URL || "https://app.metanames.app",
  contractDisabled: process.env.NEXT_PUBLIC_CONTRACT_DISABLED === "true",
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

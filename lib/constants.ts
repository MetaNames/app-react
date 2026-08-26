import { RecordClassEnum } from "@metanames/sdk";

/**
 * UI metadata for the record classes the app offers, keyed by the SDK's
 * `RecordClassEnum` member name. The numeric `value` is derived directly
 * from the enum rather than hardcoded, so it can never drift from the
 * on-chain contract again (see lib/__tests__/constants.test.ts).
 *
 * The offered set mirrors app-legacy's `socialRecords` + `profileRecords`
 * (Twitter, Discord, Bio, Email, Uri, Wallet, Price). `Avatar` and `Main`
 * exist on-chain but are not offered here, matching legacy; the previously
 * invented `AAAA`, `Signature`, `Text`, and `Address` classes do not exist
 * in the SDK enum at all and have been removed.
 */
export const RECORD_CLASS_MAP: Record<
  string,
  { label: string; placeholder: string; maxLength: number; value: number }
> = {
  Bio: {
    label: "Bio",
    placeholder: "Short bio",
    maxLength: 64,
    value: RecordClassEnum.Bio,
  },
  Email: {
    label: "Email",
    placeholder: "user@example.com",
    maxLength: 64,
    value: RecordClassEnum.Email,
  },
  Twitter: {
    label: "Twitter",
    placeholder: "@username",
    maxLength: 64,
    value: RecordClassEnum.Twitter,
  },
  Discord: {
    label: "Discord",
    placeholder: "user#1234",
    maxLength: 64,
    value: RecordClassEnum.Discord,
  },
  Wallet: {
    label: "Wallet",
    placeholder: "Wallet address",
    maxLength: 64,
    value: RecordClassEnum.Wallet,
  },
  Price: {
    label: "Price",
    placeholder: "Number in PCT",
    maxLength: 20,
    value: RecordClassEnum.Price,
  },
  Uri: {
    label: "Url",
    placeholder: "https://example.com",
    maxLength: 64,
    value: RecordClassEnum.Uri,
  },
};

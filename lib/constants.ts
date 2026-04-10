export const RECORD_CLASS_MAP: Record<
  string,
  { label: string; placeholder: string; maxLength: number; value: number }
> = {
  Bio: { label: "Bio", placeholder: "Short bio", maxLength: 64, value: 0 },
  Email: {
    label: "Email",
    placeholder: "user@example.com",
    maxLength: 64,
    value: 6,
  },
  Twitter: {
    label: "Twitter",
    placeholder: "@username",
    maxLength: 64,
    value: 2,
  },
  Discord: {
    label: "Discord",
    placeholder: "user#1234",
    maxLength: 64,
    value: 1,
  },
  Wallet: {
    label: "Wallet",
    placeholder: "Wallet address",
    maxLength: 64,
    value: 4,
  },
  Price: {
    label: "Price",
    placeholder: "Number in PCT",
    maxLength: 20,
    value: 5,
  },
  Uri: {
    label: "Url",
    placeholder: "https://example.com",
    maxLength: 64,
    value: 3,
  },
  Avatar: {
    label: "Avatar",
    placeholder: "https://avatar.example.com",
    maxLength: 64,
    value: 7,
  },
  AAAA: { label: "AAAA", placeholder: "IPv6 address", maxLength: 45, value: 9 },
  Signature: {
    label: "Signature",
    placeholder: "Signature",
    maxLength: 150,
    value: 10,
  },
  Main: {
    label: "Main",
    placeholder: "Main address",
    maxLength: 64,
    value: 11,
  },
  Text: { label: "Text", placeholder: "Any text", maxLength: 64, value: 12 },
  Address: {
    label: "Address",
    placeholder: "Partisia address (42 chars)",
    maxLength: 42,
    value: 8,
  },
};


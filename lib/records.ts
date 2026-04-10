import type { RecordClass, RecordRepository } from "./types";
import type { MetaNamesSdk } from "@metanames/sdk";

export function validateRecordValue(
  type: RecordClass,
  value: string,
): string | null {
  if (!value?.trim()) return "Value is required";
  if (value.length > 64) return "Max 64 characters";
  if (["Uri", "Avatar"].includes(type)) {
    try {
      new URL(value);
    } catch {
      return "Must be a valid URL";
    }
  }
  if (
    type === "Email" &&
    !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
  )
    return "Must be a valid email";
  if (type === "Price" && (value === "" || isNaN(Number(value))))
    return "Must be a number";
  return null;
}
export const isUrlRecord = (type: RecordClass) =>
  ["Uri", "Avatar"].includes(type);

/**
 * Fetch the SDK Domain object and derive its RecordRepository.
 * This is the correct pattern: find the domain first, then call getRecordRepository.
 */
export async function createRecordRepository(
  sdk: MetaNamesSdk,
  domainName: string,
): Promise<RecordRepository | null> {
  const sdkDomain = await sdk.domainRepository.find(domainName);
  if (!sdkDomain) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (sdkDomain as any).getRecordRepository(sdk) as RecordRepository;
}

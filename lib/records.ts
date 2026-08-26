import type { RecordClass, RecordRepository } from "./types";
import { RECORD_CLASS_MAP } from "./constants";
import { getRecordValidator, type MetaNamesSdk } from "@metanames/sdk";

/**
 * Friendly, short error messages shown in the UI. The SDK's own validator
 * messages (e.g. "Invalid email format") are still used as the source of
 * truth for pass/fail, but we keep the app's existing copy for the cases
 * that already had a dedicated message.
 */
function friendlyMessage(type: RecordClass, sdkErrors: string[]): string {
  if (type === "Uri") return "Must be a valid URL";
  if (type === "Email") return "Must be a valid email";
  if (type === "Price") return "Must be a number";
  return sdkErrors[0] ?? "Invalid value";
}

export function validateRecordValue(
  type: RecordClass,
  value: string,
): string | null {
  if (!value?.trim()) return "Value is required";

  const classInfo = RECORD_CLASS_MAP[type];
  if (!classInfo) return `Unsupported record type: ${type}`;

  if (value.length > 64) return "Max 64 characters";

  const validator = getRecordValidator(classInfo.value);
  const valid = validator.validate(
    { class: classInfo.value, data: value },
    { raiseError: false },
  );
  if (!valid) {
    return friendlyMessage(type, validator.getErrors());
  }
  return null;
}

export const isUrlRecord = (type: RecordClass) => type === "Uri";

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

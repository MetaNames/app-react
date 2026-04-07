import { getServerSdk } from "@/lib/sdk";
import type { MetaNamesSdk } from "@metanames/sdk";

let sdkInstance: MetaNamesSdk | null = null;

export function getServerSdkInstance(): MetaNamesSdk {
  if (!sdkInstance) {
    sdkInstance = getServerSdk();
  }
  return sdkInstance;
}

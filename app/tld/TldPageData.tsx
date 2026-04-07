import { getTldData } from "@/lib/data/tld";
import type { Domain } from "@/lib/types";

interface TldPageDataProps {
  children: (tldDomain: Domain) => React.ReactNode;
}

export async function TldPageData({ children }: TldPageDataProps) {
  const tldDomain = await getTldData();
  return <>{children(tldDomain)}</>;
}
